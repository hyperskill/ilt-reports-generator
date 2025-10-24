import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ReportBlock } from '@/lib/types';
import { processModuleAnalytics } from '@/lib/processors/module-analytics';
import { getModuleNamesMapByIdsWithRetry, getLessonNamesMapByIdsWithRetry } from '@/lib/utils/cogniterra-api-wrapper';
import { convertToBlocks } from '@/lib/utils/convert-blocks';

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
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

    // Initialize variables
    let sourceContent;
    let processedData: any = {};

    // Fetch learning outcomes and module tools (with proper auth)
    const [outcomesResponse, toolsResponse] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/learning-outcomes?reportId=${sourceReportId}`,
        { headers: request.headers }
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/module-tools?reportId=${sourceReportId}`,
        { headers: request.headers }
      ),
    ]);

    const outcomesData = outcomesResponse.ok ? await outcomesResponse.json() : { learningOutcomes: [] };
    const toolsData = toolsResponse.ok ? await toolsResponse.json() : { moduleTools: [] };

    // Fetch report data based on type
    try {
      if (reportType === 'manager') {
        const [reportResult, commentsResult] = await Promise.all([
          supabase
            .from('manager_reports')
            .select('edited_content, generated_content')
            .eq('report_id', sourceReportId)
            .single(),
          supabase
            .from('reports')
            .select('comment_program_expert, comment_teaching_assistants, comment_learning_support')
            .eq('id', sourceReportId)
            .single()
        ]);

        if (reportResult.error || !reportResult.data) {
          throw new Error('Source manager report not found');
        }

        sourceContent = reportResult.data.edited_content || reportResult.data.generated_content;

        // Fetch team comments
        const { data: teamComments } = await supabase
          .from('reports')
          .select('comment_program_expert, comment_teaching_assistants, comment_learning_support')
          .eq('id', sourceReportId)
          .single();

        processedData = {
          performanceData: baseReport.performance_data || [],
          dynamicData: baseReport.dynamic_data || [],
          structure: baseReport.structure_data || [],
          submissions: baseReport.submissions_data || [],
          meetings: baseReport.meetings_data || [],
          reportId: sourceReportId,
          learningOutcomes: outcomesData.learningOutcomes || [],
          moduleTools: toolsData.moduleTools || [],
          teamComments: {
            programExpert: teamComments?.comment_program_expert,
            teachingAssistants: teamComments?.comment_teaching_assistants,
            learningSupport: teamComments?.comment_learning_support,
          },
        };
      } else {
        const [reportResult, commentsResult] = await Promise.all([
          supabase
            .from('student_reports')
            .select('edited_content, generated_content')
            .eq('report_id', sourceReportId)
            .eq('user_id', userId)
            .single(),
          supabase
            .from('student_comments')
            .select('*')
            .eq('report_id', sourceReportId)
            .eq('user_id', userId)
            .single()
        ]);

        if (reportResult.error || !reportResult.data) {
          throw new Error('Source student report not found');
        }

        sourceContent = reportResult.data.edited_content || reportResult.data.generated_content;

        // Find student data
        const studentPerformance = baseReport.performance_data?.find(
          (s: any) => s.user_id === userId
        );
        const studentDynamic = baseReport.dynamic_data?.find(
          (s: any) => s.user_id === userId
        );
        const studentSeries = baseReport.dynamic_series?.filter(
          (s: any) => s.user_id === userId
        );

        // Fetch student feedback
        const { data: studentFeedback } = await supabase
          .from('student_comments')
          .select('project_comment, comment_program_expert, comment_teaching_assistants, comment_learning_support')
          .eq('report_id', sourceReportId)
          .eq('user_id', userId)
          .single();

        // Fetch student certificate
        const { data: certificate } = await supabase
          .from('student_certificates')
          .select('certificate_url')
          .eq('report_id', sourceReportId)
          .eq('user_id', userId)
          .single();

        processedData = {
          performance: studentPerformance,
          dynamics: studentDynamic,
          activityTimeline: studentSeries,
          feedback: {
            ...studentFeedback,
            project_comment: studentFeedback?.project_comment || null,
          },
          certificateUrl: certificate?.certificate_url || null,
          structure: baseReport.structure_data || [],
          submissions: baseReport.submissions_data || [],
          meetings: baseReport.meetings_data || [],
          userId,
          reportId: sourceReportId,
          learningOutcomes: outcomesData.learningOutcomes || [],
          moduleTools: toolsData.moduleTools || [],
        };

        // Process submissions analysis if available
        if (baseReport.submissions_data) {
          await processSubmissionsAnalysis(baseReport, userId, processedData);
        }
      }

      // Convert content to blocks
      const blocks = await convertToBlocks(sourceContent, reportType, processedData);

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
        throw new Error(createError.message);
      }

      return NextResponse.json({ success: true, sharedReport });

    } catch (error: any) {
      console.error('Error creating shared report:', error);
      return NextResponse.json({ 
        error: error.message || 'Failed to create shared report' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

async function processSubmissionsAnalysis(baseReport: any, userId: string, processedData: any) {
  const studentSubs = baseReport.submissions_data.filter((s: any) => 
    String(s.user_id || s.userid || '').toLowerCase() === userId.toLowerCase()
  );
  
  if (studentSubs.length > 0) {
    try {
      // Build structure map for linking steps to lessons
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

      // Group by lesson_id (real topics)
      const topicStats: Record<number, { 
        lessonId: number;
        attempts: number; 
        correct: number; 
        steps: Set<string>;
        unitId?: number;
        courseId?: number;
      }> = {};
      
      for (const sub of studentSubs) {
        const stepId = String(sub.step_id || sub.stepid || sub.step || '').trim();
        if (stepId && structureMap[stepId]?.lesson_id) {
          const lessonId = structureMap[stepId].lesson_id!;
          
          if (!topicStats[lessonId]) {
            topicStats[lessonId] = { 
              lessonId,
              attempts: 0, 
              correct: 0, 
              steps: new Set(),
              unitId: structureMap[stepId].unit_id,
              courseId: structureMap[stepId].course_id,
            };
          }
          
          topicStats[lessonId].attempts += 1;
          topicStats[lessonId].steps.add(stepId);
          if (String(sub.status || '').toLowerCase() === 'correct') {
            topicStats[lessonId].correct += 1;
          }
        }
      }
      
      // Fetch lesson names and process topic stats
      const lessonIds = Object.keys(topicStats).map(id => parseInt(id, 10));
      if (lessonIds.length > 0) {
        const lessonNamesMap = await getLessonNamesMapByIdsWithRetry(lessonIds, 'student report');
        
        const topicArray = Object.values(topicStats).map((stats) => ({
          topic: lessonNamesMap[stats.lessonId] || `Topic ${stats.lessonId}`,
          attempts: stats.attempts,
          correctRate: stats.correct / stats.attempts,
          uniqueSteps: stats.steps.size,
          lesson_id: stats.lessonId,
          unit_id: stats.unitId,
          course_id: stats.courseId,
        }));

        processedData.submissionsAnalysis = {
          topicPerformance: topicArray,
        };
      }
    } catch (error) {
      console.error('Error processing submissions analysis:', error);
      // Continue without submissions analysis
    }
  }
}