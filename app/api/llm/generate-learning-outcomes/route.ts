import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/llm/generate-learning-outcomes
 * Generate learning outcomes for a specific module using LLM
 * Body: { courseStructure, moduleId, moduleTitle, topics }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseStructure, moduleId, moduleTitle, topics } = body;

    if (!courseStructure || !moduleId || !moduleTitle || !topics) {
      return NextResponse.json(
        { error: 'Missing required fields: courseStructure, moduleId, moduleTitle, topics' },
        { status: 400 }
      );
    }

    // Ensure arrays are valid
    const validCourseStructure = Array.isArray(courseStructure) ? courseStructure : [];
    const validTopics = Array.isArray(topics) ? topics : [];

    // Prepare context for LLM
    const courseContext = validCourseStructure
      .map((module: any) => {
        const moduleTopics = Array.isArray(module.topics) ? module.topics : [];
        const topicsList = moduleTopics
          .map((topic: any) => `    - ${topic.topicTitle} (${topic.stepsCount} steps)`)
          .join('\n');
        return `Module ${module.modulePosition}: ${module.moduleTitle}\n${topicsList}`;
      })
      .join('\n\n');

    const targetTopicsList = validTopics
      .map((topic: any) => `  - ${topic.topicTitle} (${topic.stepsCount} steps)`)
      .join('\n');

    // System prompt for generating learning outcomes
    const systemPrompt = `You are an educational expert specialized in defining learning outcomes for online courses. Your task is to generate clear, measurable, and actionable learning outcomes for a specific module within a course.

Guidelines for learning outcomes:
- Use action verbs (e.g., "understand", "apply", "analyze", "create", "evaluate")
- Be specific and measurable
- Focus on what students will be able to DO after completing the module
- Align with Bloom's taxonomy levels
- Keep outcomes concise (3-5 bullet points)
- Consider the module's topics and their complexity

Format your response as a bullet-point list, with each outcome on a new line starting with "- ".`;

    const userPrompt = `Given the following course structure:

${courseContext}

Generate learning outcomes for the module "${moduleTitle}" (Module ID: ${moduleId}), which covers the following topics:

${targetTopicsList}

Please provide 3-5 clear learning outcomes that students should achieve after completing this module.`;

    // Call LLM API
    const litellmUrl = process.env.LITELLM_BASE_URL;
    const litellmKey = process.env.LITELLM_API_KEY;

    if (!litellmUrl || !litellmKey) {
      throw new Error('LiteLLM configuration missing. Please set LITELLM_BASE_URL and LITELLM_API_KEY in environment variables.');
    }

    const llmResponse = await fetch(`${litellmUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${litellmKey}`,
      },
      body: JSON.stringify({
        model: process.env.LITELLM_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      throw new Error(`LLM API error: ${llmResponse.status} ${errorText}`);
    }

    const llmData = await llmResponse.json();
    const generatedOutcomes = llmData.choices[0]?.message?.content || '';

    return NextResponse.json({
      outcomes: generatedOutcomes.trim(),
      moduleId,
      moduleTitle,
    });
  } catch (error: any) {
    console.error('Error generating learning outcomes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate learning outcomes' },
      { status: 500 }
    );
  }
}

