# Dynamic / Easing Segmentation — **v3 (No New Files Required)**
*Transforms ONLY the original inputs into the time‑series and summary needed for the app’s dynamic (CSS‑easing) visualizations.*

This version **does not require** an `activity-generated.csv`. It builds the daily activity strictly from your existing tables (primarily `submissions.csv`, plus `meetings.csv` if present).


## 0) Inputs (original files only)
**Required**
- `learners.csv` — `user_id`, `first_name`, `last_name`
- `submissions.csv` — `user_id`, `step_id`, `status`, `timestamp`

**Optional (used when available)**
- `meetings.csv` — `user_id`, `name`, columns like `"[dd.mm.yyyy] Webinar. …"` (values: 0/1)
- `grade_book.csv` — `user_id`, `total` (used only for context columns in the summary)
- `structure.csv` — `step_id` + (any of) titles (`lesson_title`/`topic_title` etc.); if not present, we’ll still run without titles
- `time-to-complete.csv`, `step-stats.csv`, `step-difficulty-discrimination.csv` — not required for the dynamic curves (used in performance analytics; ignored here)


## 1) Preprocessing & Normalization
- Standardize column aliases:
  - `user_id` ∈ {`user_id`, `UserId`, `uid`, `user`}
  - `timestamp` ∈ {`timestamp`, `time`, `submission_time`, `created_at`} (parse to UTC)
  - `status` ∈ {`status`, `Status`, `result`} → lowercased strings
- Drop rows missing `user_id` or `timestamp`.
- Build learner name: `name = trim(first_name + " " + last_name)` (fallback `"NA"`).


## 2) Daily Activity From Submissions (no external activity file)
We derive a **platform activity score per day** from submissions only.

**2.1. Collapse to per‑user‑day**
```
date = UTC(timestamp).date()
attempt_weight(status) = 1.0 if status == "correct" else 0.25   # tweakable
platform_events_d[user_id, date] = Σ attempt_weight
```
> Rationale: this captures both the presence and partial intensity of work without inventing new files.

**(Optional) Anti‑spam cap**  
Cap daily value per user to the 99th cohort percentile to avoid extreme outliers:  
`platform_events_d := min(platform_events_d, P99_all_users)`

**2.2. Meetings (if present)**
Parse meeting dates from column headers with regex: `/^\[(\d{2})\.(\d{2})\.(\d{4})\]/`.  
For each user and date: `meetings_d[user_id, date] = 1` iff attended; else 0.


## 3) Composite Daily Activity
Combine sources that we **already have** (submissions and, optionally, meetings):

```
activity_d[user_id, date] = α * platform_events_d[user_id, date]
                          + β * meetings_d[user_id, date]         # if present
```

Recommended defaults: `α = 1.0`, `β = 1.5`.  
> You can tune `β` to reflect how much a webinar attendance should “move” progress relative to one submission.


## 4) Build Normalized Cumulative Curve
For each learner:
- Let `dates = sorted(unique dates where activity_d > 0)`.
- Span: `T0 = min(dates)`, `T1 = max(dates)`, `span_days = max(1, T1 - T0)`
- Cumulative: `cum[date] = Σ_{τ ≤ date} activity_d[τ]`
- Normalize to [0..1]:
  - `x(date) = (date - T0) / span_days`
  - `y(date) = cum[date] / max(ε, cum[T1])`
- (Optional) Smooth `activity_d` with a small 3–7 day median filter before cumulation if the curve is too spiky.


## 5) Quartiles → Cubic Bezier Proxy
- `t25`, `t50`, `t75` are the smallest `x` where `y ≥ 0.25/0.50/0.75` respectively.
- Bezier control points: `P1 = (t25, 0.25)`, `P2 = (t75, 0.75)`; `P0=(0,0)`, `P3=(1,1)`.
- **Frontload Index**: `FI = 0.5 - t50` (early‑heavy if `FI > 0`, late‑heavy if `FI < 0`).


## 6) CSS‑Easing Classification
Compute the distance (e.g., RMSE at 101 uniform x‑samples) to canonical CSS curves:
`linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`.  
Pick the minimum; if ties are tight, break with `FI` and `(t75 - t25)` as before.

**Auxiliary dynamics** (for the UI, from the same daily series):
- `consistency = (#days with activity_d > 0) / span_days`
- `burstiness = std(activity_d) / mean(activity_d)` (winsorize extremes first)


## 7) Outputs (what the app expects)
**A) Per‑user summary (CSV)**
```
user_id, name,
bezier_p1x, bezier_p1y, bezier_p2x, bezier_p2y,
t25, t50, t75, frontload_index, easing_label,
consistency, burstiness,
total, total_pct            # optional, from grade_book if available
```

**B) Per‑user daily series (CSV)**
```
user_id, date_iso, day_index, x_norm,
activity_platform, activity_meetings, activity_total,   # per source + sum
cum_activity, y_norm
```

> These two tables are sufficient to render the mode’s overview table, the per‑student curve view, and cohort overlays — **without** any extra input files.
