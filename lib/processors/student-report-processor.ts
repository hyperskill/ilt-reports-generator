import dayjs from 'dayjs';
import { 
  StudentReport, 
  StudentTopic, 
  StudentMomentum, 
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
  excludedUserIds: string[];
}

export function generateStudentReport({
  userId,
  performanceData,
  dynamicData,
  dynamicSeries,
  submissions,
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
  const topicTable = generateTopicTable(userId, submissions, excludedUserIds);

  // Extract signals
  const wins = extractWins(perfRow, dynRow, topicTable);
  const focus = extractFocus(perfRow, dynRow, topicTable, series);

  // Calculate momentum
  const momentum = calculateMomentum(series);

  // Generate highlights
  const highlights = generateHighlights(wins, focus);

  // Select top topics
  const topWins = selectTopTopics(topicTable.filter(t => t.label_topic === 'Comfortable'), 3);
  const topFocus = selectTopFocusTopics(topicTable.filter(t => t.label_topic === 'Attention' || t.label_topic === 'Watch'), 3);

  // Generate next steps
  const nextSteps = generateNextSteps(perfRow, dynRow, topFocus, momentum);

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
    momentum,
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

function generateTopicTable(userId: string, submissions: any[], excludedUserIds: string[]): StudentTopic[] {
  const excluded = new Set(excludedUserIds.map(id => String(id).trim().toLowerCase()));
  
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
  }>();

  for (const [stepId, stats] of stepStats.entries()) {
    // Extract numeric part from step_id if possible
    const stepNum = parseInt(stepId.replace(/\D/g, '')) || 0;
    const topicIndex = Math.floor(stepNum / 10);
    const topicKey = `Topic ${topicIndex + 1}`;

    if (!topics.has(topicKey)) {
      topics.set(topicKey, {
        steps: [],
        totalAttempts: 0,
        firstPassCount: 0,
        correctCount: 0,
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
  topics: StudentTopic[],
  series: DynamicSeriesRow[]
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

  // Low consistency
  if (perf.active_days_ratio < 0.3) {
    focus.push({ type: 'low_consistency', score: (1 - perf.active_days_ratio) * 100 });
  }

  // Momentum down (calculated separately)
  const momentum = calculateMomentum(series);
  if (momentum.trend === 'Down') {
    focus.push({ type: 'momentum_down', score: Math.abs(momentum.delta) * 100 });
  }

  // Easing risk patterns
  if (dyn.easing_label === 'ease-in' && dyn.t25 > 0.4) {
    focus.push({ type: 'late_start', score: dyn.t25 * 100 });
  }

  if (dyn.easing_label === 'ease-out' && dyn.t75 < 0.6 && momentum.trend === 'Down') {
    focus.push({ type: 'end_dropoff', score: (1 - dyn.t75) * 100 });
  }

  return focus;
}

function calculateMomentum(series: DynamicSeriesRow[]): StudentMomentum {
  if (series.length < 14) {
    return {
      trend: 'Unknown',
      delta: 0,
      note: 'Not enough data to calculate momentum (need at least 14 days).',
    };
  }

  // Sort by date
  const sorted = [...series].sort((a, b) => a.date_iso.localeCompare(b.date_iso));

  // Last 7 days
  const last7 = sorted.slice(-7);
  const last7Total = last7.reduce((sum, row) => sum + row.activity_total, 0);

  // Previous 7 days (days -14 to -8)
  const prev7 = sorted.slice(-14, -7);
  const prev7Total = prev7.reduce((sum, row) => sum + row.activity_total, 0);

  const delta = prev7Total > 0 ? (last7Total - prev7Total) / prev7Total : 0;

  let trend: 'Up' | 'Flat' | 'Down' = 'Flat';
  let note = 'Activity level is similar to the previous week.';

  if (delta >= 0.15) {
    trend = 'Up';
    note = `Activity increased by ${Math.round(delta * 100)}% compared to the previous week.`;
  } else if (delta <= -0.15) {
    trend = 'Down';
    note = `Activity decreased by ${Math.round(Math.abs(delta) * 100)}% compared to the previous week.`;
  }

  return { trend, delta, note };
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
        text = `Strong performance — your score is well above average.`;
        break;
      case 'consistency':
        text = `Steady weekly rhythm — your consistency is strong.`;
        break;
      case 'steady':
        text = `Balanced work pattern — you maintain even pace throughout.`;
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
        text = `"${item.detail}" needed extra attempts — let's revisit the key concepts.`;
        break;
      case 'struggle':
        text = `Some topics required many retries — review fundamentals may help.`;
        break;
      case 'low_consistency':
        text = `Fewer active days recently — try short daily sessions to build momentum.`;
        break;
      case 'momentum_down':
        text = `Activity dipped this week — plan two 20-30 min sessions to regain pace.`;
        break;
      case 'late_start':
        text = `Slow start pattern detected — consider beginning each week with a quick task.`;
        break;
      case 'end_dropoff':
        text = `Strong start but activity dropped later — keep momentum in the second half.`;
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
  momentum: StudentMomentum
): string[] {
  const steps: string[] = [];

  // 1. Focus topic
  if (focusTopics.length > 0) {
    const topic = focusTopics[0];
    steps.push(`Review "${topic.topic_title}" — start with the steps that took most attempts or weren't solved on first try.`);
  }

  // 2. Momentum down
  if (momentum.trend === 'Down') {
    steps.push(`Plan two short sessions this week (20–30 min) to regain pace.`);
  }

  // 3. Meeting attendance
  if (perf.meetings_attended_pct < 40 && perf.meetings_attended_pct > 0) {
    steps.push(`Join the next webinar to connect with peers and clarify concepts.`);
  }

  // 4. Reinforce strength or general advice
  if (steps.length === 0) {
    if (dyn.consistency >= 0.5) {
      steps.push(`Maintain steady rhythm: aim for 3 active days this week.`);
    } else {
      steps.push(`Try shorter, more frequent study sessions to build consistency.`);
    }
  }

  // Add one more if needed
  if (steps.length === 1) {
    if (perf.success_rate < 70) {
      steps.push(`Focus on understanding concepts before moving to new topics.`);
    } else {
      steps.push(`Keep challenging yourself with new material.`);
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

