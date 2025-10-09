import { NextResponse } from 'next/server';
import { getLessonNamesMapByIds } from '@/lib/utils/cogniterra-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonIdsParam = searchParams.get('lessonIds');

    if (!lessonIdsParam) {
      return NextResponse.json(
        { error: 'Missing lessonIds parameter' },
        { status: 400 }
      );
    }

    // Parse lesson IDs from comma-separated string
    const lessonIds = lessonIdsParam
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));

    if (lessonIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid lesson IDs provided' },
        { status: 400 }
      );
    }

    // Fetch lesson names from Cogniterra API
    const lessonNamesMap = await getLessonNamesMapByIds(lessonIds);

    return NextResponse.json({
      lessonIds,
      lessons: lessonNamesMap,
      count: Object.keys(lessonNamesMap).length,
    });

  } catch (error: any) {
    console.error('Error fetching lesson names:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch lesson names from Cogniterra API',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

