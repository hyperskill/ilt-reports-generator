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
}: {
  totalPct: number;
  persistence: number;
  submissions: number;
  meetingsAttendedPct: number;
  useMeetings: boolean;
}): string {
  const leader = totalPct >= 80;
  const low = totalPct < 30;

  if (useMeetings) {
    if (leader && meetingsAttendedPct >= 70) return 'Leader engaged';
    if (leader && persistence <= 3) return 'Leader efficient';
    if (!leader && !low && meetingsAttendedPct >= 60) return 'Balanced + engaged';
    if (low && meetingsAttendedPct >= 50) return 'Low engagement but socially active';
  } else {
    if (leader && persistence <= 3) return 'Leader efficient';
  }

  if (low && persistence >= 5) return 'Hardworking but struggling';
  if (low && submissions < 20) return 'Low engagement';
  
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

