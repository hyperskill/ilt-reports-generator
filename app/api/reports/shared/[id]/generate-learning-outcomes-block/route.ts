import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { convertToBlocks } from '@/lib/utils/convert-blocks';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check if current user is admin or creator
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    // Fetch the shared report
    const { data: sharedReport } = await supabase
      .from('shared_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (!sharedReport) {
      return NextResponse.json({ error: 'Shared report not found' }, { status: 404 });
    }

    const isCreator = sharedReport.created_by === user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Forbidden: You can only edit your own reports' }, { status: 403 });
    }

    const reportType = sharedReport.report_type;
    const sourceReportId = sharedReport.source_report_id;
    const userId = sharedReport.user_id;

    // Check if learning-outcomes block already exists
    const existingBlocks = sharedReport.blocks || [];
    const hasLearningOutcomes = existingBlocks.some((b: any) => b.type === 'learning-outcomes');
    
    if (hasLearningOutcomes) {
      return NextResponse.json({ 
        error: 'Learning Outcomes block already exists in this report' 
      }, { status: 400 });
    }

    // Fetch base report data
    const { data: baseReport } = await supabase
      .from('reports')
      .select('*')
      .eq('id', sourceReportId)
      .single();

    if (!baseReport) {
      return NextResponse.json({ error: 'Source report not found' }, { status: 404 });
    }

    // Fetch learning outcomes and tools here (with proper auth headers)
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

    // Check if learning outcomes exist
    if (!outcomesData.learningOutcomes || outcomesData.learningOutcomes.length === 0) {
      return NextResponse.json({ 
        error: 'No learning outcomes data found for this report. Please add them in the Settings page first.' 
      }, { status: 400 });
    }

    // Prepare data based on report type (same as create route)
    let sourceContent;
    let processedData: any = {};

    if (reportType === 'manager') {
      // Fetch manager report content
      const { data: managerReport } = await supabase
        .from('manager_reports')
        .select('edited_content, generated_content')
        .eq('report_id', sourceReportId)
        .single();

      sourceContent = managerReport?.edited_content || managerReport?.generated_content;

      processedData = {
        performanceData: baseReport.performance_data || [],
        dynamicData: baseReport.dynamic_data || [],
        structure: baseReport.structure_data || [],
        submissions: baseReport.submissions_data || [],
        meetings: baseReport.meetings_data || [],
        reportId: sourceReportId,
        // Pass pre-fetched outcomes and tools to avoid 401 in convert-blocks
        learningOutcomes: outcomesData.learningOutcomes || [],
        moduleTools: toolsData.moduleTools || [],
      };

      if (!processedData.performanceData || processedData.performanceData.length === 0) {
        return NextResponse.json({ 
          error: 'This report does not have student performance data' 
        }, { status: 400 });
      }
    } else if (reportType === 'student' && userId) {
      // Fetch student report content
      const { data: studentReport } = await supabase
        .from('student_reports')
        .select('edited_content, generated_content')
        .eq('report_id', sourceReportId)
        .eq('user_id', userId)
        .single();

      sourceContent = studentReport?.edited_content || studentReport?.generated_content;

      processedData = {
        structure: baseReport.structure_data || [],
        submissions: baseReport.submissions_data || [],
        meetings: baseReport.meetings_data || [],
        userId,
        reportId: sourceReportId,
        // Pass pre-fetched outcomes and tools to avoid 401 in convert-blocks
        learningOutcomes: outcomesData.learningOutcomes || [],
        moduleTools: toolsData.moduleTools || [],
      };
    }

    // Generate all blocks using convertToBlocks (server-side, with proper API access)
    let allBlocks;
    try {
      allBlocks = await convertToBlocks(sourceContent || {}, reportType, processedData);
    } catch (conversionError: any) {
      console.error('Error in convertToBlocks:', conversionError);
      return NextResponse.json({ 
        error: `Failed to convert blocks: ${conversionError.message}` 
      }, { status: 500 });
    }

    // Find the learning-outcomes block
    const learningOutcomesBlock = allBlocks.find(b => b.type === 'learning-outcomes');

    if (!learningOutcomesBlock) {
      return NextResponse.json({ 
        error: 'Learning Outcomes block was not created. This usually happens when no modules have been completed by students.' 
      }, { status: 400 });
    }

    // Return the generated block
    return NextResponse.json({ 
      success: true,
      block: learningOutcomesBlock
    });

  } catch (error: any) {
    console.error('Error generating learning outcomes block:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate learning outcomes block' 
    }, { status: 500 });
  }
}

