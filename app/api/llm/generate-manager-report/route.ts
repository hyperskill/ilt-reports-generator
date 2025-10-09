import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getModuleStructureData, getGroupModuleAnalytics } from '@/lib/utils/llm-data-helpers';

const openai = new OpenAI({
  apiKey: process.env.LITELLM_API_KEY,
  baseURL: process.env.LITELLM_BASE_URL,
});

// Helper function to get unique count
function getUniqueCount(data: any[], field: string): number {
  const unique = new Set(data.map(item => item[field]).filter(Boolean));
  return unique.size;
}

// Helper function to get topic distribution from submissions
function getTopicDistribution(submissions: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const sub of submissions) {
    const stepId = String(sub.step_id || sub.stepid || sub.step || '').trim();
    if (stepId) {
      const stepNum = parseInt(stepId.replace(/\D/g, '')) || 0;
      const topicIndex = Math.floor(stepNum / 10);
      const topicKey = `Topic ${topicIndex + 1}`;
      distribution[topicKey] = (distribution[topicKey] || 0) + 1;
    }
  }
  return distribution;
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
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'Missing reportId' }, { status: 400 });
    }

    // Fetch report data
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Fetch team comments
    const { data: teamComments } = await supabase
      .from('reports')
      .select('comment_program_expert, comment_teaching_assistants, comment_learning_support')
      .eq('id', reportId)
      .single();

    // Fetch student comments
    const { data: studentComments } = await supabase
      .from('student_comments')
      .select('*')
      .eq('report_id', reportId);

    // Get module structure data (module names and topics)
    let moduleStructure = null;
    let groupModuleAnalytics = null;
    
    if (report.structure_data && report.structure_data.length > 0) {
      try {
        moduleStructure = await getModuleStructureData(report.structure_data);
        
        // Get group average module analytics
        if (report.performance_data && report.submissions_data) {
          groupModuleAnalytics = await getGroupModuleAnalytics(
            report.performance_data,
            report.submissions_data,
            report.structure_data,
            report.meetings_data
          );
        }
      } catch (error) {
        console.error('Failed to fetch module data:', error);
      }
    }

    // Prepare data for LLM
    const promptData = {
      reportTitle: report.title,
      reportDescription: report.description,
      totalStudents: report.performance_data?.length || 0,
      teamComments: {
        programExpert: teamComments?.comment_program_expert,
        teachingAssistants: teamComments?.comment_teaching_assistants,
        learningSupport: teamComments?.comment_learning_support,
      },
      performanceData: report.performance_data,
      dynamicData: report.dynamic_data,
      studentFeedback: studentComments,
      // Add raw data for deeper analysis
      submissionsStats: report.submissions_data ? {
        totalSubmissions: report.submissions_data.length,
        sampleSize: Math.min(100, report.submissions_data.length),
        // Only send aggregated stats, not all raw data
        topicDistribution: getTopicDistribution(report.submissions_data),
      } : null,
      courseStructure: report.structure_data ? {
        totalTopics: getUniqueCount(report.structure_data, 'lesson_id'),
        totalSteps: getUniqueCount(report.structure_data, 'step_id'),
      } : null,
      // NEW: Module structure with names and topics
      moduleStructure,
      // NEW: Group average module analytics
      groupModuleAnalytics,
    };

    const systemPrompt = `You are an expert Learning Experience Designer creating a comprehensive group activity report for program managers.

Your task is to analyze the provided data about a cohort of learners and create a professional, insightful report that helps managers understand:
- Overall group performance and engagement
- Team dynamics and collaboration patterns
- Project outcomes and practical applications
- Areas of strength and opportunities for improvement
- Module-specific performance patterns and challenges

You have access to detailed module analytics including:
- Module names and associated topics/lessons
- Group average performance metrics per module (completion rates, success rates, attempts per step)
- Meeting attendance patterns correlated with module activity
- Individual student performance within each module

Use this module-level data to provide specific, actionable insights about which parts of the course are working well and which need attention.

Use a friendly, approachable tone while maintaining professionalism. Explain technical metrics in simple terms that non-technical managers can understand.

Structure your report with these sections:

**Executive Summary**
(2-3 paragraphs)
Provide a high-level overview of the cohort's performance, key achievements, and main observations. This should give managers the essential information at a glance.

**Group Dynamics & Engagement**
(2-3 paragraphs)
Analyze how students worked together, their activity patterns, consistency, and overall engagement levels. Comment on team cohesion and collaboration quality.

**Learning Outcomes & Projects**
(2-3 paragraphs)
Evaluate the quality of student work, project completion rates, practical applicability of their outputs, and technical skill development. Highlight standout projects or achievements.

**Expert Observations**
(2-3 paragraphs)
Synthesize insights from program experts, teaching assistants, and learning support team. Include specific observations about what worked well and what challenges were encountered.

**Opportunities & Recommendations**
(2-3 paragraphs)
Identify gaps, areas for improvement, and specific recommendations for future cohorts. Be constructive and actionable.

Format your response as JSON with this structure:
{
  "executiveSummary": "string",
  "groupDynamics": "string",
  "learningOutcomes": "string",
  "expertObservations": "string",
  "opportunities": "string"
}`;

    const userPrompt = `Generate a manager report for: "${report.title}"

Data:
${JSON.stringify(promptData, null, 2)}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const generatedContent = JSON.parse(completion.choices[0].message.content || '{}');

    // Save to database
    const { data: savedReport, error: saveError } = await supabase
      .from('manager_reports')
      .upsert({
        report_id: reportId,
        generated_content: generatedContent,
        created_by: user.id,
      }, {
        onConflict: 'report_id'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save manager report:', saveError);
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      report: savedReport,
      content: generatedContent 
    });

  } catch (error: any) {
    console.error('Error generating manager report:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate report' 
    }, { status: 500 });
  }
}

