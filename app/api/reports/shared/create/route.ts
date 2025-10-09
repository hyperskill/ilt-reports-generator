import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ReportBlock } from '@/lib/types';

// Helper to convert LLM report content to blocks
function convertToBlocks(
  content: any, 
  reportType: 'manager' | 'student',
  reportData: any
): ReportBlock[] {
  const blocks: ReportBlock[] = [];
  let order = 0;

  if (reportType === 'manager') {
    // LLM-generated sections
    blocks.push({
      id: 'executive-summary',
      type: 'section',
      title: 'Executive Summary',
      content: content.executiveSummary || '',
      order: order++,
    });

    // === SEGMENTATION ANALYSIS ===
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
        helpText: '<p>This chart shows how your students are grouped based on their performance and engagement.</p><p><strong>What the colors mean:</strong></p><ul><li><strong>Leader engaged</strong> - Students doing great and participating actively</li><li><strong>Leader efficient</strong> - Top performers who work smart</li><li><strong>Balanced + engaged</strong> - Doing well and staying involved</li><li><strong>Balanced middle</strong> - Average performance</li><li><strong>Hardworking but struggling</strong> - Putting in effort but finding it challenging</li><li><strong>Low engagement</strong> - Students who need encouragement to participate</li></ul>',
        order: order++,
      });

      // Segment statistics table
      const segmentTableData = Object.entries(segmentStats).map(([segment, stats]) => ({
        segment,
        student_count: stats.count,
        percentage: `${((stats.count / reportData.performanceData.length) * 100).toFixed(1)}%`,
        avg_completion: `${stats.avgScore.toFixed(1)}%`,
      })).sort((a, b) => b.student_count - a.student_count);

      blocks.push({
        id: 'segment-statistics',
        type: 'table',
        title: 'Segmentation Statistics',
        content: '',
        data: segmentTableData,
        config: {
          columns: ['segment', 'student_count', 'percentage', 'avg_completion'],
        },
        helpText: '<p>This table breaks down each student group in detail.</p><p><strong>What each column shows:</strong></p><ul><li><strong>Segment</strong> - The group name</li><li><strong>Student Count</strong> - How many students are in this group</li><li><strong>Percentage</strong> - What portion of your class this represents</li><li><strong>Avg Completion</strong> - How much of the course these students completed on average</li></ul>',
        order: order++,
      });
    }

    blocks.push({
      id: 'group-dynamics',
      type: 'section',
      title: 'Group Dynamics & Engagement',
      content: content.groupDynamics || '',
      order: order++,
    });

    // === DYNAMIC/EASING ANALYSIS ===
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

    // All students performance table
    if (reportData.performanceData && reportData.performanceData.length > 0) {
      const allStudents = [...reportData.performanceData]
        .sort((a: any, b: any) => b.total_pct - a.total_pct)
        .map((s: any) => ({
          name: s.name,
          completion: `${s.total_pct.toFixed(1)}%`,
          success_rate: `${(s.success_rate * 100).toFixed(1)}%`,
          active_days: s.active_days || 0,
          meetings: `${s.meetings_attended || 0}/${s.meetings_attended_pct?.toFixed(0) || 0}%`,
          segment: s.simple_segment,
        }));

      blocks.push({
        id: 'all-students-performance',
        type: 'table',
        title: 'Student Performance Overview',
        content: '',
        data: allStudents,
        config: {
          columns: ['name', 'completion', 'success_rate', 'active_days', 'meetings', 'segment'],
        },
        helpText: '<p>A complete list of all your students with their key performance indicators.</p><p><strong>What you\'re seeing:</strong></p><ul><li><strong>Name</strong> - Student name</li><li><strong>Completion</strong> - How much of the course they finished</li><li><strong>Success Rate</strong> - How often they got things right</li><li><strong>Active Days</strong> - How many days they participated</li><li><strong>Meetings</strong> - Sessions they attended</li><li><strong>Segment</strong> - Which performance group they\'re in</li></ul>',
        order: order++,
      });
    }

    blocks.push(
      {
        id: 'learning-outcomes',
        type: 'section',
        title: 'Learning Outcomes & Projects',
        content: content.learningOutcomes || '',
        order: order++,
      },
      {
        id: 'expert-observations',
        type: 'section',
        title: 'Expert Observations',
        content: content.expertObservations || '',
        order: order++,
      }
    );

    // Team Comments after Expert Observations
    const teamComments = reportData.teamComments;
    
    if (teamComments?.programExpert) {
      blocks.push({
        id: 'program-expert-comments',
        type: 'comments',
        title: 'Program Expert Feedback',
        content: teamComments.programExpert,
        order: order++,
      });
    }
    
    if (teamComments?.teachingAssistants) {
      blocks.push({
        id: 'teaching-assistants-comments',
        type: 'comments',
        title: 'Teaching Assistants Feedback',
        content: teamComments.teachingAssistants,
        order: order++,
      });
    }
    
    if (teamComments?.learningSupport) {
      blocks.push({
        id: 'learning-support-comments',
        type: 'comments',
        title: 'Learning Support Feedback',
        content: teamComments.learningSupport,
        order: order++,
      });
    }

    blocks.push({
      id: 'opportunities',
      type: 'section',
      title: 'Opportunities & Recommendations',
      content: content.opportunities || '',
      order: order++,
    });
  } else {
    // Student report
    const studentData = reportData.performance;
    const dynamicData = reportData.dynamics;

    blocks.push(
      {
        id: 'learning-journey',
        type: 'section',
        title: 'Your Learning Journey',
        content: content.learningJourney || '',
        order: order++,
      },
      {
        id: 'strengths-achievements',
        type: 'section',
        title: 'Your Strengths & Achievements',
        content: content.strengthsAchievements || '',
        order: order++,
      }
    );

    // Performance metrics table - single row with all key indicators
    if (studentData) {
      const metricsRow = [{
        completion: `${studentData.total_pct?.toFixed(1) || 0}%`,
        success_rate: `${((studentData.success_rate || 0) * 100).toFixed(1)}%`,
        submissions: studentData.submissions || 0,
        correct_submissions: studentData.correct_submissions || 0,
        active_days: studentData.active_days || 0,
        active_days_ratio: `${((studentData.active_days_ratio || 0) * 100).toFixed(1)}%`,
        meetings: `${studentData.meetings_attended || 0} (${studentData.meetings_attended_pct?.toFixed(1) || 0}%)`,
        segment: studentData.simple_segment || 'N/A',
      }];

      blocks.push({
        id: 'performance-metrics',
        type: 'table',
        title: 'Your Performance Overview',
        content: '',
        data: metricsRow,
        config: {
          columns: ['completion', 'success_rate', 'submissions', 'correct_submissions', 'active_days', 'active_days_ratio', 'meetings', 'segment'],
        },
        helpText: '<p>Here\'s a quick snapshot of how you did in the course!</p><p><strong>What these numbers mean:</strong></p><ul><li><strong>Completion</strong> - How much of the course you finished</li><li><strong>Success Rate</strong> - How often you got things right on the first try</li><li><strong>Submissions</strong> - Total times you tried exercises</li><li><strong>Correct Submissions</strong> - Times you got it right</li><li><strong>Active Days</strong> - Days you worked on the course</li><li><strong>Active Days Ratio</strong> - How regularly you participated</li><li><strong>Meetings</strong> - Sessions you joined</li><li><strong>Segment</strong> - Your overall performance category</li></ul>',
        order: order++,
      });
    }

    // Activity dynamics table - single row with dynamic metrics
    if (dynamicData) {
      const dynamicsRow = [{
        easing_pattern: dynamicData.easing_label || 'N/A',
        frontload_index: (dynamicData.frontload_index || 0).toFixed(3),
        t25: `${((dynamicData.t25 || 0) * 100).toFixed(0)}%`,
        t50: `${((dynamicData.t50 || 0) * 100).toFixed(0)}%`,
        t75: `${((dynamicData.t75 || 0) * 100).toFixed(0)}%`,
        consistency: (dynamicData.consistency || 0).toFixed(3),
        burstiness: (dynamicData.burstiness || 0).toFixed(3),
      }];

      blocks.push({
        id: 'activity-dynamics',
        type: 'table',
        title: 'Your Activity Pattern Metrics',
        content: '',
        data: dynamicsRow,
        config: {
          columns: ['easing_pattern', 'frontload_index', 't25', 't50', 't75', 'consistency', 'burstiness'],
        },
        helpText: '<p>This shows <em>how</em> you approached your work throughout the course.</p><p><strong>Understanding your work style:</strong></p><ul><li><strong>Easing Pattern</strong> - Your overall pace (did you start strong or finish strong?)</li><li><strong>Frontload Index</strong> - Did you start early or wait?<ul><li>Positive = You started early ✓</li><li>Negative = You left it late</li></ul></li><li><strong>T25/T50/T75</strong> - When you hit 25%, 50%, and 75% done</li><li><strong>Consistency</strong> - How regular you were (higher is better)</li><li><strong>Burstiness</strong> - How much your activity varied day-to-day</li></ul>',
        order: order++,
      });
    }

    // Activity curve chart
    if (reportData.activityTimeline && reportData.activityTimeline.length > 0) {
      blocks.push({
        id: 'activity-curve',
        type: 'line-chart',
        title: 'Your Activity Pattern Over Time',
        content: '',
        data: reportData.activityTimeline,
        config: {
          chartType: 'line',
          xField: 'x_norm',
          yField: 'y_norm',
          showLegend: false,
        },
        helpText: '<p>This line shows when you did your work during the course.</p><p><strong>How to read this chart:</strong></p><ul><li><strong>Bottom to top</strong> - Shows how you went from 0% to 100% done</li><li><strong>Left to right</strong> - Time from course start to finish</li></ul><p><strong>What the curve shape tells you:</strong></p><ul><li><strong>Curve going up fast at the start</strong> - You got ahead early (great job!)</li><li><strong>Curve going up fast at the end</strong> - You left most work to the end</li><li><strong>Straight diagonal line</strong> - You worked at a steady pace</li><li><strong>Flat spots</strong> - Times when you took breaks</li></ul>',
        order: order++,
      });
    }

    blocks.push(
      {
        id: 'skills-development',
        type: 'section',
        title: 'Your Skills Development',
        content: content.skillsDevelopment || '',
        order: order++,
      },
      {
        id: 'instructor-feedback',
        type: 'section',
        title: 'Feedback from Your Instructors',
        content: content.instructorFeedback || '',
        order: order++,
      }
    );

    // Student comments after Instructor Feedback
    const feedback = reportData.feedback;
    
    if (feedback?.comment_program_expert) {
      blocks.push({
        id: 'program-expert-comments',
        type: 'comments',
        title: 'Program Expert Feedback',
        content: feedback.comment_program_expert,
        order: order++,
      });
    }
    
    if (feedback?.comment_teaching_assistants) {
      blocks.push({
        id: 'teaching-assistants-comments',
        type: 'comments',
        title: 'Teaching Assistants Feedback',
        content: feedback.comment_teaching_assistants,
        order: order++,
      });
    }
    
    if (feedback?.comment_learning_support) {
      blocks.push({
        id: 'learning-support-comments',
        type: 'comments',
        title: 'Learning Support Feedback',
        content: feedback.comment_learning_support,
        order: order++,
      });
    }

    blocks.push(
      {
        id: 'growth-opportunities',
        type: 'section',
        title: 'Opportunities for Growth',
        content: content.growthOpportunities || '',
        order: order++,
      },
      {
        id: 'next-steps',
        type: 'section',
        title: 'Next Steps & Recommendations',
        content: content.nextSteps || '',
        order: order++,
      }
    );

    // Topic performance table (if available)
    if (reportData.submissionsAnalysis?.topicPerformance) {
      const topicData = reportData.submissionsAnalysis.topicPerformance.map((t: any) => {
        const data: any = {
          topic: t.topic,
          attempts: t.attempts,
          success_rate: `${(t.correctRate * 100).toFixed(1)}%`,
          steps: t.uniqueSteps,
        };
        
        // Include lesson_id for creating links
        if (t.lesson_id) {
          data.lesson_id = t.lesson_id;
        }
        
        return data;
      });

      blocks.push({
        id: 'topic-performance',
        type: 'table',
        title: 'Performance by Topic',
        content: '',
        data: topicData,
        config: {
          columns: ['topic', 'attempts', 'success_rate', 'steps'],
        },
        helpText: '<p>See how you did in each part of the course.</p><p><strong>What the columns show:</strong></p><ul><li><strong>Topic</strong> - The course section or module</li><li><strong>Attempts</strong> - How many times you tried exercises in this topic</li><li><strong>Success Rate</strong> - How often you got things right</li><li><strong>Steps</strong> - How many exercises you tried</li></ul><p><strong>Quick interpretation:</strong></p><ul><li><strong>High success + few attempts</strong> = You found this easy ✓</li><li><strong>Low success or many attempts</strong> = This was challenging</li><li><strong>Low success rate</strong> = Might be worth reviewing</li></ul>',
        order: order++,
      });
    }
  }

  return blocks;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { reportType, sourceReportId, userId, title, description } = body;

    if (!reportType || !sourceReportId || !title) {
      return NextResponse.json({ 
        error: 'Missing required fields: reportType, sourceReportId, title' 
      }, { status: 400 });
    }

    if (reportType !== 'manager' && reportType !== 'student') {
      return NextResponse.json({ 
        error: 'Invalid reportType. Must be "manager" or "student"' 
      }, { status: 400 });
    }

    if (reportType === 'student' && !userId) {
      return NextResponse.json({ 
        error: 'userId is required for student reports' 
      }, { status: 400 });
    }

    // Fetch the base report data
    const { data: baseReport, error: baseError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', sourceReportId)
      .single();

    if (baseError || !baseReport) {
      return NextResponse.json({ error: 'Base report not found' }, { status: 404 });
    }

    // Fetch the source LLM report and prepare data
    let sourceContent;
    let reportData: any = {};

    if (reportType === 'manager') {
      const { data, error } = await supabase
        .from('manager_reports')
        .select('edited_content, generated_content')
        .eq('report_id', sourceReportId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Source manager report not found' }, { status: 404 });
      }

      // Use edited content if available, otherwise generated
      sourceContent = data.edited_content || data.generated_content;

      // Fetch team comments
      const { data: teamComments } = await supabase
        .from('reports')
        .select('comment_program_expert, comment_teaching_assistants, comment_learning_support')
        .eq('id', sourceReportId)
        .single();

      reportData = {
        performanceData: baseReport.performance_data || [],
        dynamicData: baseReport.dynamic_data || [],
        teamComments: {
          programExpert: teamComments?.comment_program_expert,
          teachingAssistants: teamComments?.comment_teaching_assistants,
          learningSupport: teamComments?.comment_learning_support,
        },
      };
    } else {
      const { data, error } = await supabase
        .from('student_reports')
        .select('edited_content, generated_content')
        .eq('report_id', sourceReportId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Source student report not found' }, { status: 404 });
      }

      sourceContent = data.edited_content || data.generated_content;

      // Find student data
      const studentPerformance = baseReport.performance_data?.find((s: any) => s.user_id === userId);
      const studentDynamic = baseReport.dynamic_data?.find((s: any) => s.user_id === userId);
      const studentSeries = baseReport.dynamic_series?.filter((s: any) => s.user_id === userId);

      // Fetch student feedback
      const { data: studentFeedback } = await supabase
        .from('student_comments')
        .select('*')
        .eq('report_id', sourceReportId)
        .eq('user_id', userId)
        .single();

      // Get submissions analysis if available
      let submissionsAnalysis = null;
      if (baseReport.submissions_data) {
        const studentSubs = baseReport.submissions_data.filter((s: any) => 
          String(s.user_id || s.userid || '').toLowerCase() === userId.toLowerCase()
        );
        
        if (studentSubs.length > 0) {
          // Build structure map for linking topics to Cogniterra
          const structureMap: Record<string, { lesson_id?: number; unit_id?: number; course_id?: number }> = {};
          if (baseReport.structure_data && Array.isArray(baseReport.structure_data)) {
            for (const item of baseReport.structure_data) {
              const stepId = String(item.step_id || '').trim();
              if (stepId) {
                structureMap[stepId] = {
                  lesson_id: item.lesson_id,
                  unit_id: item.unit_id,
                  course_id: item.course_id,
                };
              }
            }
          }

          const topicStats: Record<string, { 
            attempts: number; 
            correct: number; 
            steps: Set<string>;
            firstStepId?: string;
          }> = {};
          
          for (const sub of studentSubs) {
            const stepId = String(sub.step_id || sub.stepid || sub.step || '').trim();
            if (stepId) {
              const stepNum = parseInt(stepId.replace(/\D/g, '')) || 0;
              const topicIndex = Math.floor(stepNum / 10);
              const topicKey = `Topic ${topicIndex + 1}`;
              
              if (!topicStats[topicKey]) {
                topicStats[topicKey] = { 
                  attempts: 0, 
                  correct: 0, 
                  steps: new Set(),
                  firstStepId: stepId, // Store first step ID for linking
                };
              }
              
              topicStats[topicKey].attempts += 1;
              topicStats[topicKey].steps.add(stepId);
              if (String(sub.status || '').toLowerCase() === 'correct') {
                topicStats[topicKey].correct += 1;
              }
            }
          }
          
          const topicArray = Object.entries(topicStats).map(([topic, stats]) => {
            const topicData: any = {
              topic,
              attempts: stats.attempts,
              correctRate: stats.correct / stats.attempts,
              uniqueSteps: stats.steps.size,
            };

            // Add lesson_id if available from structure
            if (stats.firstStepId && structureMap[stats.firstStepId]) {
              topicData.lesson_id = structureMap[stats.firstStepId].lesson_id;
              topicData.unit_id = structureMap[stats.firstStepId].unit_id;
              topicData.course_id = structureMap[stats.firstStepId].course_id;
            }

            return topicData;
          });
          
          submissionsAnalysis = {
            topicPerformance: topicArray,
          };
        }
      }

      reportData = {
        performance: studentPerformance,
        dynamics: studentDynamic,
        activityTimeline: studentSeries,
        feedback: studentFeedback,
        submissionsAnalysis,
      };
    }

    // Convert content to blocks
    const blocks = convertToBlocks(sourceContent, reportType, reportData);

    // Create shared report
    const { data: sharedReport, error: createError } = await supabase
      .from('shared_reports')
      .insert({
        report_type: reportType,
        source_report_id: sourceReportId,
        user_id: userId || null,
        title,
        description: description || null,
        blocks,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create shared report:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      sharedReport 
    });

  } catch (error: any) {
    console.error('Error creating shared report:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create shared report' 
    }, { status: 500 });
  }
}
