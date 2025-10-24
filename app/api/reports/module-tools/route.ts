import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * GET /api/reports/module-tools?reportId=xxx
 * Fetch all module tools for a report
 */
export async function GET(request: NextRequest) {
  try {
    // Check for Authorization header (for testing scripts)
    const authHeader = request.headers.get('authorization');
    let supabase;

    if (authHeader && authHeader.startsWith('Bearer ')) {
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
      supabase = await createClient();
    }
    
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

    // Fetch module tools
    const { data: moduleTools, error } = await supabase
      .from('module_tools')
      .select('*')
      .eq('report_id', reportId)
      .order('module_id', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ moduleTools: moduleTools || [] });
  } catch (error: any) {
    console.error('Error fetching module tools:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch module tools' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/module-tools
 * Save or update module tools
 * Body: { reportId, moduleId, moduleTitle, tools }
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
    const { reportId, moduleId, moduleTitle, tools } = body;

    if (!reportId || !moduleId || !moduleTitle || !tools) {
      return NextResponse.json(
        { error: 'Missing required fields: reportId, moduleId, moduleTitle, tools' },
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
        { error: 'Only admins can save module tools' },
        { status: 403 }
      );
    }

    // Upsert module tools
    const { data, error } = await supabase
      .from('module_tools')
      .upsert(
        {
          report_id: reportId,
          module_id: moduleId,
          module_title: moduleTitle,
          tools,
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

    return NextResponse.json({ moduleTool: data });
  } catch (error: any) {
    console.error('Error saving module tools:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save module tools' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/module-tools?reportId=xxx&moduleId=xxx
 * Delete module tools
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
        { error: 'Only admins can delete module tools' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('module_tools')
      .delete()
      .eq('report_id', reportId)
      .eq('module_id', parseInt(moduleId, 10));

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting module tools:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete module tools' },
      { status: 500 }
    );
  }
}

