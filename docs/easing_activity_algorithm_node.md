# Dynamic Activity → CSS-Easing Segmentation
*(with `meetings` headers like `[dd.mm.yyyy] Title` and Node.js example code)*

This document explains the algorithm and provides a **Node.js** reference implementation that:
- aggregates **daily activity** from platform submissions and off-platform meetings,
- builds a **normalized cumulative curve** `y(x)` in `[0,1] × [0,1]`,
- estimates a **cubic Bezier** proxy via progress quartiles,
- classifies each student as one of CSS-like easings: `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`,
- outputs **two CSV files**: a **per-user summary** and a **per-user series** (for plotting).

---

## 0) Inputs
- `grade_book.csv` → `user_id`, `total`
- `learners.csv` → `user_id`, `first_name`, `last_name`
- `submissions.csv` → `user_id`, `step_id`, `status`, `timestamp`
- `meetings.csv` → `user_id`, `name`, and N meeting columns with headers like `"[dd.mm.yyyy] Webinar. Agents"`

Optional:
- `excludedUserIds` — list of users to exclude early (apply to all sources).

> Timestamps should be normalized to UTC before daily bucketing.

---

## 1) Daily Activity
**Platform** (from `submissions.csv`):
- Bucket by `date = UTC(timestamp).startOf('day')`
- Weighted count per day (optionally): `correct = 1.0`, `incorrect = 0.25` (if `status` exists)

**Meetings** (from `meetings.csv`):
- Meeting columns start after `user_id` (and optional `name`)
- Parse date from header with regex: `^\[(\d{2})\.(\d{2})\.(\d{4})\]`
- Normalize attendance to 0/1 (truthy: `true, yes, 1`; falsy: `false, no, 0, ""`)
- Build daily counts: add one for `meeting_date` if attended (aggregate duplicates by `max`)

**Mix**:
```
activity_d[date] = α * platform_events_d[date] + β * meetings_d[date]
```
Recommended weights: `α = 1.0`, `β = 1.5` (tweakable).

---

## 2) Normalized Cumulative Curve
For each `user_id`:
- `T0 = min(date)`, `T1 = max(date)` (or clamp to course window)
- `cum[date] = Σ_{τ ≤ date} activity_d[τ]`
- Normalize:
  - `x = (date - T0) / max(1 day, T1 - T0)`
  - `y = cum[date] / max(ε, cum[T1])`
- Optional smoothing: median filter (3–7 days) on daily activity **before** cumulation.

---

## 3) Bezier Proxy (via Quartiles)
- Quartile times on the normalized curve:
  - `t25` = min `x` where `y ≥ 0.25`
  - `t50` = min `x` where `y ≥ 0.50`
  - `t75` = min `x` where `y ≥ 0.75`
- Set control points:
  - `P0 = (0,0)`, `P3 = (1,1)`
  - `P1 = (t25, 0.25)`, `P2 = (t75, 0.75)`
- Frontload index: `FI = 0.5 - t50` (positive → early-loading, negative → late-loading).

---

## 4) CSS-Easing Classification
Canonical curves (cubic Bezier):
- `linear`       → `(0.00, 0.00, 1.00, 1.00)`
- `ease`         → `(0.25, 0.10, 0.25, 1.00)`
- `ease-in`      → `(0.42, 0.00, 1.00, 1.00)`
- `ease-out`     → `(0.00, 0.00, 0.58, 1.00)`
- `ease-in-out`  → `(0.42, 0.00, 0.58, 1.00)`

Compute distances by sampling (t=0..1 step 0.01) both curves and comparing `y`-values:
```
dist(label) = sqrt( mean_t( (y_label(t) - y_user(t))^2 ) )
```
Pick the minimal distance. If distances are similar, fallback to FI-heuristics:
- `FI > +0.10` → `ease-out`
- `FI < -0.10` → `ease-in`
- `| (t75 - t25) - 0.50 | < 0.10` → `linear`
- else → `ease-in-out`

---

## 5) Outputs
**A) Per-user summary**
```
user_id, name,
bezier_p1x, bezier_p1y, bezier_p2x, bezier_p2y,
t25, t50, t75,
frontload_index, easing_label,
burstiness, consistency, meetings_share,   # optional
total, total_pct                           # optional
```

