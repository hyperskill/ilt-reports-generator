import dayjs from 'dayjs';
import { PerformanceRow } from '@/lib/types';
import { findColumn } from '@/lib/utils/csv-parser';

interface ProcessorInput {
  gradeBook: any[];
  learners: any[];
  submissions: any[];
  meetings?: any[];
  excludedUserIds: string[];
  useMeetings: boolean;
}

export function processPerformanceSegmentation({
  gradeBook,
  learners,
  submissions,
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

  // Process submissions - collect dates and stats
  // First pass: collect all submission timestamps to determine course period
  const allTimestamps: dayjs.Dayjs[] = [];
  
  for (const row of submissions) {
    const timestamp = getTimestamp(row);
    const ts = dayjs(timestamp);
    if (ts.isValid()) {
      allTimestamps.push(ts);
    }
  }

  // Sort timestamps to find percentile-based course period (exclude outliers)
  allTimestamps.sort((a, b) => a.valueOf() - b.valueOf());
  
  let courseStartDate: dayjs.Dayjs | null = null;
  let courseEndDate: dayjs.Dayjs | null = null;
  let courseDurationDays = 0;
  
  if (allTimestamps.length > 0) {
    // Use 5th and 95th percentile to exclude outliers
    const startIndex = Math.floor(allTimestamps.length * 0.05);
    const endIndex = Math.floor(allTimestamps.length * 0.95);
    
    courseStartDate = allTimestamps[startIndex];
    courseEndDate = allTimestamps[endIndex];
    courseDurationDays = courseEndDate.diff(courseStartDate, 'day') + 1;
  }

  const submissionStats = new Map<string, {
    submissions: number;
    uniqueSteps: Set<string>;
    correctSubs: number;
    dates: Set<string>;
    minDate?: dayjs.Dayjs;
    maxDate?: dayjs.Dayjs;
  }>();

  for (const row of submissions) {
    const { id, originalId } = getUserId(row);
    if (!id || excluded.has(id)) continue;

    const stepId = getStepId(row);
    const status = getStatus(row);
    const isCorrect = status.toLowerCase() === 'correct' ? 1 : 0;
    
    const timestamp = getTimestamp(row);
    const ts = dayjs(timestamp);
    if (!ts.isValid()) continue;
    
    // Filter submissions to course period only
    if (courseStartDate && courseEndDate) {
      if (ts.isBefore(courseStartDate) || ts.isAfter(courseEndDate)) {
        continue; // Skip submissions outside course period
      }
    }
    
    const date = ts.format('YYYY-MM-DD');

    const stats = submissionStats.get(originalId) || {
      submissions: 0,
      uniqueSteps: new Set(),
      correctSubs: 0,
      dates: new Set(),
    };

    stats.submissions += 1;
    stats.uniqueSteps.add(stepId);
    stats.correctSubs += isCorrect;
    stats.dates.add(date);
    
    if (!stats.minDate || ts.isBefore(stats.minDate)) stats.minDate = ts;
    if (!stats.maxDate || ts.isAfter(stats.maxDate)) stats.maxDate = ts;

    submissionStats.set(originalId, stats);
  }

  // Calculate z-scores for effort index
  const submissionsValues = Array.from(submissionStats.values()).map(s => s.submissions);
  const activeDaysValues = Array.from(submissionStats.values()).map(s => s.dates.size);
  
  const submissionsMean = mean(submissionsValues);
  const submissionsStd = stdDev(submissionsValues, submissionsMean);
  const activeDaysMean = mean(activeDaysValues);
  const activeDaysStd = stdDev(activeDaysValues, activeDaysMean);

  // Collect struggle signals for normalization
  const persistenceValues = Array.from(submissionStats.values())
    .map(s => s.uniqueSteps.size > 0 ? s.submissions / s.uniqueSteps.size : 0);
  const successRateValues = Array.from(submissionStats.values())
    .map(s => s.submissions > 0 ? s.correctSubs / s.submissions : 0);

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
    const normalizedUserId = userId.toLowerCase();
    if (excluded.has(normalizedUserId)) continue;
    
    const total = gradeById.get(userId) || 0;
    const totalPct = maxTotal > 0 ? Number((total / maxTotal * 100).toFixed(1)) : 0;

    const stats = submissionStats.get(userId);
    const submissions = stats?.submissions || 0;
    const uniqueSteps = stats?.uniqueSteps.size || 0;
    const correctSubs = stats?.correctSubs || 0;
    const activeDays = stats?.dates.size || 0;
    
    // Temporal coverage - use course duration instead of individual span
    const spanDays = courseDurationDays > 0 ? courseDurationDays : 1;
    const activeDaysRatio = Number((activeDays / spanDays).toFixed(3));

    // Core KPIs
    const successRate = submissions > 0 ? Number((correctSubs / submissions * 100).toFixed(1)) : 0;
    const persistence = uniqueSteps > 0 ? Number((submissions / uniqueSteps).toFixed(2)) : 0;
    const efficiency = uniqueSteps > 0 ? Number((correctSubs / uniqueSteps).toFixed(2)) : 0;

    // Effort index: z-score of submissions ⊕ z-score of active_days
    const zSubmissions = submissionsStd > 0 ? (submissions - submissionsMean) / submissionsStd : 0;
    const zActiveDays = activeDaysStd > 0 ? (activeDays - activeDaysMean) / activeDaysStd : 0;
    const effortIndex = Number(((zSubmissions + zActiveDays) / 2).toFixed(3));

    // Consistency index = active_days_ratio
    const consistencyIndex = activeDaysRatio;

    // Struggle index: high persistence + low success rate
    // Normalize: high persistence (>mean) and low success (<50%) → high struggle
    const persistenceMean = mean(persistenceValues);
    const successRateMean = mean(successRateValues);
    
    let struggleScore = 0;
    if (persistence > persistenceMean && successRate < 50) {
      struggleScore = 0.7;
    } else if (persistence > persistenceMean || successRate < successRateMean) {
      struggleScore = 0.4;
    } else {
      struggleScore = 0.2;
    }
    const struggleIndex = Number(struggleScore.toFixed(3));

    // Meetings
    const meetingData = meetingStats.get(userId);
    const meetingsAttended = meetingData?.attended || 0;
    const meetingsAttendedPct = meetingData?.total 
      ? Number((meetingsAttended / meetingData.total * 100).toFixed(1))
      : 0;

    // Segment classification
    const segment = classifySegment({
      totalPct,
      persistence,
      consistencyIndex,
      submissions,
      meetingsAttendedPct,
      useMeetings,
      effortIndex,
      struggleIndex,
    });

    results.push({
      user_id: userId,
      name: nameById.get(userId) || 'NA',
      total,
      total_pct: totalPct,
      submissions,
      unique_steps: uniqueSteps,
      correct_submissions: correctSubs,
      success_rate: successRate,
      persistence,
      efficiency,
      active_days: activeDays,
      active_days_ratio: activeDaysRatio,
      effort_index: effortIndex,
      consistency_index: consistencyIndex,
      struggle_index: struggleIndex,
      meetings_attended: meetingsAttended,
      meetings_attended_pct: meetingsAttendedPct,
      simple_segment: segment,
    });
  }

  // Sort by total_pct descending
  results.sort((a, b) => b.total_pct - a.total_pct);

  return results;
}

