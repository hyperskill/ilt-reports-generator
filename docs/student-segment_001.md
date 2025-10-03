# Algorithm for Building the Final Table (Segmentation)

## 0) Input Files
Required:
- `grade_book.csv` → `user_id`, `total`
- `learners.csv` → `user_id`, `first_name`, `last_name`
- `submissions.csv` → `user_id`, `step_id`, `status`

Additional:
- `meetings.csv` → `user_id`, `name`, followed by N activity columns (values: `TRUE/FALSE`, `1/0`, `yes/no`)

Optional:
- `excludedUserIds` — list of users to exclude early.

---

## 1) Normalization & Preprocessing
1. Standardize column names:
   - `user_id` ∈ `["user_id","UserId","uid","user"]`
   - `total` ∈ `["total","Total","score","points"]`
   - `first_name` ∈ `["first_name","firstName","FirstName","first"]`
   - `last_name` ∈ `["last_name","lastName","LastName","last"]`
   - `step_id` ∈ `["step_id","StepId","step","task_id"]`
   - `status` ∈ `["status","Status","result"]`
2. Cast types: `user_id → int`, `total → float`.
3. Exclude `excludedUserIds` if provided.
4. Build `name = trim(first_name + " " + last_name)` or `"NA"` if missing.

---

## 2) Core Metrics
From **grade_book**:
- Keep `total`.
- Compute `max_total = max(total)` (if empty → 0).

From **submissions**:
- Add `is_correct = (lower(status) == "correct" ? 1 : 0)`.
- Group by `user_id`:
  - `submissions = count(*)`
  - `unique_steps = number of distinct step_id`
  - `correct_subs = sum(is_correct)`

---

## 3) Meetings
From **meetings.csv**:
1. Identify meeting columns (all after `user_id` and `name` if present).
2. Normalize values: `{true,"true","yes",1}→1; {false,"false","no",0,"",null}→0`.
3. If a user appears multiple times, first aggregate: sum flags per meeting (limit to 1 if binary presence needed).
4. For each user:
   - `meetings_attended = sum of flags`
   - `meetings_total = number of meeting columns` (internal)
   - `meetings_attended_pct = (meetings_total > 0) ? round(meetings_attended/meetings_total * 100,1) : 0.0`

---

## 4) Data Join
Perform LEFT JOINs on `user_id`:

```
df = grade_book
  LEFT JOIN learners        ON user_id
  LEFT JOIN submissions_agg ON user_id
  LEFT JOIN meetings_agg    ON user_id
```

Fill missing with zeros: `submissions`, `unique_steps`, `correct_subs`, `meetings_attended`, `meetings_attended_pct`.

---

## 5) Derived Learning Metrics
(Guard against division by zero.)
- `total_pct    = (max_total > 0) ? round(total/max_total*100,1) : 0.0`
- `success_rate = (submissions > 0) ? round(correct_subs/submissions*100,1) : 0.0`
- `persistence  = (unique_steps > 0) ? round(submissions/unique_steps,2) : 0.0`
- `efficiency   = (unique_steps > 0) ? round(correct_subs/unique_steps,2) : 0.0`

---

## 6) Segmentation (with meetings)

### Thresholds
- High achiever: `total_pct >= 80`
- Low achiever: `total_pct < 30`
- Low persistence: `persistence <= 3`
- Low submissions: `submissions < 20`
- High external engagement:
  - leaders: `meetings_attended_pct >= 70`
  - middle: `meetings_attended_pct >= 60`
  - low: `meetings_attended_pct >= 50`

### Rules (priority order)
1. **Leader engaged** → `total_pct >= 80 && meetings_attended_pct >= 70`
2. **Leader efficient** → `total_pct >= 80 && persistence <= 3`
3. **Balanced + engaged** → `30 <= total_pct < 80 && meetings_attended_pct >= 60`
4. **Low engagement but socially active** → `total_pct < 30 && meetings_attended_pct >= 50`
5. **Hardworking but struggling** → `total_pct < 30 && persistence >= 5`
6. **Low engagement** → `total_pct < 30 && submissions < 20`
7. **Balanced middle** → else

---

## 7) Final Table Columns
```
[
  "user_id",
  "name",
  "total_pct",
  "submissions",
  "unique_steps",
  "success_rate",
  "persistence",
  "efficiency",
  "total",
  "simple_segment",
  "meetings_attended",
  "meetings_attended_pct"
]
```
Default sorting: `total_pct` descending.

---

## 8) Export
Export to CSV (UTF-8, comma delimiter).  
First row: headers.  
Numbers: dot as decimal separator, with rounding as specified.

---

## 9) Segmentation Function (pseudo-code)
```js
function segment(u) {
  const leader = u.total_pct >= 80;
  const low    = u.total_pct < 30;

  if (leader && u.meetings_attended_pct >= 70) return "Leader engaged";
  if (leader && u.persistence <= 3)            return "Leader efficient";
  if (!leader && !low && u.meetings_attended_pct >= 60) return "Balanced + engaged";
  if (low && u.meetings_attended_pct >= 50)    return "Low engagement but socially active";
  if (low && u.persistence >= 5)               return "Hardworking but struggling";
  if (low && u.submissions < 20)               return "Low engagement";
  return "Balanced middle";
}
```
