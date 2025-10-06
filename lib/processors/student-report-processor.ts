import dayjs from 'dayjs';
import { 
  StudentReport, 
  StudentTopic, 
  StudentEngagement, 
  StudentHighlight,
  PerformanceRow,
  DynamicSummaryRow,
  DynamicSeriesRow
} from '@/lib/types';

interface ProcessorInput {
  userId: string;
  performanceData: PerformanceRow[];
  dynamicData: DynamicSummaryRow[];
  dynamicSeries: DynamicSeriesRow[];
  submissions: any[];
  structure?: any[];
  excludedUserIds: string[];
}

export function generateStudentReport({
  userId,
  performanceData,
  dynamicData,
  dynamicSeries,
  submissions,
  structure,
  excludedUserIds,
}: ProcessorInput): StudentReport | null {
  // Find student data
  const perfRow = performanceData.find(r => r.user_id === userId);
  const dynRow = dynamicData.find(r => r.user_id === userId);
  const series = dynamicSeries.filter(r => r.user_id === userId);

  if (!perfRow || !dynRow) {
    return null;
  }

  // Generate topic table
  const topicTable = generateTopicTable(userId, submissions, structure, excludedUserIds);

  // Extract signals
  const wins = extractWins(perfRow, dynRow, topicTable);
  const focus = extractFocus(perfRow, dynRow, topicTable);

  // Calculate overall engagement
  const engagement = calculateEngagement(perfRow, dynRow);

  // Generate highlights
  const highlights = generateHighlights(wins, focus);

  // Select top topics
  const topWins = selectTopTopics(topicTable.filter(t => t.label_topic === 'Comfortable'), 3);
  const topFocus = selectTopFocusTopics(topicTable.filter(t => t.label_topic === 'Attention' || t.label_topic === 'Watch'), 3);

  // Generate next steps
  const nextSteps = generateNextSteps(perfRow, dynRow, topFocus, engagement);

  // Curve explanation
  const curveExplanation = getCurveExplanation(dynRow.easing_label);

  return {
    student: {
      user_id: perfRow.user_id,
      name: perfRow.name,
      segment: perfRow.simple_segment,
      easing: dynRow.easing_label,
    },
    highlights,
    engagement,
    topics: {
      wins: topWins.map(t => ({ 
        title: t.topic_title, 
        why: t.student_first_pass_rate >= 0.7 ? 'high first-pass rate' : 'low attempts needed' 
      })),
      focus: topFocus.map(t => ({
        title: t.topic_title,
        why: getTopicReason(t),
        evidence: t.steps_attempted < 2 ? 'low evidence' : undefined,
      })),
    },
    curve: {
      label: dynRow.easing_label,
      fi: dynRow.frontload_index,
      explain: curveExplanation,
      consistency: dynRow.consistency,
      burstiness: dynRow.burstiness,
      t25: dynRow.t25,
      t50: dynRow.t50,
      t75: dynRow.t75,
    },
    next_steps: nextSteps,
    performance: perfRow,
    dynamic: dynRow,
    series,
    topicTable,
  };
}