function classifySegment({
  totalPct,
  persistence,
  consistencyIndex,
  submissions,
  meetingsAttendedPct,
  useMeetings,
  effortIndex,
  struggleIndex,
}: {
  totalPct: number;
  persistence: number;
  consistencyIndex: number;
  submissions: number;
  meetingsAttendedPct: number;
  useMeetings: boolean;
  effortIndex: number;
  struggleIndex: number;
}): string {
  const leader = totalPct >= 80;
  const low = totalPct < 30;
  const balanced = !leader && !low;

  // Priority rules (more flexible)
  // 1. Leader engaged - if meetings are being used
  if (useMeetings && leader && meetingsAttendedPct >= 70) {
    return 'Leader engaged';
  }
  
  // 2. Leader efficient - efficient leaders with good consistency
  if (leader && persistence <= 3 && consistencyIndex >= 0.5) {
    return 'Leader efficient';
  }
  
  // 3. Leaders without strict conditions (fallback for leaders)
  if (leader) {
    return 'Leader efficient'; // All other leaders default here
  }
  
  // 4. Balanced + engaged
  if (useMeetings && balanced && meetingsAttendedPct >= 60 && consistencyIndex >= 0.4) {
    return 'Balanced + engaged';
  }
  
  // 5. Hardworking but struggling
  if (!leader && effortIndex >= 0.5 && struggleIndex >= 0.6) {
    return 'Hardworking but struggling';
  }
  
  // 6. Low engagement
  if ((low && submissions < 20) || (effortIndex <= -0.5 && consistencyIndex < 0.3)) {
    return 'Low engagement';
  }
  
  // 7. Default: Balanced middle
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

function getTimestamp(row: any): string {
  const key = findColumn(row, ['timestamp', 'time', 'submission_time', 'created_at']);
  return key ? String(row[key]).trim() : '';
}

function toBool(value: any): boolean {
  if (value === null || value === undefined) return false;
  const s = String(value).toLowerCase().trim();
  return ['true', '1', 'yes'].includes(s);
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