**B) Per-user series (for plotting)**
```
user_id, date_iso, day_index,
x_norm, activity_platform, activity_meetings, activity_total,
cum_activity, y_norm
```

---

## 6) Node.js Reference Implementation

> **Install deps**  
> ```bash
> npm i csv-parse csv-stringify dayjs
> ```
> (If you need timezones: `npm i dayjs-plugin-utc dayjs-plugin-timezone` or use native Date.)

```js
// file: build_easing_curves.js
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import dayjs from 'dayjs';

// ---------- helpers ----------
const TRUTHY = new Set(['true','1','yes']);
function toBool01(v) {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim().toLowerCase();
  return TRUTHY.has(s) ? 1 : 0;
}
function parseDateHeader(h) {
  const m = /^\[(\d{2})\.(\d{2})\.(\d{4})\]/.exec(h);
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  // Build ISO-like date
  return dayjs(`${yyyy}-${mm}-${dd}`);
}
function dateKey(d) {
  return dayjs(d).format('YYYY-MM-DD');
}
function bezierPoint(t, p0, p1, p2, p3) {
  const u = 1 - t;
  const uu = u*u, tt = t*t;
  const uuu = uu*u, ttt = tt*t;
  // x and y are independent; here we compute y=given control points represent (x,y)
  return {
    x: uuu*p0.x + 3*uu*t*p1.x + 3*u*tt*p2.x + ttt*p3.x,
    y: uuu*p0.y + 3*uu*t*p1.y + 3*u*tt*p2.y + ttt*p3.y
  };
}
function sampleBezier(p1x, p1y, p2x, p2y, steps=101) {
  const p0 = {x:0, y:0}, p3 = {x:1, y:1};
  const p1 = {x:p1x, y:p1y}, p2 = {x:p2x, y:p2y};
  const arr = [];
  for (let i=0;i<steps;i++) {
    const t = i/(steps-1);
    const {x,y} = bezierPoint(t,p0,p1,p2,p3);
    arr.push({t,x,y});
  }
  return arr;
}
const CANON = {
  linear:      sampleBezier(0.00,0.00,1.00,1.00),
  ease:        sampleBezier(0.25,0.10,0.25,1.00),
  'ease-in':   sampleBezier(0.42,0.00,1.00,1.00),
  'ease-out':  sampleBezier(0.00,0.00,0.58,1.00),
  'ease-in-out': sampleBezier(0.42,0.00,0.58,1.00)
};

function rmseY(userCurve, canonCurve) {
  const n = Math.min(userCurve.length, canonCurve.length);
  let s2 = 0;
  for (let i=0;i<n;i++) {
    const dy = (canonCurve[i].y - userCurve[i].y);
    s2 += dy*dy;
  }
  return Math.sqrt(s2 / n);
}
function classifyEasing(userCurve, t25, t50, t75) {
  // compute Bezier proxy from quartiles
  const p1x = t25, p1y = 0.25;
  const p2x = t75, p2y = 0.75;
  const userBezier = sampleBezier(p1x, p1y, p2x, p2y);
  // distances
  const dists = Object.fromEntries(
    Object.entries(CANON).map(([lab, curve]) => [lab, rmseY(userBezier, curve)])
  );
  let best = Object.entries(dists).sort((a,b)=>a[1]-b[1])[0][0];

  // fallback by FI and quartile spread, if distances are close
  const FI = 0.5 - t50;
  const spread = Math.abs((t75 - t25) - 0.5);
  const values = Object.values(dists);
  const tight = (Math.max(...values) - Math.min(...values)) < 0.02; // tweak threshold
  if (tight) {
    if (FI > 0.10) best = 'ease-out';
    else if (FI < -0.10) best = 'ease-in';
    else if (spread < 0.10) best = 'linear';
    else best = 'ease-in-out';
  }
  return { label: best, p1x, p1y, p2x, p2y, FI };
}

// ---------- main pipeline ----------
async function main({
  inDir = '.',
  alpha = 1.0,
  beta  = 1.5,
  excludedUserIds = []
} = {}) {
  const readCsv = async (fname) => {
    const txt = await fs.readFile(path.join(inDir, fname), 'utf-8');
    return parse(txt, {columns: true, skip_empty_lines: true});
  };

  const learners = await readCsv('learners.csv').catch(()=>[]);
  const submissions = await readCsv('submissions.csv');
  const meetings = await readCsv('meetings.csv').catch(()=>[]);
  const gradeBook = await readCsv('grade_book.csv').catch(()=>[]);

  const excluded = new Set(excludedUserIds.map(String));

  // Map of user_id -> name
  const nameById = new Map();
  for (const r of learners) {
    const id = String(r.user_id ?? r.UserId ?? r.uid ?? r.user ?? '').trim();
    if (!id || excluded.has(id)) continue;
    const fn = (r.first_name ?? r.firstName ?? r.FirstName ?? r.first ?? '').trim();
    const ln = (r.last_name  ?? r.lastName  ?? r.LastName  ?? r.last  ?? '').trim();
    const name = (fn + ' ' + ln).trim() || 'NA';
    nameById.set(id, name);
  }

  // Grade book (optional context)
  const totalById = new Map();
  for (const r of gradeBook) {
    const id = String(r.user_id ?? r.UserId ?? r.uid ?? r.user ?? '').trim();
    if (!id || excluded.has(id)) continue;
    const tot = Number(r.total ?? r.Total ?? r.score ?? r.points ?? 0) || 0;
    totalById.set(id, tot);
  }
  const maxTotal = [...totalById.values()].reduce((m,v)=>Math.max(m,v), 0);

  // Platform activity
  const platform = new Map(); // key: `${id}|YYYY-MM-DD` -> weight
  for (const r of submissions) {
    const id = String(r.user_id ?? r.UserId ?? r.uid ?? r.user ?? '').trim();
    if (!id || excluded.has(id)) continue;
    const tsRaw = r.timestamp ?? r.time ?? r.submission_time ?? r.created_at;
    const ts = dayjs(tsRaw);
    if (!ts.isValid()) continue;
    const date = dateKey(ts);
    let w = 1.0;
    const st = (r.status ?? r.result ?? r.Status ?? '').toString().toLowerCase();
    if (st) w = (st === 'correct') ? 1.0 : 0.25;
    const key = `${id}|${date}`;
    platform.set(key, (platform.get(key) ?? 0) + w);
  }

  // Meetings activity
  // detect meeting columns
  const meetingCols = new Set();
  if (meetings.length) {
    const cols = Object.keys(meetings[0]);
    for (const c of cols) {
      if (['user_id','UserId','uid','user','name'].includes(c)) continue;
      if (/^\[\d{2}\.\d{2}\.\d{4}\]/.test(c)) meetingCols.add(c);
    }
  }
  const meetingsDaily = new Map(); // key: `${id}|YYYY-MM-DD` -> 0/1
  for (const row of meetings) {
    const id = String(row.user_id ?? row.UserId ?? row.uid ?? row.user ?? '').trim();
    if (!id || excluded.has(id)) continue;
    for (const c of meetingCols) {
      const d = parseDateHeader(c);
      if (!d) continue;
      const attended = toBool01(row[c]);
      if (attended) {
        const key = `${id}|${dateKey(d)}`;
        meetingsDaily.set(key, Math.max(meetingsDaily.get(key) ?? 0, 1)); // binary presence
      }
    }
  }

  // Aggregate per-user per-day totals
  const perUserDates = new Map(); // id -> Set(date)
  const totalsByDay = new Map();  // `${id}|date` -> total activity
  function addDay(id, date) {
    const s = perUserDates.get(id) ?? new Set();
    s.add(date);
    perUserDates.set(id, s);
  }
  const allKeys = new Set([...platform.keys(), ...meetingsDaily.keys()]);
  for (const key of allKeys) {
    const [id, date] = key.split('|');
    const aPlat = alpha * (platform.get(key) ?? 0);
    const aMeet = beta  * (meetingsDaily.get(key) ?? 0);
    const total = aPlat + aMeet;
    totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + total);
    addDay(id, date);
  }

  // Build per-user series + summary
  const seriesRows = [];
  const summaryRows = [];

  for (const [id, dset] of perUserDates.entries()) {
    const dates = [...dset].sort();
    if (!dates.length) continue;

    // Cumulate & normalize
    let cum = 0;
    const t0 = dayjs(dates[0]);
    const t1 = dayjs(dates[dates.length - 1]);
    const spanDays = Math.max(1, t1.diff(t0, 'day'));
    const tmp = [];

    for (const date of dates) {
      const key = `${id}|${date}`;
      const aTot = totalsByDay.get(key) ?? 0;
      cum += aTot;
      tmp.push({date, aTot});
    }
    const cumLast = cum;
    if (cumLast <= 0) {
      // no-activity row
      seriesRows.push({
        user_id: id, date_iso: dates[0], day_index: 0,
        x_norm: 0, activity_platform: 0, activity_meetings: 0,
        activity_total: 0, cum_activity: 0, y_norm: 0
      });
      summaryRows.push({
        user_id: id,
        name: nameById.get(id) ?? 'NA',
        bezier_p1x: 0, bezier_p1y: 0,
        bezier_p2x: 1, bezier_p2y: 1,
        t25: 1, t50: 1, t75: 1,
        frontload_index: -0.5,
        easing_label: 'linear',
        total: totalById.get(id) ?? 0,
        total_pct: (maxTotal>0) ? Number(((totalById.get(id)??0)/maxTotal*100).toFixed(1)) : 0
      });
      continue;
    }

    // second pass to create series rows with normalized coords
    cum = 0;
    const points = [];
    for (let i=0;i<dates.length;i++) {
      const date = dates[i];
      const aTot = tmp[i].aTot;
      cum += aTot;
      const dayIndex = dayjs(date).diff(t0, 'day');
      const x = dayIndex / spanDays;
      const y = cum / cumLast;
      points.push({x,y});

      seriesRows.push({
        user_id: id,
        date_iso: date,
        day_index: dayIndex,
        x_norm: Number(x.toFixed(6)),
        // if you need separate platform/meetings components, keep parallel maps for them
        activity_platform: undefined,
        activity_meetings: undefined,
        activity_total: Number(aTot.toFixed(6)),
        cum_activity: Number(cum.toFixed(6)),
        y_norm: Number(y.toFixed(6))
      });
    }

    // quartiles
    const tAt = (q) => {
      for (const {x,y} of points) if (y >= q) return x;
      return 1;
    };
    const t25 = tAt(0.25), t50 = tAt(0.50), t75 = tAt(0.75);
    const { label, p1x, p1y, p2x, p2y, FI } = classifyEasing(points, t25, t50, t75);

    summaryRows.push({
      user_id: id,
      name: nameById.get(id) ?? 'NA',
      bezier_p1x: Number(p1x.toFixed(4)),
      bezier_p1y: Number(p1y.toFixed(4)),
      bezier_p2x: Number(p2x.toFixed(4)),
      bezier_p2y: Number(p2y.toFixed(4)),
      t25: Number(t25.toFixed(4)),
      t50: Number(t50.toFixed(4)),
      t75: Number(t75.toFixed(4)),
      frontload_index: Number(FI.toFixed(4)),
      easing_label: label,
      total: totalById.get(id) ?? 0,
      total_pct: (maxTotal>0) ? Number(((totalById.get(id)??0)/maxTotal*100).toFixed(1)) : 0
    });
  }

  // Write CSVs
  const seriesCsv = stringify(seriesRows, { header: true });
  const summaryCsv = stringify(summaryRows, { header: true });
  await fs.writeFile(path.join(inDir, 'easing_series.csv'), seriesCsv, 'utf-8');
  await fs.writeFile(path.join(inDir, 'easing_summary.csv'), summaryCsv, 'utf-8');
  console.log('Done: easing_series.csv, easing_summary.csv');
}

// run
// Example: node build_easing_curves.js
main({ inDir: '.' }).catch(err => {
  console.error(err);
  process.exit(1);
});
```

**Notes**
- If you need separate daily components (`activity_platform`, `activity_meetings`) in the series output, keep two parallel maps and write them into the series rows (above placeholders are left as `undefined`).
- To switch to **weekly** buckets: replace `day` with `week` indexing when computing `dayIndex` and group by `YYYY-[W]WW` keys.
- You can plug any plotting tool using `easing_series.csv` with `x_norm` (abscissa) and `y_norm` (ordinate).

---

## 7) File Outputs
- `easing_summary.csv` — one row per user with Bezier proxy and label.
- `easing_series.csv` — multiple rows per user with normalized curve points for plotting.