function generateTopicTable(userId: string, submissions: any[], structure: any[] | undefined, excludedUserIds: string[]): StudentTopic[] {
  const excluded = new Set(excludedUserIds.map(id => String(id).trim().toLowerCase()));
  
  // Build structure map: step_id -> {lesson_id, unit_id, course_id}
  const structureMap = new Map<string, { lesson_id: number; unit_id: number; course_id: number }>();
  if (structure && structure.length > 0) {
    for (const row of structure) {
      const stepId = String(row.step_id || row.stepid || row.step || '').trim();
      const lessonId = Number(row.lesson_id || row.lessonid || 0);
      const moduleId = Number(row.module_id || row.moduleid || 0);
      const courseId = Number(row.course_id || row.courseid || 0);
      
      if (stepId && lessonId) {
        structureMap.set(stepId, {
          lesson_id: lessonId,
          unit_id: moduleId,
          course_id: courseId,
        });
      }
    }
  }
  
  // Group submissions by step_id for this user
  const stepStats = new Map<string, {
    attempts: number;
    firstAttemptCorrect: boolean;
    anyCorrect: boolean;
  }>();

  for (const row of submissions) {
    const rowUserId = String(row.user_id || row.userid || '').trim();
    if (rowUserId.toLowerCase() !== userId.toLowerCase() || excluded.has(rowUserId.toLowerCase())) {
      continue;
    }

    const stepId = String(row.step_id || row.stepid || row.step || '').trim();
    if (!stepId) continue;

    const status = String(row.status || row.result || '').toLowerCase();
    const isCorrect = status === 'correct';

    if (!stepStats.has(stepId)) {
      stepStats.set(stepId, {
        attempts: 0,
        firstAttemptCorrect: isCorrect,
        anyCorrect: isCorrect,
      });
    }

    const stats = stepStats.get(stepId)!;
    stats.attempts += 1;
    if (isCorrect) stats.anyCorrect = true;
  }

  // Fallback: create a single "Course Progress" topic if no step structure
  if (stepStats.size === 0) {
    return [];
  }

  // Group steps into synthetic topics (every 10 steps = 1 topic)
  const topics = new Map<string, {
    steps: string[];
    totalAttempts: number;
    firstPassCount: number;
    correctCount: number;
    firstStepId?: string;
    lessonId?: number;
    unitId?: number;
    courseId?: number;
  }>();

  for (const [stepId, stats] of stepStats.entries()) {
    // Extract numeric part from step_id if possible
    const stepNum = parseInt(stepId.replace(/\D/g, '')) || 0;
    const topicIndex = Math.floor(stepNum / 10);
    const topicKey = `Topic ${topicIndex + 1}`;

    if (!topics.has(topicKey)) {
      const structInfo = structureMap.get(stepId);
      topics.set(topicKey, {
        steps: [],
        totalAttempts: 0,
        firstPassCount: 0,
        correctCount: 0,
        firstStepId: stepId,
        lessonId: structInfo?.lesson_id,
        unitId: structInfo?.unit_id,
        courseId: structInfo?.course_id,
      });
    }

    const topic = topics.get(topicKey)!;
    topic.steps.push(stepId);
    topic.totalAttempts += stats.attempts;
    if (stats.firstAttemptCorrect) topic.firstPassCount += 1;
    if (stats.anyCorrect) topic.correctCount += 1;
  }

  // Calculate overall stats for comparison (course average)
  const courseStats = {
    avgAttemptsPerStep: 0,
    avgFirstPassRate: 0,
  };

  const allSteps = Array.from(stepStats.values());
  if (allSteps.length > 0) {
    courseStats.avgAttemptsPerStep = allSteps.reduce((sum, s) => sum + s.attempts, 0) / allSteps.length;
    courseStats.avgFirstPassRate = allSteps.filter(s => s.firstAttemptCorrect).length / allSteps.length;
  }

  // Convert to StudentTopic format
  const result: StudentTopic[] = [];
  for (const [topicTitle, data] of topics.entries()) {
    const stepsAttempted = data.steps.length;
    const attemptsPerStep = stepsAttempted > 0 ? data.totalAttempts / stepsAttempted : 0;
    const firstPassRate = stepsAttempted > 0 ? data.firstPassCount / stepsAttempted : 0;

    const deltaAttempts = attemptsPerStep - courseStats.avgAttemptsPerStep;
    const deltaFirst = firstPassRate - courseStats.avgFirstPassRate;

    // Calculate topic score (higher = more attention needed)
    const topicScore = Math.max(0, deltaAttempts * 0.5 - deltaFirst * 2);

    // Label topic
    let label: 'Comfortable' | 'Watch' | 'Attention' = 'Comfortable';
    if (topicScore > 2 || firstPassRate < 0.4) {
      label = 'Attention';
    } else if (topicScore > 1 || firstPassRate < 0.6) {
      label = 'Watch';
    }

    result.push({
      topic_title: topicTitle,
      steps_attempted: stepsAttempted,
      attempts_per_step: Number(attemptsPerStep.toFixed(2)),
      student_first_pass_rate: Number(firstPassRate.toFixed(2)),
      mean_delta_attempts: Number(deltaAttempts.toFixed(2)),
      mean_delta_first: Number(deltaFirst.toFixed(2)),
      topic_score: Number(topicScore.toFixed(2)),
      label_topic: label,
      lesson_id: data.lessonId,
      first_step_id: data.firstStepId ? Number(data.firstStepId) : undefined,
      unit_id: data.unitId,
      course_id: data.courseId,
    });
  }

  return result.sort((a, b) => b.topic_score - a.topic_score);
}

