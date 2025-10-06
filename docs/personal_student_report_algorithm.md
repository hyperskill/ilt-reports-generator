# Personalized Student Report Algorithm (v1)
*A student-facing, concise, and actionable report built from the two analytics pipelines: **Performance Segmentation v3** and **Dynamic/Easing Segmentation v3**. This document describes how to transform existing course data into a focused per-student report. No new input files are required.*

---

## 0) Purpose & Principles
**Goal:** Show each learner only what matters to them right now: a short summary, strengths, focus areas, a tiny progress signal, and 2–3 next steps — in supportive language.

**Principles**
- Student-first, not admin: minimal numbers, plain English, clear actions.
- Personal selection: pick the top signals relevant to *this* learner.
- Graceful degradation: report still renders if meetings, titles, or timestamps are missing.
- Transparency: every conclusion ties back to computed signals.

---

## 1) Inputs
The report consumes analytics already computed from original tables (`learners.csv`, `submissions.csv`, `grade_book.csv`, optional `meetings.csv`, optional `structure.csv`). Use the v3 pipelines described earlier.

**Required (per learner)**
- From **Performance v3 summary**:  
  `total`, `total_pct`, `submissions`, `unique_steps`, `success_rate`, `persistence`, `efficiency`, `active_days`, `active_days_ratio`, `effort_index`, `consistency_index`, `struggle_index`, and optional `meetings_attended`, `meetings_attended_pct`.
- From **Performance v3 topic table**:  
  For each topic attempted: `topic_title`, `steps_attempted`, `attempts_per_step`, `student_first_pass_rate`, `mean_delta_attempts`, `mean_delta_first`, `topic_score`, `label_topic ∈ {Comfortable, Watch, Attention}`.
- From **Dynamic/Easing v3 summary**:  
  `easing_label ∈ {linear, ease, ease-in, ease-out, ease-in-out}`, `frontload_index (FI)`, `t25/t50/t75`, `consistency` (days active / span), `burstiness` (std/mean).

**Optional**
- **Daily series** (for sparkline): `date_iso`, `activity_platform`, `activity_meetings`, `activity_total` (α·platform + β·meetings).  
- **Structure titles**: if real titles are missing, use `"Module X — Lesson Y"` from positions.

---

## 2) Preprocessing
- Ensure `topic_title` exists per step/topic; fallback: `"Module {module_position} — Lesson {lesson_position}"`.
- Winsorize extreme daily activity at P99 before computing `burstiness` and 7‑day momentum.
- Normalize dates to a single timezone (UTC) and day buckets.

---

## 3) Signal Extraction
**3.1 Wins (positive signals) — candidates**
- `total_pct ≥ 80` OR `success_rate ≥ 85`.
- `consistency_index ≥ 0.5` (or `consistency ≥ 0.5` from easing summary).
- `burstiness ≤ 0.6` (steadier work).
- `FI ≥ +0.10` (early progress; frontloaded).
- Topics labeled **Comfortable** with `student_first_pass_rate ≥ 0.7`.

**3.2 Focus (attention signals) — candidates**
- Topic `label_topic ∈ {Attention, Watch}`. Reasons: `mean_delta_attempts > 0` and/or `mean_delta_first < 0`.
- `struggle_index ≥ 0.6`.
- `active_days_ratio < 0.3`.
- High burstiness: `burstiness > 0.8` (sporadic work pattern).
- Early dropoff: `ease-out` with `t75 < 0.6` (strong start but activity dropped off).
- Late start: `ease-in` with `t25 > 0.4` (slow to begin).

**3.3 Meeting context (optional)**
- If `meetings_attended_pct ≥ 70`: positive note.
- If `meetings_attended_pct < 40` and there are relevant focus topics: nudge to join the next webinar.

---

## 4) Overall Engagement (replaces momentum analysis)
Calculate overall engagement level based on entire course period:
- `avgEngagement = (active_days_ratio + consistency) / 2`
- Classify: **High** (`avgEngagement ≥ 0.6`), **Medium** (`avgEngagement ≥ 0.3`), **Low** (`avgEngagement < 0.3`)
- Generate personalized description using student's first name instead of "you/your"

This replaces the previous momentum analysis (last 7 vs previous 7 days) to focus on overall program results rather than short-term trends.

---

## 5) Topic Selection (lists)
Choose up to **3** topics per list (deduplicated by module if possible).

**Going well (wins)**: pick top `Comfortable` topics by (high `student_first_pass_rate`, low `attempts_per_step`, low `topic_score`).

**Needs attention (focus)**: pick top `Attention/Watch` topics by highest `topic_score`. Attach **reason tag**:
- “extra attempts” if `mean_delta_attempts > +0.5`
- “first-pass low” if `mean_delta_first < −0.2`
- “both” if both conditions hold

Require `steps_attempted ≥ 2` unless there’s no alternative; mark otherwise as “low evidence”.

---

