import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getModuleStructureData, getGroupModuleAnalytics } from '@/lib/utils/llm-data-helpers';
import { getLessonNamesMapByIds } from '@/lib/utils/cogniterra-api';

const openai = new OpenAI({
  apiKey: process.env.LITELLM_API_KEY,
  baseURL: process.env.LITELLM_BASE_URL,
});

// Helper function to get unique count
function getUniqueCount(data: any[], field: string): number {
  const unique = new Set(data.map(item => item[field]).filter(Boolean));
  return unique.size;
}

// Helper function to get topic distribution from submissions with real lesson names
function getTopicDistribution(
  submissions: any[], 
  structure: any[] | undefined,
  lessonNamesMap?: Record<number, string>
): Record<string, number> {
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
  
  const distribution: Record<string, number> = {};
  for (const sub of submissions) {
    const stepId = String(sub.step_id || sub.stepid || sub.step || '').trim();
    if (stepId && structureMap[stepId]?.lesson_id) {
      const lessonId = structureMap[stepId].lesson_id!;
      const topicKey = lessonNamesMap?.[lessonId] || `Topic ${lessonId}`;
      distribution[topicKey] = (distribution[topicKey] || 0) + 1;
    }
  }
  return distribution;
}

export async function POST(request: Request) {
  try {
    // Check for Authorization header (for testing scripts)
    const authHeader = request.headers.get('authorization');
    let supabase;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use Bearer token from Authorization header
      const token = authHeader.substring(7);
      supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
    } else {
      // Use cookies (normal web request)
      supabase = await createClient();
    }
    
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

    // Get lesson names for topic distribution
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

    // Fetch learning outcomes and module tools
    let learningOutcomes = null;
    let moduleTools = null;
    
    try {
      const [outcomesResponse, toolsResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/learning-outcomes?reportId=${reportId}`,
          { headers: request.headers }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/module-tools?reportId=${reportId}`,
          { headers: request.headers }
        ),
      ]);

      if (outcomesResponse.ok) {
        const outcomesData = await outcomesResponse.json();
        learningOutcomes = outcomesData.learningOutcomes || [];
      }

      if (toolsResponse.ok) {
        const toolsData = await toolsResponse.json();
        moduleTools = toolsData.moduleTools || [];
      }
    } catch (error) {
      console.error('Failed to fetch learning outcomes and module tools:', error);
      // Continue without outcomes/tools if fetch fails
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
        // Only send aggregated stats, not all raw data with real lesson names
        topicDistribution: getTopicDistribution(report.submissions_data, report.structure_data, lessonNamesMap),
      } : null,
      courseStructure: report.structure_data ? {
        totalTopics: getUniqueCount(report.structure_data, 'lesson_id'),
        totalSteps: getUniqueCount(report.structure_data, 'step_id'),
      } : null,
      // NEW: Module structure with names and topics
      moduleStructure,
      // NEW: Group average module analytics
      groupModuleAnalytics,
      // NEW: Learning outcomes and tools by module
      learningOutcomes,
      moduleTools,
    };

    const systemPrompt = `You are an expert Learning Experience Designer creating a comprehensive group activity report for business managers who invested in their team's professional development.

**IMPORTANT: Generate ALL content in English only.**

**TONE & STYLE**: Write in a friendly, warm, and approachable tone. Be professional but kind. Celebrate achievements genuinely, acknowledge challenges constructively, and provide encouragement. Think of yourself as a supportive advisor who wants the manager to feel confident about their team's development.

## About the Training Program

**AI Foundations: Models, Prompts, and Agents** is a practical, hands-on training designed to help learners build a solid foundation in applied AI.

Over the course of four weeks, participants:
- Learn the fundamentals of modern AI models and how they work
- Explore prompt and context engineering to make AI systems more effective
- Experiment with agentic AI tools (like n8n and Ona) and learn how to automate real workflows
- Practice building their own small AI projects and share them with peers

This training is designed for curious learners who want to observe the current state of AI technologies, learn how they work, and find ways to implement different tools into their workflow.

**Instructors:** Hyperskill - an online learning platform that helps individuals develop tech skills through hands-on experience, with a focus on personalized and engaging learning. Hyperskill's tracks are designed to be practical and industry-focused, allowing learners to work on real-world projects using professional tools.

## Your Audience & Purpose

This report is for a **business manager who sent their team to this training**. They need to understand:
- **ROI**: Was this training valuable for their business?
- **Business Impact**: What practical skills can team members now apply at work?
- **Team Development**: How did their employees perform and grow?
- **Actionable Insights**: What should they do next to maximize the training investment?

## Key Analysis Guidelines

1. **Focus on Business Value**: Translate technical metrics into business outcomes. Instead of "78% completion rate," say "Team members completed most of the course, gaining practical AI skills they can apply to automate workflows."

2. **Highlight Student Projects**: Pay special attention to comments from experts, teaching assistants, and learning support that mention student projects. These projects demonstrate practical application and business value. Include specific examples of what students built and how it relates to real-world business needs.

3. **Connect Modules to Skills**: You have access to real module names and topics. Map student progress through these modules to concrete skills acquired. For example:
   - "Introduction to AI Models" → Understanding of AI capabilities and limitations
   - "Prompt Engineering" → Ability to effectively communicate with AI tools
   - "Agentic AI & Automation" → Skills to build automated workflows

4. **Analyze Learning Outcomes Mastery**: You have access to specific learning outcomes and tools for each module, along with group progress data (completion rates, success rates). Use this information to:
   - Assess how well the team is mastering specific learning outcomes across modules
   - Identify which outcomes the team has mastered vs. which need more support
   - Connect learning outcomes to business capabilities (e.g., "The team has mastered prompt engineering outcomes, enabling them to effectively leverage AI tools like ChatGPT and Claude in daily work")
   - Highlight specific tools and technologies the team can now use (from moduleTools data)
   - When discussing module progress, reference the actual learning outcomes to show what skills were acquired
   - Use completion and success rates to assess mastery level: high rates (≥75%) = strong mastery, medium (50-74%) = developing, low (<50%) = needs support

5. **Synthesize Expert Feedback**: Expert comments contain valuable insights about student engagement, project quality, and practical applications. Highlight these observations, especially when they mention specific projects or business-relevant achievements.

6. **Use Business Language**: Avoid jargon. Explain technical concepts in terms managers understand. Focus on outcomes, not metrics.

## Data Available to You

You have access to:
- **Module Analytics**: Real module names, topics, completion rates, success rates, and meeting attendance per module
- **Learning Outcomes**: Specific learning outcomes defined for each module - what students were expected to master
- **Module Tools**: Technologies, platforms, and tools covered in each module
- **Performance Data**: Overall group metrics and individual student performance
- **Expert Comments**: Observations from program experts, teaching assistants, and learning support
- **Student Feedback**: Comments about individual student progress and projects
- **Topic Distribution**: Which course topics received the most engagement
- **Project Comments**: Individual feedback for each student's project work (provided in student comments)
- **Final Demo Participation**: Data about who participated in the final project demonstration (check meetings data for "demo" or "final" entries)

When analyzing team performance:
1. Look for project comments in the format "Student Name - Comment" and highlight notable achievements
2. Check meetings data for participation in final demonstrations - this is a significant achievement worth highlighting as it shows the student's confidence and readiness to share their work
3. Mention both project quality and final demo participation in the Executive Summary and Expert Observations sections

## Report Structure

**Executive Summary** (2-3 paragraphs)
Provide a high-level business overview: Was the training successful? What's the key takeaway? What business value was delivered? Reference the most important learning outcomes the team mastered and the practical tools they can now use. Make this actionable and focused on ROI.

**Skills Acquired & Learning Outcomes** (2-5 paragraphs)
Based on module completion, topic performance, and learning outcomes data, describe what practical skills the team now has. **Use the specific learning outcomes from learningOutcomes data** to detail what the team can now do. Connect these outcomes to real-world business capabilities. Mention specific tools and technologies from moduleTools data that the team can now leverage. Highlight any standout projects or achievements mentioned in expert comments. Structure your response to cover:
- Overview of key competencies gained across all modules
- Specific learning outcomes mastered in high-performing modules (≥75% completion/success)
- Tools and technologies the team is now proficient with
- How these skills translate to business value
If needed, you can expand to 5 paragraphs to thoroughly cover all relevant learning outcomes and tools.

**Team Engagement & Dynamics** (2-4 paragraphs)
Analyze activity patterns, meeting attendance, and consistency. Comment on team cohesion and commitment to learning. When discussing module-level engagement, reference how it relates to mastering specific learning outcomes. Explain what this means for applying skills back at work. You can expand to 3-4 paragraphs if needed to properly analyze engagement patterns across different modules and learning outcomes.

**Expert Observations & Project Highlights** (3-5 paragraphs)
Synthesize insights from program experts, teaching assistants, and learning support. **IMPORTANT: You must mention ALL student projects from the group** - even brief mentions are required for completeness. For each project mentioned in the comments, describe what the student built, why it matters, and how it demonstrates practical skill application. **When describing projects, reference which learning outcomes or tools they demonstrate mastery of** (use learningOutcomes and moduleTools data to make these connections).

If there are many projects (5 or more), organize your response in 3-5 paragraphs:
- Group similar projects together (e.g., "Several team members focused on automation tools, demonstrating mastery of the agentic AI outcomes...")
- Highlight standout projects with more detail, connecting them to specific learning outcomes
- Use a final paragraph to acknowledge remaining projects briefly
- Ensure every student's project is mentioned at least once by name

Include specific examples and real project names. Make the manager feel that each team member's contribution is valued and recognized.

**Business Recommendations & Next Steps** (2-5 paragraphs)
Provide actionable recommendations for maximizing the training investment. What should the manager do to help their team apply these skills? Are there gaps to address? **If certain learning outcomes have lower mastery rates (<75%), suggest specific ways to reinforce those skills.** Recommend which tools the team should start using immediately based on moduleTools data. Be constructive and business-focused. You can expand to 4-5 paragraphs if needed to provide comprehensive, actionable recommendations.

## Output Format

Format your response as JSON with this structure:
{
  "executiveSummary": "string",
  "skillsAcquired": "string",
  "teamEngagement": "string",
  "expertObservations": "string",
  "recommendations": "string"
}

Remember: Write in English, focus on business value, highlight student projects, and make everything actionable for a business manager.`;

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

