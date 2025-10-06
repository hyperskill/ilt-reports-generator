import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.LITELLM_API_KEY,
  baseURL: process.env.LITELLM_BASE_URL,
});

// Helper function to get student submissions stats
function getStudentSubmissionsStats(submissions: any[], userId: string): any {
  const studentSubs = submissions.filter((s: any) => 
    String(s.user_id || s.userid || '').toLowerCase() === userId.toLowerCase()
  );
  
  const correctSubs = studentSubs.filter((s: any) => 
    String(s.status || s.result || '').toLowerCase() === 'correct'
  );
  
  const topicStats: Record<string, { attempts: number; correct: number; steps: Set<string> }> = {};
  
  for (const sub of studentSubs) {
    const stepId = String(sub.step_id || sub.stepid || sub.step || '').trim();
    if (stepId) {
      const stepNum = parseInt(stepId.replace(/\D/g, '')) || 0;
      const topicIndex = Math.floor(stepNum / 10);
      const topicKey = `Topic ${topicIndex + 1}`;
      
      if (!topicStats[topicKey]) {
        topicStats[topicKey] = { attempts: 0, correct: 0, steps: new Set() };
      }
      
      topicStats[topicKey].attempts += 1;
      topicStats[topicKey].steps.add(stepId);
      if (String(sub.status || '').toLowerCase() === 'correct') {
        topicStats[topicKey].correct += 1;
      }
    }
  }
  
  // Convert to array with success rates
  const topicArray = Object.entries(topicStats).map(([topic, stats]) => ({
    topic,
    attempts: stats.attempts,
    correctRate: stats.correct / stats.attempts,
    uniqueSteps: stats.steps.size,
  }));
  
  return {
    totalSubmissions: studentSubs.length,
    correctSubmissions: correctSubs.length,
    successRate: studentSubs.length > 0 ? correctSubs.length / studentSubs.length : 0,
    topicPerformance: topicArray,
  };
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
    const { reportId, userId } = body;

    if (!reportId || !userId) {
      return NextResponse.json({ error: 'Missing reportId or userId' }, { status: 400 });
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

    // Find student data
    const studentPerformance = report.performance_data?.find((s: any) => s.user_id === userId);
    const studentDynamic = report.dynamic_data?.find((s: any) => s.user_id === userId);
    const studentSeries = report.dynamic_series?.filter((s: any) => s.user_id === userId);

    if (!studentPerformance) {
      return NextResponse.json({ error: 'Student not found in report' }, { status: 404 });
    }

    // Fetch student feedback
    const { data: studentFeedback } = await supabase
      .from('student_comments')
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .single();

    // Get detailed submissions stats if available
    const submissionsAnalysis = report.submissions_data 
      ? getStudentSubmissionsStats(report.submissions_data, userId)
      : null;

    // Prepare data for LLM
    const promptData = {
      studentName: studentPerformance.name,
      performance: studentPerformance,
      dynamics: studentDynamic,
      activityTimeline: studentSeries,
      feedback: studentFeedback,
      // Add detailed topic-level insights
      submissionsAnalysis,
    };

    const systemPrompt = `You are an expert Learning Coach creating a personalized learning report for an individual student.

Your task is to analyze the provided data and create an encouraging, constructive report that helps the student understand their progress and identify areas for growth.

Use a warm, supportive tone that motivates the student while being honest about areas needing improvement. Speak directly to the student using their name and "you/your" language.

The data includes:
- Overall performance metrics (grades, submissions, success rates)
- Activity patterns over time (consistency, effort, engagement)
- Topic-level performance (if submissionsAnalysis is provided, use it to identify strong and weak topics)
- Instructor feedback and observations

If submissionsAnalysis is provided, pay special attention to:
- Topics where the student has high success rates (strengths to celebrate)
- Topics where the student has low success rates (areas needing attention)
- Patterns across topics (consistent performer vs. variable performance)

Structure your report with these sections:

**Your Learning Journey**
(2-3 paragraphs)
Celebrate the student's participation and commitment. Highlight their unique approach to learning, activity patterns, and overall engagement throughout the program.

**Your Strengths & Achievements**
(2-3 paragraphs)
Identify specific areas where the student excelled. Mention successful projects, strong technical skills, good collaboration, consistent effort, or creative problem-solving. Be specific and genuine.

**Your Skills Development**
(2-3 paragraphs)
Analyze the student's technical progress, learning pace, and skill acquisition. Comment on their problem-solving approach, persistence when facing challenges, and efficiency in completing tasks.

**Feedback from Your Instructors**
(2-3 paragraphs)
Share insights and observations from program experts, teaching assistants, and learning support (if available). Present this feedback in a constructive, encouraging way.

**Opportunities for Growth**
(2-3 paragraphs)
Identify 2-4 specific areas where the student can improve. Frame these as opportunities rather than criticisms. Include concrete suggestions for how they can develop these skills further.

**Next Steps & Recommendations**
(2-3 paragraphs)
Provide actionable recommendations for the student's continued learning journey. Suggest specific topics to explore, skills to practice, or learning strategies to try.

Format your response as JSON with this structure:
{
  "learningJourney": "string",
  "strengthsAchievements": "string",
  "skillsDevelopment": "string",
  "instructorFeedback": "string",
  "growthOpportunities": "string",
  "nextSteps": "string"
}`;

    const userPrompt = `Generate a personalized learning report for student: ${studentPerformance.name}

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
      .from('student_reports')
      .upsert({
        report_id: reportId,
        user_id: userId,
        generated_content: generatedContent,
        created_by: user.id,
      }, {
        onConflict: 'report_id,user_id'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save student report:', saveError);
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      report: savedReport,
      content: generatedContent 
    });

  } catch (error: any) {
    console.error('Error generating student report:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate report' 
    }, { status: 500 });
  }
}

