# Dynamic Activity → CSS‑Easing Segmentation (v2, with `activity.csv`)
*Updated to load **activity** at the start and blend it into curves and metrics.*

This document extends the earlier version by incorporating **activity** data (e.g., active minutes and/or session counts) into daily activity and easing classification. It keeps backward compatibility with meetings and submissions.


## 0) Inputs
Required:
- `learners.csv` → `user_id`, `first_name`, `last_name`
- `submissions.csv` → `user_id`, `step_id`, `status`, `timestamp`
- `activity.csv` → `user_id`, time field (`timestamp` or `date`), **activity intensity** field(s):
  - preferred: `active_minutes` (numeric, minutes of productive presence that day/session)
  - optional: `sessions` (integer daily sessions), `events` (raw events count)

Optional:
- `grade_book.csv` → `user_id`, `total`
- `meetings.csv` → `user_id`, `name`, N columns like `"[dd.mm.yyyy] Webinar. Topic"`
- `excludedUserIds` — list of users to exclude upfront

> Timezone: normalize timestamps to a single zone (e.g., UTC) prior to daily bucketing.


## 1) Daily Activity (now = Submissions + Meetings + Activity)
**Platform (submissions)**: bucket by `date = UTC(timestamp).startOf('day')` and weight attempts, e.g. `correct = 1.0`, `incorrect = 0.25` if `status` is present.

**Meetings**: parse meeting dates from headers `^\[(\d{2})\.(\d{2})\.(\d{4})\]` and set binary attendance per date.

**Activity**: from `activity.csv`:
- Alias detection: `user_id` ∈ `["user_id","uid","user"]`; `time` ∈ `["timestamp","time","date"]`.
- Core quantity: `active_minutes` (preferred). If absent, fall back to `sessions` or `events` with scale factors.
- Build daily totals per user:  
  `activity_minutes_d[date] = Σ active_minutes` (or scaled `sessions/events` → minutes).

**Mix (three sources):**
```
activity_d[date] = α * platform_events_d[date]
                 + β * meetings_d[date]
                 + γ * minutes_scaled_d[date]
```
Recommended starting scales: `α = 1.0`, `β = 1.5`, `γ = 0.02` (≈ 1 point per 50 minutes).  
Tune `γ` so that an average active day contributes a similar magnitude to 1–2 submissions.


## 2) Normalized Cumulative Curve
For each `user_id`:
- `T0 = min(date)`, `T1 = max(date)` across all three sources.
- `cum[date] = Σ_{τ ≤ date} activity_d[τ]`
- Normalize:
  - `x = (date - T0) / max(1 day, T1 - T0)`
  - `y = cum[date] / max(ε, cum[T1])`
- Optional smoothing: median filter 3–7 days on **activity_d** prior to cumulation.


## 3) Quartiles → Cubic Bezier Proxy
- `t25`, `t50`, `t75` are minimal `x` with `y ≥ 0.25, 0.50, 0.75`.
- Control points: `P1=(t25,0.25)`, `P2=(t75,0.75)` with `P0=(0,0)`, `P3=(1,1)`.
- Frontload Index: `FI = 0.5 - t50`.


## 4) CSS‑Easing Classification
Compute RMSE to canonical curves (`linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`); pick the minimum.  
If distances are nearly tied, use FI and quartile spread as tie‑breakers (same heuristics as before).


## 5) Extra Dynamics (optional but recommended)
- **Consistency**: fraction of active days (`activity_d > 0`).
- **Burstiness**: Gini or `std/mean` of `activity_d` (higher → more spiky).
- **Meetings share**: contribution of meetings in total activity after weighting.


## 6) Outputs
**A) Per‑user summary**
```
user_id, name,
bezier_p1x, bezier_p1y, bezier_p2x, bezier_p2y,
t25, t50, t75,
frontload_index, easing_label,
consistency, burstiness, meetings_share,   # optional
total, total_pct                           # optional (from grade_book)
```

