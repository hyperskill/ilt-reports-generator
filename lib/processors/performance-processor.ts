import dayjs from 'dayjs';
import { PerformanceRow } from '@/lib/types';
import { findColumn } from '@/lib/utils/csv-parser';

interface ProcessorInput {
  gradeBook: any[];
  learners: any[];
  submissions: any[];
  activity: any[];
  meetings?: any[];
  excludedUserIds: string[];
  useMeetings: boolean;
}

export function processPerformanceSegmentation({
  gradeBook,
  learners,
  submissions,
  activity,
  meetings,
  excludedUserIds,
  useMeetings,
}: ProcessorInput): PerformanceRow[] {
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
    
    const firstName = getFirstName(row);
    const lastName = getLastName(row);
    const name = `${firstName} ${lastName}`.trim() || 'NA';
    nameById.set(originalId, name);
  }

  // Build grade map
  const gradeById = new Map<string, number>();
  let maxTotal = 0;
  for (const row of gradeBook) {
    const { id, originalId } = getUserId(row);
    if (!id || excluded.has(id)) continue;
    
    const total = getTotal(row);
    gradeById.set(originalId, total);
    maxTotal = Math.max(maxTotal, total);
  }

  // Process submissions
  const submissionStats = new Map<string, {
    submissions: number;
    uniqueSteps: Set<string>;
    correctSubs: number;
  }>();

  for (const row of submissions) {
    const { id, originalId } = getUserId(row);
    if (!id || excluded.has(id)) continue;

    const stepId = getStepId(row);
    const status = getStatus(row);
    const isCorrect = status.toLowerCase() === 'correct' ? 1 : 0;

    const stats = submissionStats.get(originalId) || {
      submissions: 0,
      uniqueSteps: new Set(),
      correctSubs: 0,
    };

    stats.submissions += 1;
    stats.uniqueSteps.add(stepId);
    stats.correctSubs += isCorrect;

    submissionStats.set(originalId, stats);
  }

  // Process activity data
  const activityStats = new Map<string, {
    totalMinutes: number;
    totalSessions: number;
    activeDays: Set<string>;
    minDate?: dayjs.Dayjs;
    maxDate?: dayjs.Dayjs;
  }>();

  for (const row of activity) {
    const { id, originalId } = getUserId(row);
    if (!id || excluded.has(id)) continue;

    const timestamp = getField(row, ['timestamp', 'time', 'date']);
    const ts = dayjs(timestamp);
    if (!ts.isValid()) continue;
    const date = ts.format('YYYY-MM-DD');

    const minutes = Number(getField(row, ['active_minutes', 'minutes', 'total_minutes'])) || 0;
    const sessions = Number(getField(row, ['sessions', 'session_count'])) || 0;

    const stats = activityStats.get(originalId) || {
      totalMinutes: 0,
      totalSessions: 0,
      activeDays: new Set(),
    };

    stats.totalMinutes += minutes;
    stats.totalSessions += sessions;
    if (minutes > 0 || sessions > 0) {
      stats.activeDays.add(date);
    }
    if (!stats.minDate || ts.isBefore(stats.minDate)) stats.minDate = ts;
    if (!stats.maxDate || ts.isAfter(stats.maxDate)) stats.maxDate = ts;

    activityStats.set(originalId, stats);
  }

  // Calculate activity indices with z-score normalization
  const minutesValues = Array.from(activityStats.values()).map(s => s.totalMinutes);
  const sessionsValues = Array.from(activityStats.values()).map(s => s.totalSessions);
  
  const minutesMean = mean(minutesValues);
  const minutesStd = stdDev(minutesValues, minutesMean);
  const sessionsMean = mean(sessionsValues);
  const sessionsStd = stdDev(sessionsValues, sessionsMean);

  // Process meetings
  const meetingStats = new Map<string, { attended: number; total: number }>();
  if (meetings && meetings.length > 0 && useMeetings) {
    const firstRow = meetings[0];
    const meetingCols = Object.keys(firstRow).filter(col => 
      /^\[\d{2}\.\d{2}\.\d{4}\]/.test(col)
    );
    const totalMeetings = meetingCols.length;

    for (const row of meetings) {
      const { id, originalId } = getUserId(row);
      if (!id || excluded.has(id)) continue;

      let attended = 0;
      for (const col of meetingCols) {
        if (toBool(row[col])) attended += 1;
      }

      meetingStats.set(originalId, { attended, total: totalMeetings });
    }
  }

  // Build final rows
  const results: PerformanceRow[] = [];
  const allUserIds = new Set([
    ...nameById.keys(),
    ...gradeById.keys(),
    ...submissionStats.keys(),
  ]);

  for (const userId of allUserIds) {
    // Double-check exclusion here
    const normalizedUserId = userId.toLowerCase();
    if (excluded.has(normalizedUserId)) continue;
    
    const total = gradeById.get(userId) || 0;
    const totalPct = maxTotal > 0 ? Number((total / maxTotal * 100).toFixed(1)) : 0;

    const stats = submissionStats.get(userId);
    const submissions = stats?.submissions || 0;
    const uniqueSteps = stats?.uniqueSteps.size || 0;
    const correctSubs = stats?.correctSubs || 0;

    const successRate = submissions > 0 ? Number((correctSubs / submissions * 100).toFixed(1)) : 0;
    const persistence = uniqueSteps > 0 ? Number((submissions / uniqueSteps).toFixed(2)) : 0;
    const efficiency = uniqueSteps > 0 ? Number((correctSubs / uniqueSteps).toFixed(2)) : 0;

    // Activity metrics
    const actData = activityStats.get(userId);
    const activeMinutesTotal = actData?.totalMinutes || 0;
    const sessionsCount = actData?.totalSessions || 0;
    const activeDaysCount = actData?.activeDays.size || 0;
    const totalDays = actData?.minDate && actData?.maxDate 
      ? Math.max(1, actData.maxDate.diff(actData.minDate, 'day') + 1)
      : 1;
    const activeDaysRatio = Number((activeDaysCount / totalDays).toFixed(3));

    // Effort index: z-score normalized combination
    const zMinutes = minutesStd > 0 ? (activeMinutesTotal - minutesMean) / minutesStd : 0;
    const zSessions = sessionsStd > 0 ? (sessionsCount - sessionsMean) / sessionsStd : 0;
    const effortIndex = Number(((zMinutes + zSessions) / 2).toFixed(3));

    // Consistency index
    const consistencyIndex = activeDaysRatio;

    // Struggle index (simplified - based on low success rate but high persistence)
    const struggleIndex = successRate < 50 && persistence > 3 
      ? Number((0.6).toFixed(3)) 
      : Number((0.3).toFixed(3));

    const meetingData = meetingStats.get(userId);
    const meetingsAttended = meetingData?.attended || 0;
    const meetingsAttendedPct = meetingData?.total 
      ? Number((meetingsAttended / meetingData.total * 100).toFixed(1))
      : 0;

    const segment = classifySegment({
      totalPct,
      persistence,
      submissions,
      meetingsAttendedPct,
      useMeetings,
      effortIndex,
      activeDaysRatio,
      struggleIndex,
    });

    results.push({
      user_id: userId,
      name: nameById.get(userId) || 'NA',
      total,
      total_pct: totalPct,
      submissions,
      unique_steps: uniqueSteps,
      success_rate: successRate,
      persistence,
      efficiency,
      active_minutes_total: activeMinutesTotal,
      sessions_count: sessionsCount,
      active_days_ratio: activeDaysRatio,
      effort_index: effortIndex,
      consistency_index: consistencyIndex,
      struggle_index: struggleIndex,
      simple_segment: segment,
      meetings_attended: meetingsAttended,
      meetings_attended_pct: meetingsAttendedPct,
    });
  }

  // Sort by total_pct descending
  results.sort((a, b) => b.total_pct - a.total_pct);

  return results;
}

