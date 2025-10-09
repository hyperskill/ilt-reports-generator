/**
 * Module Analytics Processor
 * Groups student activity data by modules and calculates statistics
 */

export interface ModuleStats {
  module_id: number;
  module_name: string;
  module_position: number;
  total_steps: number;
  attempted_steps: number;
  completed_steps: number;
  total_attempts: number;
  correct_attempts: number;
  success_rate: number;
  completion_rate: number;
  avg_attempts_per_step: number;
  meetings_attended: number;
  first_activity_date?: string;
  last_activity_date?: string;
}

interface SubmissionRow {
  user_id?: string;
  userid?: string;
  step_id?: string;
  stepid?: string;
  step?: string;
  status?: string;
  result?: string;
  submission_time?: number | string;
  timestamp?: number | string;
}

interface StructureRow {
  step_id?: string;
  stepid?: string;
  step?: string;
  module_id?: number;
  moduleid?: number;
  module_position?: number;
  moduleposition?: number;
  lesson_id?: number;
  lessonid?: number;
}

interface MeetingRow {
  user_id?: string;
  userid?: string;
  [key: string]: any; // For dynamic meeting columns like "[03.09.2025] Webinar..."
}

/**
 * Process submissions and structure data to generate module-level statistics
 */
export function processModuleAnalytics(
  userId: string,
  submissions: SubmissionRow[],
  structure: StructureRow[],
  moduleNamesMap: Record<number | string, string>,
  meetings?: MeetingRow[]
): ModuleStats[] {
  // Build structure map: step_id -> module info
  const stepToModuleMap = new Map<string, { module_id: number; module_position: number }>();
  const moduleStepsCount = new Map<number, Set<string>>();

  for (const row of structure) {
    const stepId = String(row.step_id || row.stepid || row.step || '').trim();
    const moduleId = Number(row.module_id || row.moduleid || 0);
    const modulePosition = Number(row.module_position || row.moduleposition || 0);

    if (stepId && moduleId) {
      stepToModuleMap.set(stepId, { module_id: moduleId, module_position: modulePosition });
      
      if (!moduleStepsCount.has(moduleId)) {
        moduleStepsCount.set(moduleId, new Set());
      }
      moduleStepsCount.get(moduleId)!.add(stepId);
    }
  }

  // Process submissions for this user
  const moduleStats = new Map<number, {
    module_position: number;
    attempted_steps: Set<string>;
    completed_steps: Set<string>;
    total_attempts: number;
    correct_attempts: number;
    timestamps: number[];
  }>();

  for (const sub of submissions) {
    const rowUserId = String(sub.user_id || sub.userid || '').trim().toLowerCase();
    if (rowUserId !== userId.toLowerCase()) continue;

    const stepId = String(sub.step_id || sub.stepid || sub.step || '').trim();
    if (!stepId) continue;

    const moduleInfo = stepToModuleMap.get(stepId);
    if (!moduleInfo) continue;

    const status = String(sub.status || sub.result || '').toLowerCase();
    const isCorrect = status === 'correct';

    // Parse timestamp
    const timestampRaw = sub.submission_time || sub.timestamp;
    let timestamp = 0;
    if (timestampRaw) {
      const parsed = Number(timestampRaw);
      if (!isNaN(parsed)) {
        // Convert to seconds if it's in milliseconds
        timestamp = parsed > 10000000000 ? Math.floor(parsed / 1000) : parsed;
      }
    }

    if (!moduleStats.has(moduleInfo.module_id)) {
      moduleStats.set(moduleInfo.module_id, {
        module_position: moduleInfo.module_position,
        attempted_steps: new Set(),
        completed_steps: new Set(),
        total_attempts: 0,
        correct_attempts: 0,
        timestamps: [],
      });
    }

    const stats = moduleStats.get(moduleInfo.module_id)!;
    stats.attempted_steps.add(stepId);
    stats.total_attempts += 1;
    
    if (timestamp > 0) {
      stats.timestamps.push(timestamp);
    }
    
    if (isCorrect) {
      stats.correct_attempts += 1;
      stats.completed_steps.add(stepId);
    }
  }

  // Parse meeting dates and count attendance for each module
  const meetingDates: { date: Date; attended: boolean }[] = [];
  
  if (meetings && meetings.length > 0) {
    const userMeeting = meetings.find(m => 
      String(m.user_id || m.userid || '').trim().toLowerCase() === userId.toLowerCase()
    );
    
    if (userMeeting) {
      // Extract meeting columns (format: "[DD.MM.YYYY] Event Name")
      for (const [key, value] of Object.entries(userMeeting)) {
        if (key.startsWith('[') && key.includes(']')) {
          const dateMatch = key.match(/\[(\d{2})\.(\d{2})\.(\d{4})\]/);
          if (dateMatch) {
            const [_, day, month, year] = dateMatch;
            const meetingDate = new Date(Number(year), Number(month) - 1, Number(day));
            meetingDate.setHours(0, 0, 0, 0); // Normalize to start of day
            const attended = String(value).toLowerCase() === 'true';
            meetingDates.push({ date: meetingDate, attended });
          }
        }
      }
    }
  }

  // Build final results
  const results: ModuleStats[] = [];

  for (const [moduleId, stats] of moduleStats.entries()) {
    const totalSteps = moduleStepsCount.get(moduleId)?.size || 0;
    const attemptedSteps = stats.attempted_steps.size;
    const completedSteps = stats.completed_steps.size;
    const totalAttempts = stats.total_attempts;
    const correctAttempts = stats.correct_attempts;

    const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
    const completionRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    const avgAttemptsPerStep = attemptedSteps > 0 ? totalAttempts / attemptedSteps : 0;

    // Calculate module period from timestamps
    let firstActivityDate: string | undefined;
    let lastActivityDate: string | undefined;
    let meetingsAttended = 0;

    if (stats.timestamps.length > 0) {
      const sortedTimestamps = stats.timestamps.sort((a, b) => a - b);
      const firstTimestamp = sortedTimestamps[0];
      const lastTimestamp = sortedTimestamps[sortedTimestamps.length - 1];
      
      firstActivityDate = new Date(firstTimestamp * 1000).toISOString().split('T')[0];
      lastActivityDate = new Date(lastTimestamp * 1000).toISOString().split('T')[0];

      // Count meetings that fall within the module period
      const firstDate = new Date(firstTimestamp * 1000);
      const lastDate = new Date(lastTimestamp * 1000);
      
      // Reset time to start of day for proper date comparison
      firstDate.setHours(0, 0, 0, 0);
      lastDate.setHours(23, 59, 59, 999);
      
      meetingsAttended = meetingDates.filter(m => {
        if (!m.attended) return false;
        // Reset meeting date time to start of day for comparison
        const meetingDate = new Date(m.date);
        meetingDate.setHours(0, 0, 0, 0);
        return meetingDate >= firstDate && meetingDate <= lastDate;
      }).length;
    }

    // Try both number and string keys for module names map
    const moduleName = moduleNamesMap[moduleId] || moduleNamesMap[String(moduleId)] || `Module ${moduleId}`;
    
    results.push({
      module_id: moduleId,
      module_name: moduleName,
      module_position: stats.module_position,
      total_steps: totalSteps,
      attempted_steps: attemptedSteps,
      completed_steps: completedSteps,
      total_attempts: totalAttempts,
      correct_attempts: correctAttempts,
      success_rate: Math.round(successRate * 10) / 10,
      completion_rate: Math.round(completionRate * 10) / 10,
      avg_attempts_per_step: Math.round(avgAttemptsPerStep * 10) / 10,
      meetings_attended: meetingsAttended,
      first_activity_date: firstActivityDate,
      last_activity_date: lastActivityDate,
    });
  }

  // Sort by module position
  results.sort((a, b) => a.module_position - b.module_position);

  return results;
}

