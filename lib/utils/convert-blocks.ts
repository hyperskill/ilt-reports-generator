import { ReportBlock } from '@/lib/types';
import { processModuleAnalytics } from '@/lib/processors/module-analytics';
import { getModuleNamesMapByIdsWithRetry } from '@/lib/utils/cogniterra-api-wrapper';

export async function convertToBlocks(
  content: any, 
  reportType: 'manager' | 'student',
  reportData: any
): Promise<ReportBlock[]> {
  const blocks: ReportBlock[] = [];
  let order = 0;

  if (reportType === 'manager') {
    // 1. Executive Summary
    blocks.push({
      id: 'executive-summary',
      type: 'section',
      title: 'Executive Summary',
      content: content.executiveSummary || '',
      order: order++,
    });

    // === SEGMENTATION ANALYSIS ===
    // 2. Student Segmentation Distribution (pie-chart)
    // 3. Segmentation Statistics (table)
    if (reportData.performanceData && reportData.performanceData.length > 0) {
      // Segment distribution pie chart
      const segments: Record<string, number> = {};
      const segmentStats: Record<string, { count: number; avgScore: number; totalScore: number }> = {};
      
      reportData.performanceData.forEach((student: any) => {
        const seg = student.simple_segment || 'Unknown';
        segments[seg] = (segments[seg] || 0) + 1;
        
        if (!segmentStats[seg]) {
          segmentStats[seg] = { count: 0, avgScore: 0, totalScore: 0 };
        }
        segmentStats[seg].count += 1;
        segmentStats[seg].totalScore += student.total_pct || 0;
      });

      // Calculate averages
      Object.keys(segmentStats).forEach(seg => {
        segmentStats[seg].avgScore = segmentStats[seg].totalScore / segmentStats[seg].count;
      });

      blocks.push({
        id: 'segment-distribution',
        type: 'pie-chart',
        title: 'Student Segmentation Distribution',
        content: '',
        data: segments,
        config: {
          chartType: 'pie',
          showLegend: true,
        },
        helpText: '<p>This chart shows how your students are grouped based on their performance and engagement.</p><p><strong>Segment definitions (based on objective metrics):</strong></p><ul><li><strong>Highly engaged</strong> - Completion ≥80% + Meeting attendance ≥70% (shows both high performance and active participation in live sessions)</li><li><strong>Highly efficient</strong> - Completion ≥80% + Low attempts per task (≤3) + Regular work pattern (≥50% course days) (achieves top results efficiently without excessive effort)</li><li><strong>Moderately engaged</strong> - Completion 30-80% + Meeting attendance ≥60% + Regular activity (≥40% course days) (solid performance with consistent participation)</li><li><strong>Moderately performing</strong> - Completion 30-80% (average performance, standard engagement)</li><li><strong>Highly effortful</strong> - High effort (above-average submissions and active days) + High struggle score (many attempts per task + low success rate) (putting in effort but facing challenges)</li><li><strong>Low participation</strong> - Completion <30% with very few submissions (<20) OR very low activity (below-average effort + irregular work pattern) (minimal participation or progress)</li></ul>',
        order: order++,
      });

      // Segment statistics table
      const segmentTableData = Object.entries(segmentStats).map(([segment, stats]) => ({
        segment,
        student_count: stats.count,
        percentage: `${((stats.count / reportData.performanceData.length) * 100).toFixed(1)}%`,
        avg_completion: `${stats.avgScore.toFixed(1)}%`,
      })).sort((a, b) => {
        // Custom sort: Leader first, then Balanced, then others
        const getSegmentPriority = (seg: string): number => {
          const segLower = seg.toLowerCase();
          if (segLower.includes('leader')) return 1;
          if (segLower.includes('balanced')) return 2;
          if (segLower.includes('low')) return 3;
          if (segLower.includes('hardworking')) return 4;
          return 5;
        };
        
        const priorityA = getSegmentPriority(a.segment);
        const priorityB = getSegmentPriority(b.segment);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // Within same priority, sort by segment name alphabetically
        return a.segment.localeCompare(b.segment);
      });

      blocks.push({
        id: 'segment-statistics',
        type: 'table',
        title: 'Segmentation Statistics',
        content: '',
        data: segmentTableData,
        config: {
          columns: ['segment', 'student_count', 'percentage', 'avg_completion'],
        },
        helpText: '<p>This table breaks down each student group with detailed statistics.</p><p><strong>What each column shows:</strong></p><ul><li><strong>Segment</strong> - Group classification based on completion rate, meeting attendance, work efficiency (attempts per task), and activity patterns</li><li><strong>Student Count</strong> - Number of students in this segment</li><li><strong>Percentage</strong> - Proportion of total class in this segment</li><li><strong>Avg Completion</strong> - Average course completion percentage for students in this segment</li></ul><p><strong>Key metrics used for segmentation:</strong></p><ul><li>Completion rate (% of course finished)</li><li>Meeting attendance (% of live sessions attended)</li><li>Effort index (based on total submissions and active days)</li><li>Consistency index (% of course days active)</li><li>Struggle index (attempts per task vs. success rate)</li></ul>',
        order: order++,
      });
    }

    // 4. Student Performance Overview
    if (reportData.performanceData && reportData.performanceData.length > 0) {
      const allStudents = [...reportData.performanceData]
        .sort((a: any, b: any) => b.total_pct - a.total_pct)
        .map((s: any) => ({
          name: s.name,
          completion: `${s.total_pct.toFixed(1)}%`,
          success_rate: `${s.success_rate.toFixed(1)}%`,
          meetings: s.total_meetings > 0 
            ? `${s.meetings_attended || 0}/${s.total_meetings} (${s.meetings_attended_pct?.toFixed(0) || 0}%)`
            : `${s.meetings_attended || 0}/${s.meetings_attended_pct?.toFixed(0) || 0}%`,
          segment: s.simple_segment,
        }));

      blocks.push({
        id: 'all-students-performance',
        type: 'table',
        title: 'Student Performance Overview',
        content: '',
        data: allStudents,
        config: {
          columns: ['name', 'completion', 'success_rate', 'meetings', 'segment'],
        },
        helpText: '<p>A complete list of all your students with their key performance indicators.</p><p><strong>What you\'re seeing:</strong></p><ul><li><strong>Name</strong> - Student name</li><li><strong>Completion</strong> - How much of the course they finished</li><li><strong>Success Rate</strong> - How often they got things right</li><li><strong>Meetings</strong> - Sessions they attended</li><li><strong>Segment</strong> - Which performance group they\'re in</li></ul>',
        order: order++,
      });
    }

    // 5. Team Engagement & Dynamics
    blocks.push({
      id: 'team-engagement',
      type: 'section',
      title: 'Team Engagement & Dynamics',
      content: content.teamEngagement || content.groupDynamics || '',
      order: order++,
    });

    // === DYNAMIC/EASING ANALYSIS ===
    // 6. Activity Pattern Distribution (pie-chart)
    // 7. Activity Pattern Statistics (table)
    if (reportData.dynamicData && reportData.dynamicData.length > 0) {
      // Easing label distribution pie chart
      const easingLabels: Record<string, number> = {};
      const easingStats: Record<string, { count: number; avgFrontload: number; totalFrontload: number }> = {};
      
      reportData.dynamicData.forEach((student: any) => {
        const label = student.easing_label || 'Unknown';
        easingLabels[label] = (easingLabels[label] || 0) + 1;
        
        if (!easingStats[label]) {
          easingStats[label] = { count: 0, avgFrontload: 0, totalFrontload: 0 };
        }
        easingStats[label].count += 1;
        easingStats[label].totalFrontload += student.frontload_index || 0;
      });

      // Calculate averages
      Object.keys(easingStats).forEach(label => {
        easingStats[label].avgFrontload = easingStats[label].totalFrontload / easingStats[label].count;
      });

      blocks.push({
        id: 'easing-distribution',
        type: 'pie-chart',
        title: 'Activity Pattern Distribution (Easing Types)',
        content: '',
        data: easingLabels,
        config: {
          chartType: 'pie',
          showLegend: true,
        },
        helpText: '<p>This chart shows <em>when</em> students did their work during the course.</p><p><strong>Work patterns explained:</strong></p><ul><li><strong>Ease-out</strong> - Started strong, then slowed down (front-loaders)</li><li><strong>Ease-in</strong> - Started slow, picked up speed later (late starters)</li><li><strong>Linear</strong> - Worked at a steady pace the whole time</li><li><strong>Ease</strong> - Gradually picked up the pace</li><li><strong>Ease-in-out</strong> - Slow start, busy middle, slow finish</li></ul>',
        order: order++,
      });

      // Dynamic statistics table
      const dynamicTableData = Object.entries(easingStats).map(([pattern, stats]) => ({
        pattern,
        student_count: stats.count,
        percentage: `${((stats.count / reportData.dynamicData.length) * 100).toFixed(1)}%`,
        avg_frontload_index: stats.avgFrontload.toFixed(3),
      })).sort((a, b) => b.student_count - a.student_count);

      blocks.push({
        id: 'dynamic-statistics',
        type: 'table',
        title: 'Activity Pattern Statistics',
        content: '',
        data: dynamicTableData,
        config: {
          columns: ['pattern', 'student_count', 'percentage', 'avg_frontload_index'],
        },
        helpText: '<p>Details about how different groups of students paced their work.</p><p><strong>What the columns mean:</strong></p><ul><li><strong>Pattern</strong> - The work style (when they did most of their work)</li><li><strong>Student Count</strong> - How many students worked this way</li><li><strong>Percentage</strong> - What portion of the class</li><li><strong>Avg Frontload Index</strong> - A score showing if they started early or late:<ul><li>Positive number = Started early (good!)</li><li>Negative number = Left it to the end</li><li>Close to zero = Spread out evenly</li></ul></li></ul>',
        order: order++,
      });
    }

    // 8. Skills Acquired & Learning Outcomes
    blocks.push({
      id: 'skills-acquired',
      type: 'section',
      title: 'Skills Acquired & Learning Outcomes',
      content: content.skillsAcquired || content.learningOutcomes || '',
      order: order++,
    });

    // === MODULE ANALYTICS ===
    // 9. Group Activity by Module (chart)
    // 10. Group Performance by Module (table)
    if (reportData.performanceData?.length > 0) {
      // Get unique module IDs from structure data
      const moduleIds: number[] = Array.from(new Set(
        (reportData.structure || [])
          .filter((s: any) => s.module_id)
          .map((s: any) => Number(s.module_id))
      ));

      // Get module names from Cogniterra API
      const moduleNamesMap = await getModuleNamesMapByIdsWithRetry(moduleIds, 'shared report');

      // Process module analytics for each student
      const allStudentStats: any[][] = [];
      
      for (const student of reportData.performanceData) {
        const userId = student.user_id || student.userid;
        if (!userId) continue;
        
        const stats = processModuleAnalytics(
          String(userId), 
          reportData.submissions || [],
          reportData.structure || [],
          moduleNamesMap,
          reportData.meetings || []
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
      const finalStats = Array.from(moduleAverages.values()).map(avg => ({
        ...avg,
        avg_completion_rate: avg.avg_completion_rate / avg.total_students,
        avg_success_rate: avg.avg_success_rate / avg.total_students,
        avg_attempts_per_step: avg.avg_attempts_per_step / avg.total_students,
        avg_completed_steps: avg.avg_completed_steps / avg.total_students,
        avg_meetings_attended: avg.avg_meetings_attended / avg.total_students,
      })).sort((a, b) => a.module_position - b.module_position);

      const moduleTableData = finalStats.map((m: any) => ({
        module: m.module_name,
        avg_completion: `${m.avg_completion_rate?.toFixed(1) || 0}%`,
        avg_success_rate: `${m.avg_success_rate?.toFixed(1) || 0}%`,
        avg_attempts_per_step: m.avg_attempts_per_step?.toFixed(1),
        avg_meetings: m.avg_meetings_attended?.toFixed(1),
        students: m.total_students
      }));

      // Add chart block
      blocks.push({
        id: 'group-module-analytics-chart',
        type: 'bar-chart',
        title: 'Group Activity by Module',
        content: '',
        data: finalStats.map((m: any) => ({
          label: m.module_name,
          avg_completed_steps: m.avg_completed_steps,
          avg_meetings_attended: m.avg_meetings_attended,
        })),
        config: {
          datasets: [
            {
              label: 'Avg Completed Steps',
              dataKey: 'avg_completed_steps',
              backgroundColor: 'rgba(75, 192, 192, 0.7)',
              borderColor: 'rgb(75, 192, 192)',
              yAxisID: 'y',
            },
            {
              label: 'Avg Meetings Attended',
              dataKey: 'avg_meetings_attended',
              backgroundColor: 'rgba(153, 102, 255, 0.8)',
              borderColor: 'rgb(153, 102, 255)',
              yAxisID: 'y1',
            }
          ],
          scales: {
            y: { title: 'Avg Completed Steps', position: 'left' },
            y1: { title: 'Avg Meetings Attended', position: 'right' }
          }
        },
        helpText: '<p>Visual representation of group activity across modules.</p><p><strong>Avg Completed Steps</strong> (teal bars, left axis) - Average number of successfully completed exercises per student in each module.</p><p><strong>Avg Meetings Attended</strong> (purple bars, right axis) - Average number of live sessions attended per student during each module\'s activity period.</p><p><strong>Insights:</strong> Compare activity levels across modules and identify patterns between meeting attendance and learning progress.</p>',
        order: order++,
      });

      // Add table block
      blocks.push({
        id: 'group-module-analytics-table',
        type: 'table',
        title: 'Group Performance by Module',
        content: '',
        data: moduleTableData,
        config: {
          columns: ['module', 'avg_completion', 'avg_success_rate', 'avg_attempts_per_step', 'avg_meetings', 'students'],
        },
        helpText: '<p>Average performance metrics across all students for each course module.</p><p><strong>What the columns show:</strong></p><ul><li><strong>Module</strong> - Course module name</li><li><strong>Avg Completion</strong> - Average completion percentage</li><li><strong>Avg Success Rate</strong> - Average success rate on exercises</li><li><strong>Avg Attempts/Step</strong> - Average attempts needed per exercise</li><li><strong>Avg Meetings</strong> - Average meetings attended during this module</li><li><strong>Students</strong> - Number of students who worked on this module</li></ul><p><strong>What to look for:</strong></p><ul><li><strong>Low completion rates</strong> - Modules where students struggle to finish</li><li><strong>Low success rates</strong> - Challenging content that needs attention</li><li><strong>High attempts/step</strong> - Difficult exercises requiring multiple tries</li><li><strong>Meeting attendance patterns</strong> - Correlation between live sessions and performance</li></ul>',
        order: order++,
      });

      // 11. Learning Outcomes & Tools Progress (new block)
      // Use pre-fetched outcomes/tools if available, otherwise fetch
      try {
        let outcomesData, toolsData;
        
        if (reportData.learningOutcomes && reportData.moduleTools) {
          // Use pre-fetched data (passed from API route with proper auth)
          outcomesData = { learningOutcomes: reportData.learningOutcomes };
          toolsData = { moduleTools: reportData.moduleTools };
        } else {
          // Fallback: fetch (may fail with 401 if called from server without auth)
          
          const [outcomesResponse, toolsResponse] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/learning-outcomes?reportId=${reportData.reportId}`),
            fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/module-tools?reportId=${reportData.reportId}`),
          ]);

          outcomesData = outcomesResponse.ok ? await outcomesResponse.json() : { learningOutcomes: [] };
          toolsData = toolsResponse.ok ? await toolsResponse.json() : { moduleTools: [] };
        }
        
        // Create maps for quick lookup (use both number and string keys for compatibility)
        const outcomesMap = new Map();
        (outcomesData.learningOutcomes || []).forEach((lo: any) => {
          outcomesMap.set(lo.module_id, { outcomes: lo.outcomes, title: lo.module_title });
          outcomesMap.set(String(lo.module_id), { outcomes: lo.outcomes, title: lo.module_title });
          outcomesMap.set(Number(lo.module_id), { outcomes: lo.outcomes, title: lo.module_title });
        });
        
        const toolsMap = new Map();
        (toolsData.moduleTools || []).forEach((mt: any) => {
          toolsMap.set(mt.module_id, mt.tools);
          toolsMap.set(String(mt.module_id), mt.tools);
          toolsMap.set(Number(mt.module_id), mt.tools);
        });

        // Build data array with module progress and outcomes/tools
        // Show ALL modules (same as GroupLearningProgress), not just those with outcomes/tools
        
        const learningProgressData = finalStats.map((m: any) => {
          const outcomes = outcomesMap.get(m.module_id);
          const tools = toolsMap.get(m.module_id);
          
          return {
            module_id: m.module_id,
            module_name: m.module_name,
            module_position: m.module_position,
            completion_rate: m.avg_completion_rate,
            success_rate: m.avg_success_rate,
            total_students: m.total_students,
            learning_outcomes: outcomes?.outcomes || '',
            tools: tools || '',
          };
        });

        if (learningProgressData.length > 0) {
          blocks.push({
            id: 'learning-outcomes-progress',
            type: 'learning-outcomes',
            title: 'Learning Outcomes & Tools Progress',
            content: '', // Not used for this block type
            data: learningProgressData,
            config: {
              viewType: 'group', // Indicates this is for group/manager view
            },
            helpText: '<p>Track how the group is mastering learning outcomes and tools across course modules.</p><p><strong>Progress indicators:</strong> Green (≥75% completion) = Excellent, Orange (50-74%) = Moderate, Red (<50%) = Needs Attention</p>',
            order: order++,
          });
        }
      } catch (error) {
        console.error('Failed to fetch learning outcomes/tools for manager report:', error);
        // Continue without the block if fetch fails
      }
    }

    // 12. Expert Observations & Project Highlights
    blocks.push({
      id: 'expert-observations',
      type: 'section',
      title: 'Expert Observations & Project Highlights',
      content: content.expertObservations || '',
      order: order++,
    });

    // 12-14. Team Comments
    if (reportData.teamComments?.programExpert) {
      blocks.push({
        id: 'program-expert-comments',
        type: 'comments',
        title: 'Program Expert Feedback',
        content: reportData.teamComments.programExpert,
        order: order++,
      });
    }
    
    if (reportData.teamComments?.teachingAssistants) {
      blocks.push({
        id: 'teaching-assistants-comments',
        type: 'comments',
        title: 'Teaching Assistants Feedback',
        content: reportData.teamComments.teachingAssistants,
        order: order++,
      });
    }
    
    if (reportData.teamComments?.learningSupport) {
      blocks.push({
        id: 'learning-support-comments',
        type: 'comments',
        title: 'Learning Support Feedback',
        content: reportData.teamComments.learningSupport,
        order: order++,
      });
    }

    // 15. Business Recommendations & Next Steps
    blocks.push({
      id: 'recommendations',
      type: 'section',
      title: 'Business Recommendations & Next Steps',
      content: content.recommendations || content.opportunities || '',
      order: order++,
    });
  } else {
    // Student report blocks
    
    // 1. Learning Journey
    blocks.push({
      id: 'learning-journey',
      type: 'section',
      title: 'Your Learning Journey',
      content: content.learningJourney || '',
      order: order++,
    });

    // 2. Performance Overview
    if (reportData.performance) {
      blocks.push({
        id: 'performance-metrics',
        type: 'table',
        title: 'Your Performance Overview',
        content: '',
        data: [{
          completion: `${reportData.performance.total_pct?.toFixed(1) || 0}%`,
          success_rate: `${(reportData.performance.success_rate || 0).toFixed(1)}%`,
          submissions: reportData.performance.submissions || 0,
          correct_submissions: reportData.performance.correct_submissions || 0,
          meetings: `${reportData.performance.meetings_attended || 0} (${reportData.performance.meetings_attended_pct?.toFixed(1) || 0}%)`,
          segment: reportData.performance.simple_segment || 'N/A',
        }],
        config: {
          columns: ['completion', 'success_rate', 'submissions', 'correct_submissions', 'meetings', 'segment'],
        },
        helpText: '<p>Here\'s a quick snapshot of how you did in the course!</p><p><strong>What these numbers mean:</strong></p><ul><li><strong>Completion</strong> - How much of the course you finished</li><li><strong>Success Rate</strong> - How often you got things right on the first try</li><li><strong>Submissions</strong> - Total times you tried exercises</li><li><strong>Correct Submissions</strong> - Times you got it right</li><li><strong>Meetings</strong> - Sessions you joined</li><li><strong>Segment</strong> - Your overall performance category</li></ul>',
        order: order++,
      });
    }

    // 3. Strengths & Achievements
    blocks.push({
      id: 'strengths-achievements',
      type: 'section',
      title: 'Your Strengths & Achievements',
      content: content.strengthsAchievements || '',
      order: order++,
    });

    // 4. Activity by Module chart and
    // 5. Progress by Module table will be added here if moduleStats exists

    // 5.5. Learning Outcomes & Tools Progress (new block for student)
    if (reportData.reportId && reportData.structure && reportData.submissions) {
      try {
        // Get unique module IDs from structure data
        const moduleIds: number[] = Array.from(new Set(
          (reportData.structure || [])
            .filter((s: any) => s.module_id)
            .map((s: any) => Number(s.module_id))
        ));

        // Get module names from Cogniterra API
        const moduleNamesMap = await getModuleNamesMapByIdsWithRetry(moduleIds, 'student shared report');

        // Process module analytics for this student
        const userId = reportData.userId || reportData.user_id;
        if (userId) {
          const stats = processModuleAnalytics(
            String(userId),
            reportData.submissions || [],
            reportData.structure || [],
            moduleNamesMap,
            reportData.meetings || []
          );

          // Use pre-fetched outcomes/tools if available, otherwise fetch
          let outcomesData, toolsData;
          
          if (reportData.learningOutcomes && reportData.moduleTools) {
            // Use pre-fetched data (passed from API route with proper auth)
            outcomesData = { learningOutcomes: reportData.learningOutcomes };
            toolsData = { moduleTools: reportData.moduleTools };
          } else {
            // Fallback: fetch (may fail with 401 if called from server without auth)
            const [outcomesResponse, toolsResponse] = await Promise.all([
              fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/learning-outcomes?reportId=${reportData.reportId}`),
              fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/module-tools?reportId=${reportData.reportId}`),
            ]);

            outcomesData = outcomesResponse.ok ? await outcomesResponse.json() : { learningOutcomes: [] };
            toolsData = toolsResponse.ok ? await toolsResponse.json() : { moduleTools: [] };
          }

          // Create maps for quick lookup (use both number and string keys for compatibility)
          const outcomesMap = new Map();
          (outcomesData.learningOutcomes || []).forEach((lo: any) => {
            outcomesMap.set(lo.module_id, { outcomes: lo.outcomes, title: lo.module_title });
            outcomesMap.set(String(lo.module_id), { outcomes: lo.outcomes, title: lo.module_title });
            outcomesMap.set(Number(lo.module_id), { outcomes: lo.outcomes, title: lo.module_title });
          });
          
          const toolsMap = new Map();
          (toolsData.moduleTools || []).forEach((mt: any) => {
            toolsMap.set(mt.module_id, mt.tools);
            toolsMap.set(String(mt.module_id), mt.tools);
            toolsMap.set(Number(mt.module_id), mt.tools);
          });

          // Build data array with student's module progress and outcomes/tools
          // Show ALL modules (same as StudentLearningProgress), not just those with outcomes/tools
          const learningProgressData = stats.map((m: any) => {
            const outcomes = outcomesMap.get(m.module_id);
            const tools = toolsMap.get(m.module_id);
            
            return {
              module_id: m.module_id,
              module_name: m.module_name,
              module_position: m.module_position,
              completion_rate: m.completion_rate,
              success_rate: m.success_rate,
              learning_outcomes: outcomes?.outcomes || '',
              tools: tools || '',
            };
          });

          if (learningProgressData.length > 0) {
            blocks.push({
              id: 'learning-outcomes-progress',
              type: 'learning-outcomes',
              title: 'Your Learning Outcomes & Tools Progress',
              content: '', // Not used for this block type
              data: learningProgressData,
              config: {
                viewType: 'student', // Indicates this is for student view
              },
              helpText: '<p>Track how you\'re progressing toward mastering the learning outcomes and tools for each module.</p><p><strong>Progress indicators:</strong> Green (≥75% completion) = Excellent!, Orange (50-74%) = Good progress, Red (<50%) = Keep going!</p>',
              order: order++,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch learning outcomes/tools for student report:', error);
        // Continue without the block if fetch fails
      }
    }

    // 6. Skills Development
    blocks.push({
      id: 'skills-development',
      type: 'section',
      title: 'Your Skills Development',
      content: content.skillsDevelopment || '',
      order: order++,
    });

    // 7. Topic Performance table
    if (reportData.submissionsAnalysis?.topicPerformance) {
      blocks.push({
        id: 'topic-performance',
        type: 'table',
        title: 'Performance by Topic',
        content: '',
        data: reportData.submissionsAnalysis.topicPerformance.map((t: any) => ({
          topic: t.topic,
          lesson_id: t.lesson_id,
          attempts: t.attempts,
          success_rate: `${(t.correctRate * 100).toFixed(1)}%`,
          steps: t.uniqueSteps,
        })),
        config: {
          columns: ['topic', 'attempts', 'success_rate', 'steps'],
        },
        helpText: '<p>See how you did in each part of the course.</p><p><strong>What the columns show:</strong></p><ul><li><strong>Topic</strong> - The course section or module (click to view on Cogniterra)</li><li><strong>Attempts</strong> - How many times you tried exercises in this topic</li><li><strong>Success Rate</strong> - How often you got things right</li><li><strong>Steps</strong> - How many exercises you tried</li></ul><p><strong>Quick interpretation:</strong></p><ul><li><strong>High success + few attempts</strong> = You found this easy ✓</li><li><strong>Low success or many attempts</strong> = This was challenging</li><li><strong>Low success rate</strong> = Might be worth reviewing</li></ul>',
        order: order++,
      });
    }

    // 8. Instructor Feedback
    blocks.push({
      id: 'instructor-feedback',
      type: 'section',
      title: 'Feedback from Your Instructors',
      content: content.instructorFeedback || '',
      order: order++,
    });

    // 8.5. Student Project Comment
    if (reportData.feedback?.project_comment) {
      blocks.push({
        id: 'student-project-comment',
        type: 'student-project-comment',
        title: 'Project Work Comments',
        content: reportData.feedback.project_comment,
        order: order++,
      });
    }

    // 9. Program Expert Feedback
    if (reportData.feedback?.comment_program_expert) {
      blocks.push({
        id: 'program-expert-comments',
        type: 'comments',
        title: 'Program Expert Feedback',
        content: reportData.feedback.comment_program_expert,
        order: order++,
      });
    }
    
    // 10. Teaching Assistants Feedback
    if (reportData.feedback?.comment_teaching_assistants) {
      blocks.push({
        id: 'teaching-assistants-comments',
        type: 'comments',
        title: 'Teaching Assistants Feedback',
        content: reportData.feedback.comment_teaching_assistants,
        order: order++,
      });
    }
    
    // 11. Learning Support Feedback
    if (reportData.feedback?.comment_learning_support) {
      blocks.push({
        id: 'learning-support-comments',
        type: 'comments',
        title: 'Learning Support Feedback',
        content: reportData.feedback.comment_learning_support,
        order: order++,
      });
    }

    // 12. Growth Opportunities
    blocks.push({
      id: 'growth-opportunities',
      type: 'section',
      title: 'Opportunities for Growth',
      content: content.growthOpportunities || '',
      order: order++,
    });

    // 13. Next Steps
    blocks.push({
      id: 'next-steps',
      type: 'section',
      title: 'Next Steps & Recommendations',
      content: content.nextSteps || '',
      order: order++,
    });

    // 14. Certificate Link (last block)
    if (reportData.certificateUrl) {
      blocks.push({
        id: 'certificate-link',
        type: 'certificate',
        title: 'Certificate',
        content: reportData.certificateUrl,
        order: order++,
      });
    }
  }

  return blocks;
}