function classifySegment({
  totalPct,
  persistence,
  submissions,
  meetingsAttendedPct,
  useMeetings,
  effortIndex,
  activeDaysRatio,
  struggleIndex,
}: {
  totalPct: number;
  persistence: number;
  submissions: number;
  meetingsAttendedPct: number;
  useMeetings: boolean;
  effortIndex: number;
  activeDaysRatio: number;
  struggleIndex: number;
}): string {
  const leader = totalPct >= 80;
  const low = totalPct < 30;
  const balanced = !leader && !low;

  // Priority rules with activity signals
  if (useMeetings) {
    if (leader && meetingsAttendedPct >= 70) return 'Leader engaged';
    if (leader && persistence <= 3 && activeDaysRatio >= 0.5) return 'Leader efficient';
    if (balanced && meetingsAttendedPct >= 60 && activeDaysRatio >= 0.4) return 'Balanced + engaged';
  } else {
    if (leader && persistence <= 3 && activeDaysRatio >= 0.5) return 'Leader efficient';
  }

  // Activity-driven rules
  if (totalPct < 80 && effortIndex >= 0.5 && struggleIndex >= 0.6) return 'Hardworking but struggling';
  if ((low && submissions < 20) || (effortIndex <= -0.5 && activeDaysRatio < 0.3)) return 'Low engagement';
  if (low && persistence >= 5) return 'Hardworking but struggling';
  
  return 'Balanced middle';
}

// Helper functions
function getUserId(row: any): { id: string; originalId: string } {
  const key = findColumn(row, ['user_id', 'userid', 'uid', 'user']);
  if (!key) return { id: '', originalId: '' };
  
  const originalId = String(row[key]).trim();
  const id = originalId.toLowerCase();
  return { id, originalId };
}

function getFirstName(row: any): string {
  const key = findColumn(row, ['first_name', 'firstname', 'first']);
  return key ? String(row[key]).trim() : '';
}

function getLastName(row: any): string {
  const key = findColumn(row, ['last_name', 'lastname', 'last']);
  return key ? String(row[key]).trim() : '';
}

function getTotal(row: any): number {
  const key = findColumn(row, ['total', 'score', 'points']);
  return key ? Number(row[key]) || 0 : 0;
}

function getStepId(row: any): string {
  const key = findColumn(row, ['step_id', 'stepid', 'step', 'task_id']);
  return key ? String(row[key]).trim() : '';
}

function getStatus(row: any): string {
  const key = findColumn(row, ['status', 'result']);
  return key ? String(row[key]).trim() : '';
}

function toBool(value: any): boolean {
  if (value === null || value === undefined) return false;
  const s = String(value).toLowerCase().trim();
  return ['true', '1', 'yes'].includes(s);
}

function getField(row: any, aliases: string[]): string {
  const key = findColumn(row, aliases);
  return key ? String(row[key]).trim() : '';
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[], meanValue: number): number {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - meanValue, 2), 0) / values.length;
  return Math.sqrt(variance);
}

