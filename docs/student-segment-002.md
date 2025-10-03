# Performance Segmentation (v2, with `activity.csv` at start)
*Updated to ingest the **activity** table and refine metrics and rules.*

This version extends the earlier rule‑based segmentation with **effort**, **consistency**, and **struggle** signals derived from `activity.csv`, while keeping meetings‑aware logic.


## 0) Input Files
Required:
- `grade_book.csv` → `user_id`, `total`
- `learners.csv` → `user_id`, `first_name`, `last_name`
- `submissions.csv` → `user_id`, `step_id`, `status`
- `activity.csv` → `user_id`, time field (`timestamp` or `date`), intensity fields (`active_minutes` preferred; optional `sessions`, `events`)

Optional:
- `meetings.csv` → `user_id`, `name`, then N columns like `"[dd.mm.yyyy] Webinar. Topic"`
- `excludedUserIds` — list of users to exclude early


## 1) Normalization & Preprocessing
1. Standardize columns (aliases):  
   - `user_id` ∈ `["user_id","UserId","uid","user"]`  
   - `total` ∈ `["total","Total","score","points"]`  
   - `status` ∈ `["status","Status","result"]`  
   - activity time ∈ `["timestamp","time","date"]`, minutes ∈ `["active_minutes","minutes","total_minutes"]`, sessions ∈ `["sessions","session_count"]`
2. Cast types: `user_id → int`, `total → float`, timestamps → UTC date for bucketing.
3. Exclude `excludedUserIds`.
4. Build `name = trim(first_name + " " + last_name)` (fallback `"NA"`).


## 2) Core Metrics (submissions & grade_book as before)
From **grade_book**:
- `total`, `max_total` → `total_pct = round(total/max_total * 100, 1)` (guard if `max_total == 0`).

From **submissions**:
- `submissions = count(*)`, `unique_steps = n_distinct(step_id)`
- `correct_subs = sum(status == "correct")`
- `success_rate = round(correct_subs / submissions * 100, 1)` (guard).  
- `persistence  = round(submissions / unique_steps, 2)` (guard).  
- `efficiency   = round(correct_subs / unique_steps, 2)` (guard).


## 3) Activity‑Derived Signals (NEW)
Aggregate **per day** for each user:
- `active_minutes_total` = Σ minutes
- `active_days` = count of days with minutes > 0
- `days_total` = course span in days (or observed span)

Derived:
- `active_days_ratio = round(active_days / days_total, 3)`
- `median_session_minutes` (if sessions & durations exist; else omit)
- `sessions_count` (sum over the course, if available)
- `effort_index = z(active_minutes_total) ⊕ z(sessions_count)` — standardized and combined (mean 0, sd 1; if one missing, use the other)
- `consistency_index = active_days_ratio`
- `struggle_index` (optional if events exist): weighted combination of `hint_rate`, `backtrack_rate`, `long_pause_ratio` (normalize each 0..1, then `0.5*hint + 0.3*backtrack + 0.2*pause`)

> Keep raw values alongside indices for transparency.


## 4) Meetings (as before)
- `meetings_attended`, `meetings_total`, `meetings_attended_pct = round(attended/total*100,1)` (guard).  
- Use binary attendance by date parsed from column headers.


## 5) Join
LEFT‑join aggregates by `user_id`:
```
df = grade_book
  LEFT JOIN learners
  LEFT JOIN submissions_agg
  LEFT JOIN activity_agg
  LEFT JOIN meetings_agg
```
Fill missing numeric fields with zeros (or neutral values for indices).


## 6) Segmentation Rules (revised)
Start with earlier thresholds and add activity signals:

**Base thresholds**
- High achiever: `total_pct >= 80`
- Low achiever: `total_pct < 30`
- Low persistence: `persistence <= 3`
- Low submissions: `submissions < 20`

**Activity thresholds (suggested)**
- High effort: `effort_index >= +0.5`
- Low effort:  `effort_index <= -0.5`
- Consistent:  `active_days_ratio >= 0.5`
- Low consistency: `active_days_ratio < 0.3`
- High struggle: `struggle_index >= 0.6` (if computed)

**Rules (priority order)**
1. **Leader engaged** → `total_pct >= 80 && meetings_attended_pct >= 70`
2. **Leader efficient** → `total_pct >= 80 && persistence <= 3 && consistency_index >= 0.5`
3. **Balanced + engaged** → `30 <= total_pct < 80 && meetings_attended_pct >= 60 && consistency_index >= 0.4`
4. **Hardworking but struggling** → `total_pct < 80 && effort_index >= +0.5 && struggle_index >= 0.6`
5. **Low engagement** → `(total_pct < 30 && submissions < 20) || (effort_index <= -0.5 && active_days_ratio < 0.3)`
6. **Balanced middle** → else

> Tune thresholds to your cohort percentiles; indices are relative, so mid‑course recalibration is OK.


## 7) Final Table Columns (v2)
```
user_id, name,
total, total_pct,
submissions, unique_steps, correct_subs, success_rate, persistence, efficiency,
active_minutes_total, sessions_count, active_days_ratio,
effort_index, consistency_index, struggle_index,     # indices if computed
meetings_attended, meetings_attended_pct,
simple_segment
```
Default sort: `total_pct` desc, then `simple_segment`.


## 8) Export
Export CSV in UTF‑8 with dot decimal separators; include both raw activity values and indices for clarity.  
Keep a data dictionary tab if you share beyond analysts.