function extractWins(
  perf: PerformanceRow, 
  dyn: DynamicSummaryRow, 
  topics: StudentTopic[]
): Array<{ type: string; score: number }> {
  const wins: Array<{ type: string; score: number }> = [];

  // Achievement
  if (perf.total_pct >= 80 || perf.success_rate >= 85) {
    wins.push({ type: 'achievement', score: Math.max(perf.total_pct, perf.success_rate) });
  }

  // Consistency
  if (perf.consistency_index >= 0.5 || dyn.consistency >= 0.5) {
    wins.push({ type: 'consistency', score: Math.max(perf.consistency_index, dyn.consistency) * 100 });
  }

  // Steady work
  if (dyn.burstiness <= 0.6) {
    wins.push({ type: 'steady', score: (1 - dyn.burstiness) * 100 });
  }

  // Early progress
  if (dyn.frontload_index >= 0.10) {
    wins.push({ type: 'early_progress', score: dyn.frontload_index * 100 });
  }

  // Comfortable topics
  const comfortableTopics = topics.filter(t => t.label_topic === 'Comfortable' && t.student_first_pass_rate >= 0.7);
  for (const topic of comfortableTopics.slice(0, 2)) {
    wins.push({ type: 'topic_win', score: topic.student_first_pass_rate * 100 });
  }

  return wins;
}

function extractFocus(
  perf: PerformanceRow,
  dyn: DynamicSummaryRow,
  topics: StudentTopic[]
): Array<{ type: string; score: number; detail?: string }> {
  const focus: Array<{ type: string; score: number; detail?: string }> = [];

  // Struggling topics
  const attentionTopics = topics.filter(t => t.label_topic === 'Attention' || t.label_topic === 'Watch');
  for (const topic of attentionTopics.slice(0, 2)) {
    focus.push({ type: 'topic_focus', score: topic.topic_score, detail: topic.topic_title });
  }

  // Struggle index
  if (perf.struggle_index >= 0.6) {
    focus.push({ type: 'struggle', score: perf.struggle_index * 100 });
  }

  // Low overall consistency (based on entire period, not just last week)
  if (perf.active_days_ratio < 0.3) {
    focus.push({ type: 'low_consistency', score: (1 - perf.active_days_ratio) * 100 });
  }

  // High burstiness pattern (working in sporadic bursts across entire period)
  if (dyn.burstiness > 0.8) {
    focus.push({ type: 'high_burstiness', score: dyn.burstiness * 100 });
  }

  // Easing risk patterns (overall work distribution)
  if (dyn.easing_label === 'ease-in' && dyn.t25 > 0.4) {
    focus.push({ type: 'late_start', score: dyn.t25 * 100 });
  }

  // Early dropoff pattern (completed most work early then stopped)
  if (dyn.easing_label === 'ease-out' && dyn.t75 < 0.6) {
    focus.push({ type: 'early_dropoff', score: (1 - dyn.t75) * 100 });
  }

  return focus;
}

function calculateEngagement(
  perf: PerformanceRow,
  dyn: DynamicSummaryRow
): StudentEngagement {
  const activeDaysRatio = perf.active_days_ratio;
  const consistency = dyn.consistency;
  const avgEngagement = (activeDaysRatio + consistency) / 2;

  let level: 'High' | 'Medium' | 'Low';
  let description: string;

  if (avgEngagement >= 0.6) {
    level = 'High';
    description = `You've been highly engaged throughout the course, active on ${perf.active_days} days (${Math.round(activeDaysRatio * 100)}% of the period).`;
  } else if (avgEngagement >= 0.3) {
    level = 'Medium';
    description = `You've maintained moderate engagement, active on ${perf.active_days} days (${Math.round(activeDaysRatio * 100)}% of the period).`;
  } else {
    level = 'Low';
    description = `Your overall engagement shows room for improvement — you were active on ${perf.active_days} days (${Math.round(activeDaysRatio * 100)}% of the period).`;
  }

  return {
    level,
    description,
    active_days_ratio: activeDaysRatio,
  };
}

