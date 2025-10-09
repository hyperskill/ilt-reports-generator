import { NextResponse } from 'next/server';
import { getModuleNamesMap, getModuleNamesMapByIds } from '@/lib/utils/cogniterra-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseIdParam = searchParams.get('courseId');
    const moduleIdsParam = searchParams.get('moduleIds');

    // If moduleIds provided, use them directly
    if (moduleIdsParam) {
      const moduleIds = moduleIdsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      
      if (moduleIds.length === 0) {
        return NextResponse.json(
          { error: 'moduleIds must contain valid numbers' },
          { status: 400 }
        );
      }

      const moduleNamesMap = await getModuleNamesMapByIds(moduleIds);

      return NextResponse.json({
        moduleIds,
        modules: moduleNamesMap,
        count: Object.keys(moduleNamesMap).length,
      });
    }

    // Otherwise, use courseId (legacy)
    if (!courseIdParam) {
      return NextResponse.json(
        { error: 'courseId or moduleIds parameter is required' },
        { status: 400 }
      );
    }

    const courseId = parseInt(courseIdParam, 10);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'courseId must be a valid number' },
        { status: 400 }
      );
    }

    // Fetch module names from Cogniterra API
    const moduleNamesMap = await getModuleNamesMap(courseId);

    return NextResponse.json({
      courseId,
      modules: moduleNamesMap,
      count: Object.keys(moduleNamesMap).length,
    });
  } catch (error: any) {
    console.error('Error fetching Cogniterra modules:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch module names from Cogniterra API',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

