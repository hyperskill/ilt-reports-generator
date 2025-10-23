import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/llm/generate-module-tools
 * Generate tools information for a specific module using LLM
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

    // System prompt for generating tools information
    const systemPrompt = `You are an educational technology expert specialized in identifying tools, technologies, and platforms used in online courses. Your task is to analyze a course module and identify what tools, technologies, software, or platforms students are likely to use.

Guidelines for tools identification:
- Base your suggestions ONLY on module and topic names provided - do not make assumptions beyond what is explicitly stated
- Focus on practical, hands-on tools students will actually use
- Include programming languages, frameworks, libraries, platforms, and software
- Be specific with tool names (avoid versions unless critical)
- Keep the list SHORT and concise (3-7 tools maximum)
- Output ONLY a bullet-point list of tool names, NO detailed descriptions or explanations
- Each line should be: "- ToolName" or "- Category: Tool1, Tool2, Tool3"

IMPORTANT: Keep your response brief and to the point. List tools only, without lengthy explanations.

Format example:
- Python
- Jupyter Notebook
- scikit-learn
- pandas, NumPy`;

    const userPrompt = `Given the following course structure:

${courseContext}

Based ONLY on the module and topic names, list the tools, technologies, and platforms that students will likely use in the module "${moduleTitle}" (Module ID: ${moduleId}), which covers:

${targetTopicsList}

Provide a SHORT bullet-point list of tools (3-7 items max). No descriptions, just tool names.`;

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
    const generatedTools = llmData.choices[0]?.message?.content || '';

    return NextResponse.json({
      tools: generatedTools.trim(),
      moduleId,
      moduleTitle,
    });
  } catch (error: any) {
    console.error('Error generating module tools:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate module tools' },
      { status: 500 }
    );
  }
}

