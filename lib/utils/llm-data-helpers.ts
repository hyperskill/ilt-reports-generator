import { processModuleAnalytics, ModuleStats } from '@/lib/processors/module-analytics';
import { getModuleNamesMapByIds } from './cogniterra-api';

/**
 * Get module names and associated topics from structure data
 */
export async function getModuleStructureData(structureData: any[]): Promise<{
  modules: Array<{
    moduleId: number;
    moduleName: string;
    position: number;
    topics: Array<{
      lessonId: string;
      stepCount: number;
    }>;
  }>;
}> {
  if (!structureData || structureData.length === 0) {
    return { modules: [] };
  }

  // Extract unique module IDs
  const moduleIdsSet = new Set<number>();
  for (const row of structureData) {
    const moduleId = Number(row.module_id || row.moduleid || 0);
    if (moduleId > 0) {
      moduleIdsSet.add(moduleId);
    }
  }
  
  const moduleIds = Array.from(moduleIdsSet);
  
  if (moduleIds.length === 0) {
    return { modules: [] };
  }

  // Fetch module names from Cogniterra API
  const moduleNamesMap = await getModuleNamesMapByIds(moduleIds);
  
  // Build module structure with topics
  const moduleMap = new Map<number, {
    moduleId: number;
    moduleName: string;
    position: number;
    topics: Map<string, number>;
  }>();
  
  for (const row of structureData) {
    const moduleId = Number(row.module_id || row.moduleid || 0);
    const position = Number(row.position || row.module_position || 0);
    const lessonId = String(row.lesson_id || row.lessonid || '').trim();
    
    if (moduleId > 0) {
      if (!moduleMap.has(moduleId)) {
        moduleMap.set(moduleId, {
          moduleId,
          moduleName: moduleNamesMap[moduleId] || `Module ${moduleId}`,
          position,
          topics: new Map(),
        });
      }
      
      const module = moduleMap.get(moduleId)!;
      if (lessonId) {
        module.topics.set(lessonId, (module.topics.get(lessonId) || 0) + 1);
      }
    }
  }
  
  // Convert to array format
  const modules = Array.from(moduleMap.values())
    .map(m => ({
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      position: m.position,
      topics: Array.from(m.topics.entries()).map(([lessonId, stepCount]) => ({
        lessonId,
        stepCount,
      })),
    }))
    .sort((a, b) => a.position - b.position);
  
  return { modules };
}

/**
 * Get group average module analytics
 */
