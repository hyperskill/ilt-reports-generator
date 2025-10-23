import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/reports/learning-outcomes?reportId=xxx
 * Fetch all learning outcomes for a report
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { error: 'reportId is required' },
        { status: 400 }
      );
    }

    // Fetch learning outcomes
    const { data: learningOutcomes, error } = await supabase
      .from('learning_outcomes')
      .select('*')
      .eq('report_id', reportId)
      .order('module_id', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ learningOutcomes: learningOutcomes || [] });
  } catch (error: any) {
    console.error('Error fetching learning outcomes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch learning outcomes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/learning-outcomes
 * Save or update learning outcomes for a module
 * Body: { reportId, moduleId, moduleTitle, outcomes }
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
    const { reportId, moduleId, moduleTitle, outcomes } = body;

    if (!reportId || !moduleId || !moduleTitle || !outcomes) {
      return NextResponse.json(
        { error: 'Missing required fields: reportId, moduleId, moduleTitle, outcomes' },
        { status: 400 }
      );
    }

    // Verify user has access to this report (admin only for now)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can save learning outcomes' },
        { status: 403 }
      );
    }

    // Upsert learning outcome
    const { data, error } = await supabase
      .from('learning_outcomes')
      .upsert(
        {
          report_id: reportId,
          module_id: moduleId,
          module_title: moduleTitle,
          outcomes,
          created_by: user.id,
        },
        {
          onConflict: 'report_id,module_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ learningOutcome: data });
  } catch (error: any) {
    console.error('Error saving learning outcome:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save learning outcome' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/learning-outcomes?reportId=xxx&moduleId=xxx
 * Delete a learning outcome
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reportId = searchParams.get('reportId');
    const moduleId = searchParams.get('moduleId');

    if (!reportId || !moduleId) {
      return NextResponse.json(
        { error: 'reportId and moduleId are required' },
        { status: 400 }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete learning outcomes' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('learning_outcomes')
      .delete()
      .eq('report_id', reportId)
      .eq('module_id', parseInt(moduleId, 10));

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting learning outcome:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete learning outcome' },
      { status: 500 }
    );
  }
}