function generateHighlights(
  wins: Array<{ type: string; score: number }>,
  focus: Array<{ type: string; score: number; detail?: string }>
): StudentHighlight[] {
  const highlights: StudentHighlight[] = [];

  // Top 2 wins
  const sortedWins = wins.sort((a, b) => b.score - a.score).slice(0, 2);
  for (const win of sortedWins) {
    let text = '';
    switch (win.type) {
      case 'achievement':
        text = `Strong overall performance — your score is well above average.`;
        break;
      case 'consistency':
        text = `Steady engagement throughout — your consistency is strong.`;
        break;
      case 'steady':
        text = `Balanced work pattern — you maintain even pace across the course.`;
        break;
      case 'early_progress':
        text = `Great start — you frontloaded your efforts effectively.`;
        break;
      case 'topic_win':
        text = `High first-pass success rate on comfortable topics.`;
        break;
    }
    if (text) highlights.push({ type: 'win', text });
  }

  // Top 1-2 focus items
  const sortedFocus = focus.sort((a, b) => b.score - a.score).slice(0, 2);
  for (const item of sortedFocus) {
    let text = '';
    switch (item.type) {
      case 'topic_focus':
        text = `"${item.detail}" needed extra attempts — revisiting key concepts may help.`;
        break;
      case 'struggle':
        text = `Some topics required many retries — reviewing fundamentals could strengthen understanding.`;
        break;
      case 'low_consistency':
        text = `Overall engagement could be more regular — try establishing a consistent study schedule.`;
        break;
      case 'high_burstiness':
        text = `Work pattern shows sporadic bursts — more regular sessions could improve retention.`;
        break;
      case 'late_start':
        text = `Slow start pattern — beginning new material earlier could help build understanding.`;
        break;
      case 'early_dropoff':
        text = `Strong start but activity dropped off — maintaining pace throughout is beneficial.`;
        break;
    }
    if (text) highlights.push({ type: 'focus', text, reason: item.type });
  }

  // Ensure at least 1 win before any focus
  if (highlights.length === 0 || highlights[0].type !== 'win') {
    highlights.unshift({ 
      type: 'win', 
      text: 'You are making progress — keep up the good work!' 
    });
  }

  return highlights.slice(0, 5);
}

function selectTopTopics(topics: StudentTopic[], limit: number): StudentTopic[] {
  return topics
    .filter(t => t.steps_attempted >= 2)
    .sort((a, b) => b.student_first_pass_rate - a.student_first_pass_rate || a.attempts_per_step - b.attempts_per_step)
    .slice(0, limit);
}

function selectTopFocusTopics(topics: StudentTopic[], limit: number): StudentTopic[] {
  return topics
    .sort((a, b) => b.topic_score - a.topic_score)
    .slice(0, limit);
}

function getTopicReason(topic: StudentTopic): string {
  const extraAttempts = topic.mean_delta_attempts > 0.5;
  const lowFirstPass = topic.mean_delta_first < -0.2;

  if (extraAttempts && lowFirstPass) return 'extra attempts + low first-pass rate';
  if (extraAttempts) return 'extra attempts needed';
  if (lowFirstPass) return 'first-pass rate below average';
  return 'needs attention';
}

function generateNextSteps(
  perf: PerformanceRow,
  dyn: DynamicSummaryRow,
  focusTopics: StudentTopic[],
  engagement: StudentEngagement
): string[] {
  const steps: string[] = [];

  // 1. Focus topic
  if (focusTopics.length > 0) {
    const topic = focusTopics[0];
    steps.push(`Review "${topic.topic_title}" — start with the steps that took most attempts or weren't solved on first try.`);
  }

  // 2. Low overall engagement
  if (engagement.level === 'Low') {
    steps.push(`Establish a regular study schedule — consistent short sessions are more effective than long sporadic ones.`);
  }

  // 3. High burstiness pattern
  if (dyn.burstiness > 0.8) {
    steps.push(`Work on creating a more regular study rhythm — daily or every-other-day sessions help with retention.`);
  }

  // 4. Meeting attendance
  if (perf.meetings_attended_pct < 40 && perf.meetings_attended_pct > 0) {
    steps.push(`Consider attending more webinars — they're valuable for connecting with peers and clarifying concepts.`);
  }

  // 5. Reinforce strength or general advice
  if (steps.length === 0) {
    if (perf.success_rate >= 80) {
      steps.push(`Excellent work! Continue challenging yourself with advanced topics.`);
    } else if (dyn.consistency >= 0.5) {
      steps.push(`Your consistent approach is working well — keep maintaining that rhythm.`);
    } else {
      steps.push(`Try establishing a more regular study pattern to improve retention and understanding.`);
    }
  }

  // Add one more if needed
  if (steps.length === 1) {
    if (perf.success_rate < 70) {
      steps.push(`Focus on understanding core concepts before moving to new topics — quality over speed.`);
    } else if (perf.persistence > 3) {
      steps.push(`You show great persistence — make sure to review successful strategies that work for you.`);
    } else {
      steps.push(`Keep up the good progress and don't hesitate to ask for help when needed.`);
    }
  }

  return steps.slice(0, 3);
}

function getCurveExplanation(easingLabel: string): string {
  switch (easingLabel) {
    case 'linear':
      return 'Steady pace throughout';
    case 'ease':
      return 'Gradual, smooth progress overall';
    case 'ease-in':
      return 'You ramp up later; consider an early start each week';
    case 'ease-out':
      return 'Strong start; keep momentum in the second half';
    case 'ease-in-out':
      return 'Work in waves; try to smooth dips with short sessions';
    case 'no-activity':
      return 'No activity pattern detected';
    default:
      return 'Progress pattern varies';
  }
}

