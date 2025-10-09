import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getModuleStructureData, getStudentModuleAnalytics } from '@/lib/utils/llm-data-helpers';
import { getLessonNamesMapByIds } from '@/lib/utils/cogniterra-api';

const openai = new OpenAI({
  apiKey: process.env.LITELLM_API_KEY,
  baseURL: process.env.LITELLM_BASE_URL,
});

// Helper function to get student submissions stats with real lesson names
async function getStudentSubmissionsStats(
  submissions: any[], 
  userId: string, 
  structure: any[] | undefined,
  lessonNamesMap?: Record<number, string>
): Promise<any> {
  const studentSubs = submissions.filter((s: any) => 
    String(s.user_id || s.userid || '').toLowerCase() === userId.toLowerCase()
  );
  
  const correctSubs = studentSubs.filter((s: any) => 
    String(s.status || s.result || '').toLowerCase() === 'correct'
  );
  
  // Build structure map for linking steps to lessons
  const structureMap: Record<string, { lesson_id?: number }> = {};
  if (structure && Array.isArray(structure)) {
    for (const item of structure) {
      const stepId = String(item.step_id || '').trim();
      if (stepId) {
        structureMap[stepId] = {
          lesson_id: item.lesson_id,
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
        };
      }
      
      topicStats[lessonId].attempts += 1;
      topicStats[lessonId].steps.add(stepId);
      if (String(sub.status || '').toLowerCase() === 'correct') {
        topicStats[lessonId].correct += 1;
      }
    }
  }
  
  // Convert to array with success rates and real lesson names
  const topicArray = Object.values(topicStats).map((stats) => ({
    topic: lessonNamesMap?.[stats.lessonId] || `Topic ${stats.lessonId}`,
    lessonId: stats.lessonId,
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

    // Get lesson names for topic performance
    let lessonNamesMap: Record<number, string> = {};
    
    if (report.structure_data && report.structure_data.length > 0) {
      try {
        // Extract unique lesson IDs
        const lessonIdsSet = new Set<number>();
        for (const row of report.structure_data) {
          const lessonId = Number(row.lesson_id || row.lessonid || 0);
          if (lessonId > 0) {
            lessonIdsSet.add(lessonId);
          }
        }
        
        const lessonIds = Array.from(lessonIdsSet);
        if (lessonIds.length > 0) {
          lessonNamesMap = await getLessonNamesMapByIds(lessonIds);
        }
      } catch (error) {
        console.error('Failed to fetch lesson names:', error);
      }
    }

    // Get detailed submissions stats with real lesson names
    const submissionsAnalysis = report.submissions_data 
      ? await getStudentSubmissionsStats(
          report.submissions_data, 
          userId, 
          report.structure_data,
          lessonNamesMap
        )
      : null;

    // Get module structure data and student module analytics
    let moduleStructure = null;
    let studentModuleAnalytics = null;
    
    if (report.structure_data && report.structure_data.length > 0) {
      try {
        moduleStructure = await getModuleStructureData(report.structure_data);
        
        // Get student's individual module analytics
        if (report.submissions_data) {
          studentModuleAnalytics = await getStudentModuleAnalytics(
            userId,
            report.submissions_data,
            report.structure_data,
            report.meetings_data
          );
        }
      } catch (error) {
        console.error('Failed to fetch module data for student:', error);
      }
    }

    // Prepare data for LLM
    const promptData = {
      studentName: studentPerformance.name,
      performance: studentPerformance,
      dynamics: studentDynamic,
      activityTimeline: studentSeries,
      feedback: studentFeedback,
      // Add detailed topic-level insights
      submissionsAnalysis,
      // NEW: Module structure with names and topics
      moduleStructure,
      // NEW: Student's individual module analytics
      studentModuleAnalytics,
    };

    const systemPrompt = `You are an expert Learning Coach creating a personalized learning report for an individual student who completed a transformative learning journey.

**IMPORTANT: Generate ALL content in English only.**

**TONE & STYLE**: Write in a warm, friendly, and encouraging tone. Be genuinely supportive and celebrate the student's growth. Speak directly to the student using their name and "you/your" language. If the student struggled, provide compassionate support and encouragement. If they excelled, celebrate their victories enthusiastically! Help them see how they've become a better version of themselves.

## About the Training Program

**AI Foundations: Models, Prompts, and Agents** is a practical, hands-on training designed to help you build a solid foundation in applied AI.

Over the course of four weeks, you:
- Learned the fundamentals of modern AI models and how they work
- Explored prompt and context engineering to make AI systems more effective
- Experimented with agentic AI tools (like n8n and Ona) and learned how to automate real workflows
- Practiced building your own small AI projects and shared them with peers

This training is designed for curious learners who want to observe the current state of AI technologies, learn how they work, and find ways to implement different tools into their workflow.

**Instructors:** Hyperskill - an online learning platform that helps individuals develop tech skills through hands-on experience, with a focus on personalized and engaging learning. Hyperskill's tracks are designed to be practical and industry-focused, allowing learners to work on real-world projects using professional tools.

## Your Purpose

This report is for the **student themselves** - to help them:
- **Celebrate their growth**: Show them how they've become a better version of themselves
- **Recognize achievements**: Highlight their victories, big and small
- **Build confidence**: Help them see their progress and potential
- **Learn from challenges**: Frame difficulties as learning opportunities
- **Move forward**: Give them clear next steps for continued growth

## Key Analysis Guidelines

1. **Celebrate Growth & Transformation**: Focus on how the student has grown. Even if performance wasn't perfect, highlight what they learned, how they persevered, and what they can now do that they couldn't before.

2. **Support Struggling Students**: If the student had difficulties, be extra compassionate. Acknowledge their effort, validate their challenges, and emphasize that learning is a journey. Help them see that struggles are normal and valuable.

3. **Celebrate High Performers**: If the student excelled, celebrate enthusiastically! Highlight their best moments, most impressive achievements, and standout projects.

4. **Highlight Student Projects**: Pay special attention to comments from experts, teaching assistants, and learning support that mention student projects. These projects demonstrate practical application and real-world skills. Describe what they built, why it matters, and how it shows their growth. Connect projects to both personal development and potential business value.

5. **Connect Modules to Skills**: You have access to real module names and topics. Map student progress through these modules to concrete skills acquired. For example:
   - "Introduction to AI Models" → Understanding of AI capabilities and how to choose the right tools
   - "Prompt Engineering" → Ability to effectively communicate with AI systems
   - "Agentic AI & Automation" → Skills to build automated workflows that save time

6. **Use Real Topic Names**: Reference actual lesson names (not "Topic 1, 2, 3") to make feedback specific and meaningful.

## Data Available to You

You have access to:
- **Overall performance metrics**: Grades, submissions, success rates, completion percentage
- **Activity patterns**: Consistency, effort, engagement over time
- **Topic-level performance**: Success rates and attempts per topic (with real topic names!)
- **Module analytics**: Performance in each course module (with real module names!)
- **Meeting attendance**: Participation in live sessions
- **Instructor feedback**: Comments from program experts, teaching assistants, and learning support
- **Student projects**: Mentioned in instructor feedback

## Analysis Guidelines

**If submissionsAnalysis is provided:**
- Identify topics where the student excelled (celebrate these wins!)
- Identify topics that were challenging (frame as learning opportunities)
- Look for patterns: consistent performer vs. variable performance
- Use real topic names for specific, meaningful feedback

**If studentModuleAnalytics is provided:**
- Highlight modules completed successfully (high completion and success rates)
- Acknowledge challenging modules (low success rates, high attempts per step)
- Connect meeting attendance with module performance
- Note activity periods showing engagement patterns
- Use specific module names for personalized feedback

**If instructor feedback is provided:**
- **Prioritize mentions of student projects** - describe what they built and why it's impressive
- Share positive observations that build confidence
- Present constructive feedback as opportunities for growth
- Quote or paraphrase specific insights from instructors

## Report Structure

**Your Learning Journey** (2-3 paragraphs)
Celebrate the student's participation and growth. Show them how they've transformed during this course. Highlight their unique approach to learning, activity patterns, and overall engagement. Help them see themselves as someone who took on a challenge and grew from it. Use real module names to show their progression through the course.

**Your Strengths & Achievements** (2-3 paragraphs)
Identify specific areas where the student excelled. **If they built projects, highlight them prominently!** Mention successful projects, strong technical skills, good collaboration, consistent effort, or creative problem-solving. Be specific and genuine. Connect their achievements to real-world skills they can use. If performance was lower, focus on effort, persistence, and any small wins.

**Your Skills Development** (2-3 paragraphs)
Analyze the student's technical progress and skill acquisition using real module and topic names. Show them what they can now do that they couldn't before. Comment on their problem-solving approach, persistence when facing challenges, and learning strategies. Map their progress through modules to concrete skills (e.g., "By completing Prompt Engineering, you can now craft effective AI prompts for various tasks").

**Feedback from Your Instructors** (2-3 paragraphs)
Share insights and observations from program experts, teaching assistants, and learning support. **Prioritize any mentions of student projects** - describe what they built, why it's impressive, and what it demonstrates about their skills. Present all feedback in a constructive, encouraging way that builds confidence.

**Opportunities for Growth** (2-3 paragraphs)
Identify 2-4 specific areas where the student can continue growing. Frame these as exciting opportunities rather than criticisms. Be extra supportive if the student struggled - emphasize that challenges are part of learning and they've already shown courage by participating. Include concrete, encouraging suggestions for how they can develop further.

**Next Steps & Recommendations** (2-3 paragraphs)
Provide actionable, encouraging recommendations for the student's continued learning journey. Suggest specific topics to explore, skills to practice, or learning strategies to try. Help them see a clear, achievable path forward. Make them excited about what comes next!

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