## 6) Next Steps Generator (REMOVED)
**Note**: The Next Steps section has been removed from the student report as it focuses on overall program assessment rather than forward-looking recommendations. The report now emphasizes analysis of completed work rather than future guidance.

---

## 7) Curve Explanation (1 sentence)
Map `easing_label` to a friendly description:
- **linear** — “steady pace throughout”
- **ease** — “gradual, smooth progress overall”
- **ease-in** — “you ramp up later; consider an early start each week”
- **ease-out** — “strong start; keep momentum in the second half”
- **ease-in-out** — “work in waves; try to smooth dips with short sessions”

---

## 8) Assembly Rules
**8.1 Highlights (3–5 bullets)**
- Take top 2 **wins** and top 1–2 **focus** items (from §§3–5).
- Convert each to a single sentence with a plain-English reason.

**8.2 What to hide**
- Remove raw KPIs that do not change recommendations (e.g., show `total_pct` only if it supports a win or a focus point).
- Hide meeting content entirely if `meetings.csv` absent.

**8.3 Tone and privacy**
- Use “compared with the course” phrasing; avoid precise rank/percentile.
- Never blame; pair each focus with a next step.

---

## 9) Output Schema (to render the page)
Minimal JSON for the learner detail component:
```json
{
  "student": {
    "user_id": 1175321,
    "name": "Jane Doe",
    "segment": "Leader efficient",
    "easing": "ease-out"
  },
  "highlights": [
    "Win: Steady weekly rhythm — your consistency is strong.",
    "Focus: Chain Rule needed extra attempts — let’s revisit the first two tasks."
  ],
  "engagement": { "level": "Medium", "description": "Alex has maintained moderate engagement, active on 29 days (85% of the period).", "active_days_ratio": 0.85 },
  "topics": {
    "wins":   [{"title": "Derivatives Basics", "why": "first-pass high"}],
    "focus":  [{"title": "Chain Rule", "why": "extra attempts"}]
  },
  "curve": { "label": "ease-out", "fi": 0.12, "explain": "strong start; keep momentum later" },
  "next_steps": [] // REMOVED: Next Steps section no longer included
}
```

---

## 10) Pseudocode (selection pipeline)
```
for each student s:
  S_perf  = lookup performance summary for s
  T_table = lookup topic table for s
  E_sum   = lookup easing summary for s
  Series  = lookup daily series for s (optional)

  // 1) Build candidate lists
  wins   = []
  focus  = []

  if S_perf.total_pct >= 80 or S_perf.success_rate >= 85: wins.add("achievement")
  if S_perf.consistency_index >= 0.5: wins.add("consistency")
  if E_sum.burstiness <= 0.6: wins.add("steady")
  if E_sum.FI >= 0.10: wins.add("early_progress")

  for t in T_table:
    if t.label_topic == "Comfortable" and t.student_first_pass_rate >= 0.7:
       wins.add( topic(t, reason="first-pass high") )
    if t.label_topic in {"Watch","Attention"}:
       r = reason(t) // attempts↑ / first-pass↓
       focus.add( topic(t, reason=r, score=t.topic_score) )

  if S_perf.struggle_index >= 0.6: focus.add("struggle")
  if S_perf.active_days_ratio < 0.3: focus.add("low_consistency")
  if E_sum.burstiness > 0.8: focus.add("high_burstiness")

  if E_sum.label == "ease-in" and E_sum.t25 > 0.4: focus.add("late_start")
  if E_sum.label == "ease-out" and E_sum.t75 < 0.6: focus.add("early_dropoff")

  // 2) Rank & trim
  wins  = top_k(deduplicate(wins), k=3, priority: topic items > generic KPIs)
  focus = top_k(sort_by_score(focus), k=3)

  // 3) Calculate overall engagement (replaces next steps)
  engagement = calculateEngagement(S_perf, E_sum, studentName)
  // Note: Next steps generation removed - report focuses on assessment, not recommendations

  // 4) Compose narrative (highlights + engagement + curve explanation)
  report = {student, highlights, engagement, topics{wins,focus}, curve, performance, dynamic, series, topicTable}
```

---

## 11) Edge Cases
- **Sparse data / few submissions**: hide curve and momentum; show 1–2 generic suggestions.
- **No titles**: display “Module X — Lesson Y”; logic unchanged.
- **No meetings file**: hide meeting-related sentences and conditions.
- **Conflicting signals**: prefer topic evidence over generic KPIs.
- **Short span (≤ 7 days)**: skip last7 vs prev7; use a “getting started” nudge instead.

---

## 12) Copy Guidelines (tone)
- **Personalization**: Use student's first name instead of "you/your" throughout the report.
- Start with 1–2 wins before any focus.
- Use supportive verbs ("review", "plan", "try"), avoid negatives.
- Keep sentences to ~12–16 words; one idea per bullet.
- Focus on completed work analysis rather than forward-looking recommendations.