**B) Per‑user daily series (for plotting)**
```
user_id, date_iso, day_index,
x_norm,
activity_platform, activity_meetings, activity_minutes,  # separate components
activity_total, cum_activity, y_norm
```


## 7) Node.js Reference (reads `activity.csv`)
> Install deps  
> ```bash
> npm i csv-parse csv-stringify dayjs
> ```

```js
// file: build_easing_curves_v2.js
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import dayjs from 'dayjs';

const TRUTHY = new Set(['true','1','yes']);

function toBool01(v){ if(v==null) return 0; const s=String(v).trim().toLowerCase(); return TRUTHY.has(s)?1:0; }
function dateKey(d){ return dayjs(d).format('YYYY-MM-DD'); }
function parseDateHeader(h){ const m=/^\[(\d{2})\.(\d{2})\.(\d{4})\]/.exec(h); if(!m) return null; const [_,dd,mm,yyyy]=m; return dayjs(`${yyyy}-${mm}-${dd}`); }

function bezierPoint(t,p0,p1,p2,p3){ const u=1-t, uu=u*u, tt=t*t; return {
  x: (u*uu)*p0.x + (3*uu*t)*p1.x + (3*u*tt)*p2.x + (tt*t)*p3.x,
  y: (u*uu)*p0.y + (3*uu*t)*p1.y + (3*u*tt)*p2.y + (tt*t)*p3.y
};}
function sampleBezier(p1x,p1y,p2x,p2y,steps=101){ const p0={x:0,y:0}, p3={x:1,y:1}; const p1={x:p1x,y:p1y}, p2={x:p2x,y:p2y};
  return Array.from({length:steps}, (_,i)=>{ const t=i/(steps-1); return bezierPoint(t,p0,p1,p2,p3); });
}
function rmseY(user, canon){ const n=Math.min(user.length, canon.length); let s2=0; for(let i=0;i<n;i++){ const dy=canon[i].y-user[i].y; s2+=dy*dy; } return Math.sqrt(s2/n); }
const CANON = {
  linear: sampleBezier(0.00,0.00,1.00,1.00),
  ease: sampleBezier(0.25,0.10,0.25,1.00),
  'ease-in': sampleBezier(0.42,0.00,1.00,1.00),
  'ease-out': sampleBezier(0.00,0.00,0.58,1.00),
  'ease-in-out': sampleBezier(0.42,0.00,0.58,1.00),
};

function classifyBezier(t25,t50,t75){
  const p1x=t25, p1y=0.25, p2x=t75, p2y=0.75;
  const user=sampleBezier(p1x,p1y,p2x,p2y);
  const d=Object.fromEntries(Object.entries(CANON).map(([k,v])=>[k, rmseY(user,v)]));
  let best=Object.entries(d).sort((a,b)=>a[1]-b[1])[0][0];
  const FI = 0.5 - t50;
  const tight = (Math.max(...Object.values(d))-Math.min(...Object.values(d))) < 0.02;
  if(tight){
    if(FI>0.10) best='ease-out';
    else if(FI<-0.10) best='ease-in';
    else if(Math.abs((t75-t25)-0.5)<0.10) best='linear';
    else best='ease-in-out';
  }
  return {label:best,p1x,p1y,p2x,p2y,FI};
}

async function main({ inDir='.', alpha=1.0, beta=1.5, gamma=0.02, excludedUserIds=[] }={}){
  const readCsv = async fname => parse(await fs.readFile(path.join(inDir,fname),'utf-8'), {columns:true, skip_empty_lines:true});

  const learners   = await readCsv('learners.csv').catch(()=>[]);
  const submissions= await readCsv('submissions.csv');
  const meetings   = await readCsv('meetings.csv').catch(()=>[]);
  const activity   = await readCsv('activity.csv');        // NEW
  const gradeBook  = await readCsv('grade_book.csv').catch(()=>[]);

  const excluded = new Set(excludedUserIds.map(String));

  // name map
  const nameById = new Map();
  for(const r of learners){
    const id=String(r.user_id ?? r.UserId ?? r.uid ?? r.user ?? '').trim();
    if(!id || excluded.has(id)) continue;
    const fn=(r.first_name ?? r.firstName ?? r.FirstName ?? r.first ?? '').trim();
    const ln=(r.last_name  ?? r.lastName  ?? r.LastName  ?? r.last  ?? '').trim();
    nameById.set(id, (fn+' '+ln).trim() || 'NA');
  }
  // totals map
  const totalById = new Map();
  for(const r of gradeBook){
    const id=String(r.user_id ?? r.UserId ?? r.uid ?? r.user ?? '').trim();
    if(!id || excluded.has(id)) continue;
    const tot=Number(r.total ?? r.Total ?? r.score ?? r.points ?? 0) || 0;
    totalById.set(id, tot);
  }
  const maxTotal = [...totalById.values()].reduce((m,v)=>Math.max(m,v), 0);

  // submissions per day
  const platform = new Map();
  for(const r of submissions){
    const id=String(r.user_id ?? r.UserId ?? r.uid ?? r.user ?? '').trim();
    if(!id || excluded.has(id)) continue;
    const tsRaw=r.timestamp ?? r.time ?? r.submission_time ?? r.created_at;
    const ts=dayjs(tsRaw); if(!ts.isValid()) continue;
    const date = ts.format('YYYY-MM-DD');
    let w=1.0;
    const st=(r.status ?? r.result ?? r.Status ?? '').toString().toLowerCase();
    if(st) w = (st==='correct') ? 1.0 : 0.25;
    const key=`${id}|${date}`;
    platform.set(key, (platform.get(key) ?? 0) + w);
  }

  // meetings per day (binary)
  const meetingCols = (meetings[0] ? Object.keys(meetings[0]) : []).filter(c=>!['user_id','UserId','uid','user','name'].includes(c));
  const meetingsDaily = new Map();
  for(const row of meetings){
    const id=String(row.user_id ?? row.UserId ?? row.uid ?? row.user ?? '').trim();
    if(!id || excluded.has(id)) continue;
    for(const c of meetingCols){
      const d=parseDateHeader(c); if(!d) continue;
      if(toBool01(row[c])){
        const key=`${id}|${d.format('YYYY-MM-DD')}`;
        meetingsDaily.set(key, 1);
      }
    }
  }

  // activity per day (minutes → points)
  const activityDaily = new Map();
  for(const a of activity){
    const id=String(a.user_id ?? a.UserId ?? a.uid ?? a.user ?? '').trim();
    if(!id || excluded.has(id)) continue;
    const ts=dayjs(a.timestamp ?? a.time ?? a.date);
    if(!ts.isValid()) continue;
    const date=ts.format('YYYY-MM-DD');
    const minutes = Number(a.active_minutes ?? a.minutes ?? a.total_minutes ?? 0) || 0;
    const sessions= Number(a.sessions ?? a.session_count ?? 0) || 0;
    // scale: minutes primary, sessions as minor boost
    const points = gamma * minutes + 0.2 * gamma * sessions;
    const key=`${id}|${date}`;
    activityDaily.set(key, (activityDaily.get(key) ?? 0) + points);
  }

  // union of all days
  const byDay = new Map();   // key -> {plat, meet, act}
  const add = (key, field, val) => {
    const obj = byDay.get(key) ?? {plat:0, meet:0, act:0};
    obj[field] += val;
    byDay.set(key, obj);
  };
  for(const [k,v] of platform) add(k,'plat', alpha*v);
  for(const [k,v] of meetingsDaily) add(k,'meet', beta*v);
  for(const [k,v] of activityDaily) add(k,'act', v); // already scaled

  // per-user dates
  const perUser = new Map();
  for(const key of byDay.keys()){
    const [id,date]=key.split('|');
    const s = perUser.get(id) ?? new Set();
    s.add(date);
    perUser.set(id, s);
  }

  const seriesRows=[], summaryRows=[];
  for(const [id, dset] of perUser.entries()){
    const dates=[...dset].sort();
    let cum=0;
    const t0=dayjs(dates[0]), t1=dayjs(dates[dates.length-1]);
    const spanDays=Math.max(1, t1.diff(t0,'day'));

    const points=[];
    let cumLast=0;

    // first pass cumulate to get total
    for(const date of dates){
      const key=`${id}|${date}`; const obj=byDay.get(key) ?? {plat:0,meet:0,act:0};
      cumLast += (obj.plat + obj.meet + obj.act);
    }

    if(cumLast<=0){
      seriesRows.push({user_id:id, date_iso:dates[0], day_index:0, x_norm:0,
        activity_platform:0, activity_meetings:0, activity_minutes:0, activity_total:0, cum_activity:0, y_norm:0});
      summaryRows.push({user_id:id, name:nameById.get(id) ?? 'NA', bezier_p1x:0, bezier_p1y:0, bezier_p2x:1, bezier_p2y:1,
        t25:1, t50:1, t75:1, frontload_index:-0.5, easing_label:'linear',
        total: totalById.get(id) ?? 0, total_pct: (maxTotal>0)?Number(((totalById.get(id)??0)/maxTotal*100).toFixed(1)):0});
      continue;
    }

    cum=0;
    for(const date of dates){
      const key=`${id}|${date}`; const obj=byDay.get(key) ?? {plat:0,meet:0,act:0};
      const aTot = obj.plat + obj.meet + obj.act;
      cum += aTot;
      const x = dayjs(date).diff(t0,'day')/spanDays;
      const y = cum / cumLast;
      points.push({x,y});
      seriesRows.push({
        user_id:id, date_iso:date, day_index:dayjs(date).diff(t0,'day'), x_norm:Number(x.toFixed(6)),
        activity_platform:Number(obj.plat.toFixed(6)),
        activity_meetings:Number(obj.meet.toFixed(6)),
        activity_minutes:Number(obj.act.toFixed(6)),
        activity_total:Number(aTot.toFixed(6)), cum_activity:Number(cum.toFixed(6)), y_norm:Number(y.toFixed(6))
      });
    }

    const tAt=q=>{ for(const {x,y} of points){ if(y>=q) return x; } return 1; };
    const t25=tAt(0.25), t50=tAt(0.50), t75=tAt(0.75);
    const {label,p1x,p1y,p2x,p2y,FI}=classifyBezier(t25,t50,t75);

    summaryRows.push({
      user_id:id, name:nameById.get(id) ?? 'NA',
      bezier_p1x:Number(p1x.toFixed(4)), bezier_p1y:Number(p1y.toFixed(4)),
      bezier_p2x:Number(p2x.toFixed(4)), bezier_p2y:Number(p2y.toFixed(4)),
      t25:Number(t25.toFixed(4)), t50:Number(t50.toFixed(4)), t75:Number(t75.toFixed(4)),
      frontload_index:Number(FI.toFixed(4)), easing_label:label,
      total: totalById.get(id) ?? 0, total_pct:(maxTotal>0)?Number(((totalById.get(id)??0)/maxTotal*100).toFixed(1)):0
    });
  }

  await fs.writeFile(path.join(inDir,'easing_series_v2.csv'), stringify(seriesRows,{header:true}), 'utf-8');
  await fs.writeFile(path.join(inDir,'easing_summary_v2.csv'), stringify(summaryRows,{header:true}), 'utf-8');
  console.log('Done: easing_series_v2.csv, easing_summary_v2.csv');
}

main({ inDir: '.' }).catch(e=>{ console.error(e); process.exit(1); });
```

**Notes**
- If `active_minutes` is missing, substitute `sessions` or `events` with a reasonable per‑unit minute guess (e.g., `1 session ≈ 10–20 minutes`). Update `γ` accordingly.
- For very sparse timestamps, switch to **Weekly** buckets; logic stays the same.
- The new series includes `activity_minutes` (already **scaled points**). Keep a parallel export of raw minutes if needed.
