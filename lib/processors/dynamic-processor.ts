import dayjs from 'dayjs';
import { DynamicSummaryRow, DynamicSeriesRow } from '@/lib/types';
import { findColumn } from '@/lib/utils/csv-parser';

interface ProcessorInput {
  gradeBook: any[];
  learners: any[];
  submissions: any[];
  activity: any[];
  meetings?: any[];
  excludedUserIds: string[];
  includeMeetings: boolean;
  alpha?: number;
  beta?: number;
  gamma?: number;
}

export function processDynamicSegmentation({
  gradeBook,
  learners,
  submissions,
  activity,
  meetings,
  excludedUserIds,
  includeMeetings,
  alpha = 1.0,
  beta = 1.5,
  gamma = 0.02,
}: ProcessorInput): { summary: DynamicSummaryRow[]; series: DynamicSeriesRow[] } {
  // Normalize excluded IDs: trim, lowercase for case-insensitive matching
  const excluded = new Set(
    excludedUserIds
      .map(id => String(id).trim().toLowerCase())
      .filter(id => id.length > 0)
  );

  // Build name map
  const nameById = new Map<string, string>();
  for (const row of learners) {
    const { id, originalId } = getUserId(row);
    if (!id || excluded.has(id)) continue;
    const firstName = getField(row, ['first_name', 'firstname', 'first']);
    const lastName = getField(row, ['last_name', 'lastname', 'last']);
    const name = `${firstName} ${lastName}`.trim() || 'NA';
    nameById.set(originalId, name);
  }

  // Build grade map
  const totalById = new Map<string, number>();
  let maxTotal = 0;
  for (const row of gradeBook) {
    const { id, originalId } = getUserId(row);
    if (!id || excluded.has(id)) continue;
    const total = getTotal(row);
    totalById.set(originalId, total);
    maxTotal = Math.max(maxTotal, total);
  }

  // Platform activity
  const platform = new Map<string, number>();
  for (const row of submissions) {
    const { id, originalId } = getUserId(row);
    if (!id || excluded.has(id)) continue;
    const timestamp = getField(row, ['timestamp', 'time', 'submission_time', 'created_at']);
    const ts = dayjs(timestamp);
    if (!ts.isValid()) continue;
    const date = ts.format('YYYY-MM-DD');
    const status = getField(row, ['status', 'result']).toLowerCase();
    const weight = status === 'correct' ? 1.0 : 0.25;
    const key = `${originalId}|${date}`;
    platform.set(key, (platform.get(key) || 0) + weight);
  }

  // Activity per day (minutes → points)
  const activityDaily = new Map<string, number>();
  for (const row of activity) {
    const { id, originalId } = getUserId(row);
    if (!id || excluded.has(id)) continue;
    const timestamp = getField(row, ['timestamp', 'time', 'date']);
    const ts = dayjs(timestamp);
    if (!ts.isValid()) continue;
    const date = ts.format('YYYY-MM-DD');
    const minutes = Number(getField(row, ['active_minutes', 'minutes', 'total_minutes'])) || 0;
    const sessions = Number(getField(row, ['sessions', 'session_count'])) || 0;
    // Scale: minutes primary, sessions as minor boost
    const points = gamma * minutes + 0.2 * gamma * sessions;
    const key = `${originalId}|${date}`;
    activityDaily.set(key, (activityDaily.get(key) || 0) + points);
  }

  // Meetings activity
  const meetingsDaily = new Map<string, number>();
  if (meetings && includeMeetings) {
    const firstRow = meetings[0];
    const meetingCols: { col: string; date: dayjs.Dayjs }[] = [];
    for (const col of Object.keys(firstRow)) {
      const match = /^\[(\d{2})\.(\d{2})\.(\d{4})\]/.exec(col);
      if (match) {
        const [_, dd, mm, yyyy] = match;
        const date = dayjs(`${yyyy}-${mm}-${dd}`);
        if (date.isValid()) {
          meetingCols.push({ col, date });
        }
      }
    }

    for (const row of meetings) {
      const { id, originalId } = getUserId(row);
      if (!id || excluded.has(id)) continue;
      for (const { col, date } of meetingCols) {
        if (toBool(row[col])) {
          const key = `${originalId}|${date.format('YYYY-MM-DD')}`;
          meetingsDaily.set(key, 1);
        }
      }
    }
  }

  // Aggregate per-user per-day
  const perUserDates = new Map<string, Set<string>>();
  const totalsByDay = new Map<string, { plat: number; meet: number; act: number }>();
  const allKeys = new Set([...platform.keys(), ...meetingsDaily.keys(), ...activityDaily.keys()]);

  for (const key of allKeys) {
    const [id, date] = key.split('|');
    const aPlat = alpha * (platform.get(key) || 0);
    const aMeet = beta * (meetingsDaily.get(key) || 0);
    const aAct = activityDaily.get(key) || 0; // already scaled
    totalsByDay.set(key, { plat: aPlat, meet: aMeet, act: aAct });

    const dates = perUserDates.get(id) || new Set();
    dates.add(date);
    perUserDates.set(id, dates);
  }

  // Build series and summary
  const seriesRows: DynamicSeriesRow[] = [];
  const summaryRows: DynamicSummaryRow[] = [];

  // Get all unique user IDs from all sources (same as Performance processor)
  const allUserIds = new Set([
    ...nameById.keys(),
    ...totalById.keys(),
    ...perUserDates.keys(),
  ]);

  for (const id of allUserIds) {
    // Double-check exclusion here
    const normalizedId = id.toLowerCase();
    if (excluded.has(normalizedId)) continue;
    
    const dateSet = perUserDates.get(id);
    const dates = dateSet ? Array.from(dateSet).sort() : [];
    // Include users even if they have no activity data (dates.length === 0)
    // This ensures consistent user counts between Performance and Dynamic modes

    if (dates.length === 0) {
      // No activity data - create a single point for consistency
      seriesRows.push({
        user_id: id,
        date_iso: '2024-01-01', // fallback date
        day_index: 0,
        x_norm: 0,
        activity_platform: 0,
        activity_meetings: 0,
        activity_minutes: 0,
        activity_total: 0,
        cum_activity: 0,
        y_norm: 0,
      });
      summaryRows.push({
        user_id: id,
        name: nameById.get(id) || 'NA',
        bezier_p1x: 0,
        bezier_p1y: 0,
        bezier_p2x: 1,
        bezier_p2y: 1,
        t25: 1,
        t50: 1,
        t75: 1,
        frontload_index: -0.5,
        easing_label: 'no-activity',
        total: totalById.get(id) || 0,
        total_pct: maxTotal > 0 ? Number(((totalById.get(id) || 0) / maxTotal * 100).toFixed(1)) : 0,
      });
      continue;
    }

    const t0 = dayjs(dates[0]);
    const t1 = dayjs(dates[dates.length - 1]);
    const spanDays = Math.max(1, t1.diff(t0, 'day'));

    // Cumulate
    let cum = 0;
    const points: { x: number; y: number }[] = [];
    let cumLast = 0;
    for (const date of dates) {
      const key = `${id}|${date}`;
      const obj = totalsByDay.get(key) || { plat: 0, meet: 0, act: 0 };
      cumLast += (obj.plat + obj.meet + obj.act);
    }

    if (cumLast <= 0) {
      // No activity - create a single point for consistency
      seriesRows.push({
        user_id: id,
        date_iso: dates[0],
        day_index: 0,
        x_norm: 0,
        activity_platform: 0,
        activity_meetings: 0,
        activity_minutes: 0,
        activity_total: 0,
        cum_activity: 0,
        y_norm: 0,
      });
      summaryRows.push({
        user_id: id,
        name: nameById.get(id) || 'NA',
        bezier_p1x: 0,
        bezier_p1y: 0,
        bezier_p2x: 1,
        bezier_p2y: 1,
        t25: 1,
        t50: 1,
        t75: 1,
        frontload_index: -0.5,
        easing_label: 'no-activity',
        total: totalById.get(id) || 0,
        total_pct: maxTotal > 0 ? Number(((totalById.get(id) || 0) / maxTotal * 100).toFixed(1)) : 0,
      });
      continue;
    }

    // Build series with normalized coords
    cum = 0;
    for (const date of dates) {
      const key = `${id}|${date}`;
      const obj = totalsByDay.get(key) || { plat: 0, meet: 0, act: 0 };
      const activityTotal = obj.plat + obj.meet + obj.act;
      cum += activityTotal;
      const dayIndex = dayjs(date).diff(t0, 'day');
      const x = dayIndex / spanDays;
      const y = cum / cumLast;
      points.push({ x, y });

      seriesRows.push({
        user_id: id,
        date_iso: date,
        day_index: dayIndex,
        x_norm: Number(x.toFixed(6)),
        activity_platform: Number(obj.plat.toFixed(6)),
        activity_meetings: Number(obj.meet.toFixed(6)),
        activity_minutes: Number(obj.act.toFixed(6)),
        activity_total: Number(activityTotal.toFixed(6)),
        cum_activity: Number(cum.toFixed(6)),
        y_norm: Number(y.toFixed(6)),
      });
    }

    // Quartiles
    const t25 = findQuartile(points, 0.25);
    const t50 = findQuartile(points, 0.50);
    const t75 = findQuartile(points, 0.75);

    const p1x = t25;
    const p1y = 0.25;
    const p2x = t75;
    const p2y = 0.75;
    const FI = 0.5 - t50;

    const label = classifyEasing(p1x, p1y, p2x, p2y, t25, t50, t75, FI);

    summaryRows.push({
      user_id: id,
      name: nameById.get(id) || 'NA',
      bezier_p1x: Number(p1x.toFixed(4)),
      bezier_p1y: Number(p1y.toFixed(4)),
      bezier_p2x: Number(p2x.toFixed(4)),
      bezier_p2y: Number(p2y.toFixed(4)),
      t25: Number(t25.toFixed(4)),
      t50: Number(t50.toFixed(4)),
      t75: Number(t75.toFixed(4)),
      frontload_index: Number(FI.toFixed(4)),
      easing_label: label,
      total: totalById.get(id) || 0,
      total_pct: maxTotal > 0 ? Number(((totalById.get(id) || 0) / maxTotal * 100).toFixed(1)) : 0,
    });
  }

  return { summary: summaryRows, series: seriesRows };
}

