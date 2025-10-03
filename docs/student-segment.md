# Performance Segmentation — **v3 (No New Files Required)**
*Transforms ONLY the original inputs into the KPIs and segments for the app’s static dashboards and topic insights.*

This version **does not require** any new activity file. It relies on `grade_book.csv`, `submissions.csv`, `structure.csv`, and (optionally) `meetings.csv`, `step‑stats.csv`, `time‑to‑complete.csv`, `step‑difficulty‑discrimination.csv`.


## 0) Inputs (original files only)
**Required**
- `grade_book.csv` — `user_id`, `total`
- `learners.csv` — `user_id`, `first_name`, `last_name`
- `submissions.csv` — `user_id`, `step_id`, `status`, `timestamp`

**Optional**
- `structure.csv` — `step_id` + lesson/topic columns (if titles missing, fall back to `"Module {module_position} — Lesson {lesson_position}"`)
- `meetings.csv` — `user_id`, `name`, columns like `"[dd.mm.yyyy] …"` with 0/1
- `step-stats.csv` — cohort medians per step (attempts, first‑pass rate)
- `step-difficulty-discrimination.csv` — IRT difficulty `b` and discrimination `a`
- `time-to-complete.csv` — module/lesson time (if present)


## 1) Preprocessing
- Normalize aliases as in the dynamic algorithm (`user_id`, `status`, `timestamp`).
- Build learner `name` from `first_name` + `last_name` (fallback `"NA"`).
- From `grade_book`: compute `max_total` across cohort and `total_pct = round(total/max_total*100,1)` (guard if `max_total=0`).


## 2) Core Per‑User KPIs (from submissions and grade_book)
From **submissions**:
```
submissions        = count(*)
unique_steps       = n_distinct(step_id)
correct_submissions= count(status == "correct")
success_rate       = round(correct_submissions / submissions * 100, 1)   # guard
persistence        = round(submissions / unique_steps, 2)                 # guard
efficiency         = round(correct_submissions / unique_steps, 2)         # guard
```

Temporal coverage (from `timestamp` only — no new files needed):
```
active_days        = n_distinct(UTC(timestamp).date())
span_days          = max(1, max(date) - min(date))
active_days_ratio  = round(active_days / span_days, 3)
```


## 3) Meetings KPIs (optional)
Parse dates from header `"[dd.mm.yyyy] Title"`:
```
meetings_total         = number of date-like columns
meetings_attended      = Σ 1{value == 1} across those columns for the user
meetings_attended_pct  = round(meetings_attended / meetings_total * 100, 1)  # guard
```


## 4) Topic‑Level Difficulty/Ease (per student, no extra files)
Map each submission’s `step_id` to a **topic/lesson** via `structure.csv` (if no human titles, use `"Module X — Lesson Y"` from positions). For each (student, topic):

1) Build per‑step attempts and first‑pass:
```
attempts(user, step)    = count submissions for the (user, step)
first_pass(user, step)  = 1 if the earliest submission is "correct", else 0 (unknown → NaN)
```

2) Compare with cohort (needs `step-stats.csv`; if not present, compute medians across all users on the fly):
```
median_attempts(step)          # cohort median attempts per (user, step)
step_first_pass_rate(step)     # cohort mean of first_pass
delta_attempts = attempts(user, step) - median_attempts(step)
delta_first    = first_pass(user, step) - step_first_pass_rate(step)
```

3) (Optional) Correct by IRT if you have `step-difficulty-discrimination.csv`:
- Down‑weight gaps on very hard steps (high `b`), up‑weight on diagnostic steps (high `a`).

4) Topic aggregation:
```
attempts_per_step_topic         = Σ attempts / n_unique_steps_in_topic
topic_score (0..100, higher=worse) =
  scale( 0.7 * mean( max(0, delta_attempts) ) 
       + 0.3 * mean( max(0, -delta_first) )   # worse-than-cohort first pass
       , to 0..100 )
label_topic ∈ {Attention, Watch, Comfortable} by thresholds (e.g., ≥70, 40..70, ≤20)
```
> These topic scores feed the app’s **heatmap** and the per‑student “strong/weak topics” lists — without any new inputs.


## 5) Effort / Consistency / Struggle (without new activity files)
We avoid adding new files and reuse what we already have:

- **effort_index** = z‑score of `submissions` ⊕ z‑score of `active_days`  
  (if one is missing or degenerate, fall back to the other)
- **consistency_index** = `active_days_ratio` (Section 2)
- **struggle_index** (0..1) from submission signals only:  
  normalize each component to [0..1] and combine  
  `0.5 * norm(mean_positive_delta_attempts) + 0.5 * norm(mean_negative_delta_first)`

> If `step-difficulty-discrimination.csv` exists, compute *unexpected difficulty* residuals and include them; else skip.


## 6) Simple Segmentation Rules (revised, no new files)
Suggested rule set (priority order; tune to your cohort):

1. **Leader engaged** → `total_pct ≥ 80` **and** `meetings_attended_pct ≥ 70` *(if meetings exist)*
2. **Leader efficient** → `total_pct ≥ 80` **and** `persistence ≤ 3` **and** `consistency_index ≥ 0.5`
3. **Balanced + engaged** → `30 ≤ total_pct < 80` **and** `meetings_attended_pct ≥ 60` **and** `consistency_index ≥ 0.4` *(if meetings exist)*
4. **Hardworking but struggling** → `total_pct < 80` **and** `effort_index ≥ +0.5` **and** `struggle_index ≥ 0.6`
5. **Low engagement** → `(total_pct < 30 && submissions < 20)` **or** `(effort_index ≤ −0.5 && active_days_ratio < 0.3)`
6. **Balanced middle** → else


## 7) Outputs (what the app expects)
**A) Per‑user summary (CSV)**
```
user_id, name,
total, total_pct,
submissions, unique_steps, correct_submissions, success_rate, persistence, efficiency,
active_days, active_days_ratio,
effort_index, consistency_index, struggle_index,
meetings_attended, meetings_attended_pct,            # if meetings exist
simple_segment
```

**B) Topic difficulty table (per student, for details & heatmaps)**
```
user_id, name, topic_title, steps_attempted,
attempts_per_step, student_first_pass_rate,
mean_delta_attempts, mean_delta_first, topic_score, label_topic
```

These outputs drive the **Results table**, **Student detail**, and the **topic heatmap** — **without** creating or uploading any new input tables.