export async function getGroupModuleAnalytics(
  students: any[],
  submissions: any[],
  structure: any[],
  meetings?: any[]
): Promise<{
  moduleAverages: Array<{
    moduleId: number;
    moduleName: string;
    position: number;
    avgCompletionRate: number;
    avgSuccessRate: number;
    avgAttemptsPerStep: number;
    avgCompletedSteps: number;
    avgMeetingsAttended: number;
    totalStudents: number;
  }>;
}> {
  if (!structure || structure.length === 0 || !students || students.length === 0) {
    return { moduleAverages: [] };
  }

  // Extract unique module IDs
  const moduleIdsSet = new Set<number>();
  for (const row of structure) {
    const moduleId = Number(row.module_id || row.moduleid || 0);
    if (moduleId > 0) {
      moduleIdsSet.add(moduleId);
    }
  }
  
  const moduleIds = Array.from(moduleIdsSet);
  
  if (moduleIds.length === 0) {
    return { moduleAverages: [] };
  }

  // Fetch module names
  const moduleNamesMap = await getModuleNamesMapByIds(moduleIds);
  
  // Process module analytics for each student
  const allStudentStats: ModuleStats[][] = [];
  
  for (const student of students) {
    const userId = student.user_id || student.userid;
    if (!userId) continue;
    
    const stats = processModuleAnalytics(
      String(userId),
      submissions,
      structure,
      moduleNamesMap,
      meetings
    );
    allStudentStats.push(stats);
  }
  
  // Calculate averages for each module
  const moduleAverages = new Map<number, {
    module_id: number;
    module_name: string;
    module_position: number;
    avg_completion_rate: number;
    avg_success_rate: number;
    avg_attempts_per_step: number;
    total_students: number;
    avg_completed_steps: number;
    avg_meetings_attended: number;
  }>();
  
  for (const studentStats of allStudentStats) {
    for (const stat of studentStats) {
      if (!moduleAverages.has(stat.module_id)) {
        moduleAverages.set(stat.module_id, {
          module_id: stat.module_id,
          module_name: stat.module_name,
          module_position: stat.module_position,
          avg_completion_rate: 0,
          avg_success_rate: 0,
          avg_attempts_per_step: 0,
          total_students: 0,
          avg_completed_steps: 0,
          avg_meetings_attended: 0,
        });
      }
      
      const avg = moduleAverages.get(stat.module_id)!;
      avg.avg_completion_rate += stat.completion_rate;
      avg.avg_success_rate += stat.success_rate;
      avg.avg_attempts_per_step += stat.avg_attempts_per_step;
      avg.avg_completed_steps += stat.completed_steps;
      avg.avg_meetings_attended += stat.meetings_attended;
      avg.total_students += 1;
    }
  }
  
  // Calculate final averages
  const finalStats = Array.from(moduleAverages.values())
    .map(avg => ({
      moduleId: avg.module_id,
      moduleName: avg.module_name,
      position: avg.module_position,
      avgCompletionRate: avg.avg_completion_rate / avg.total_students,
      avgSuccessRate: avg.avg_success_rate / avg.total_students,
      avgAttemptsPerStep: avg.avg_attempts_per_step / avg.total_students,
      avgCompletedSteps: avg.avg_completed_steps / avg.total_students,
      avgMeetingsAttended: avg.avg_meetings_attended / avg.total_students,
      totalStudents: avg.total_students,
    }))
    .sort((a, b) => a.position - b.position);
  
  return { moduleAverages: finalStats };
}

/**
 * Get individual student module analytics
 */
export async function getStudentModuleAnalytics(
  userId: string,
  submissions: any[],
  structure: any[],
  meetings?: any[]
): Promise<{
  studentModules: Array<{
    moduleId: number;
    moduleName: string;
    position: number;
    completionRate: number;
    successRate: number;
    attemptsPerStep: number;
    completedSteps: number;
    totalSteps: number;
    meetingsAttended: number;
    activityPeriod?: {
      firstDate: string;
      lastDate: string;
    };
  }>;
}> {
  if (!structure || structure.length === 0) {
    return { studentModules: [] };
  }

  // Extract unique module IDs
  const moduleIdsSet = new Set<number>();
  for (const row of structure) {
    const moduleId = Number(row.module_id || row.moduleid || 0);
    if (moduleId > 0) {
      moduleIdsSet.add(moduleId);
    }
  }
  
  const moduleIds = Array.from(moduleIdsSet);
  
  if (moduleIds.length === 0) {
    return { studentModules: [] };
  }

  // Fetch module names
  const moduleNamesMap = await getModuleNamesMapByIds(moduleIds);
  
  // Process module analytics for this student
  const stats = processModuleAnalytics(
    userId,
    submissions,
    structure,
    moduleNamesMap,
    meetings
  );
  
  const studentModules = stats.map(s => ({
    moduleId: s.module_id,
    moduleName: s.module_name,
    position: s.module_position,
    completionRate: s.completion_rate,
    successRate: s.success_rate,
    attemptsPerStep: s.avg_attempts_per_step,
    completedSteps: s.completed_steps,
    totalSteps: s.total_steps,
    meetingsAttended: s.meetings_attended,
    activityPeriod: s.first_activity_date && s.last_activity_date ? {
      firstDate: s.first_activity_date,
      lastDate: s.last_activity_date,
    } : undefined,
  }));
  
  return { studentModules };
}