function findQuartile(points: { x: number; y: number }[], q: number): number {
  for (const { x, y } of points) {
    if (y >= q) return x;
  }
  return 1;
}

function classifyEasing(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  t25: number,
  t50: number,
  t75: number,
  FI: number
): string {
  // Simple heuristic classification
  if (FI > 0.10) return 'ease-out';
  if (FI < -0.10) return 'ease-in';
  if (Math.abs((t75 - t25) - 0.5) < 0.10) return 'linear';
  if (Math.abs(t50 - 0.5) < 0.05) return 'linear';
  
  // Check for S-curve (ease-in-out)
  if (t25 < 0.4 && t75 > 0.6) return 'ease-in-out';
  
  return 'ease';
}

// Helper functions
function getUserId(row: any): { id: string; originalId: string } {
  const key = findColumn(row, ['user_id', 'userid', 'uid', 'user']);
  if (!key) return { id: '', originalId: '' };
  
  const originalId = String(row[key]).trim();
  const id = originalId.toLowerCase();
  return { id, originalId };
}

function getField(row: any, aliases: string[]): string {
  const key = findColumn(row, aliases);
  return key ? String(row[key]).trim() : '';
}

function getTotal(row: any): number {
  const key = findColumn(row, ['total', 'score', 'points']);
  return key ? Number(row[key]) || 0 : 0;
}

function toBool(value: any): boolean {
  if (value === null || value === undefined) return false;
  const s = String(value).toLowerCase().trim();
  return ['true', '1', 'yes'].includes(s);
}

