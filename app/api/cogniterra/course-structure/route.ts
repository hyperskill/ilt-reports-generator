import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getModuleNamesMapByIds, getLessonNamesMapByIds } from '@/lib/utils/cogniterra-api';

/**
 * POST /api/cogniterra/course-structure
 * Build course structure from structure_data with real module and topic names
 * Body: { structureData: any[] }
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
    const { structureData } = body;

    if (!structureData || !Array.isArray(structureData) || structureData.length === 0) {
      return NextResponse.json(
        { error: 'structureData is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Extract unique module IDs
    const moduleIdsSet = new Set<number>();
    for (const row of structureData) {
      const moduleId = Number(row.module_id || row.moduleid || 0);
      if (moduleId > 0) {
        moduleIdsSet.add(moduleId);
      }
    }

    const moduleIds = Array.from(moduleIdsSet);

    if (moduleIds.length === 0) {
      return NextResponse.json({ courseStructure: [] });
    }

    // Fetch module names from Cogniterra API
    const moduleNamesMap = await getModuleNamesMapByIds(moduleIds);

    // Extract unique lesson IDs
    const lessonIdsSet = new Set<number>();
    for (const row of structureData) {
      const lessonId = Number(row.lesson_id || row.lessonid || 0);
      if (lessonId > 0) {
        lessonIdsSet.add(lessonId);
      }
    }

    const lessonIds = Array.from(lessonIdsSet);
    
    // Fetch lesson names from Cogniterra API
    const lessonNamesMap = lessonIds.length > 0 
      ? await getLessonNamesMapByIds(lessonIds) 
      : {};

    // Build module structure with topics
    const moduleMap = new Map<number, {
      moduleId: number;
      moduleTitle: string;
      modulePosition: number;
      topics: Map<number, {
        topicId: number;
        topicTitle: string;
        topicPosition: number;
        stepsCount: number;
      }>;
    }>();

    for (const row of structureData) {
      const moduleId = Number(row.module_id || row.moduleid || 0);
      const position = Number(row.position || row.module_position || 0);
      const lessonId = Number(row.lesson_id || row.lessonid || 0);

      if (moduleId > 0) {
        if (!moduleMap.has(moduleId)) {
          moduleMap.set(moduleId, {
            moduleId,
            moduleTitle: moduleNamesMap[moduleId] || `Module ${moduleId}`,
            modulePosition: position,
            topics: new Map(),
          });
        }

        const module = moduleMap.get(moduleId)!;
        
        if (lessonId > 0 && !module.topics.has(lessonId)) {
          const lessonPosition = Number(row.lesson_position || 0);
          module.topics.set(lessonId, {
            topicId: lessonId,
            topicTitle: lessonNamesMap[lessonId] || `Topic ${lessonId}`,
            topicPosition: lessonPosition,
            stepsCount: 0, // Will be counted below
          });
        }

        // Count steps per topic
        if (lessonId > 0 && module.topics.has(lessonId)) {
          const topic = module.topics.get(lessonId)!;
          topic.stepsCount += 1;
        }
      }
    }

    // Convert to array format
    const courseStructure = Array.from(moduleMap.values())
      .map(m => ({
        moduleId: m.moduleId,
        moduleTitle: m.moduleTitle,
        modulePosition: m.modulePosition,
        topics: Array.from(m.topics.values())
          .sort((a, b) => a.topicPosition - b.topicPosition),
      }))
      .sort((a, b) => a.modulePosition - b.modulePosition);

    return NextResponse.json({ courseStructure });
  } catch (error: any) {
    console.error('Error building course structure:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to build course structure' },
      { status: 500 }
    );
  }
}

