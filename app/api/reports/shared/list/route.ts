import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const sourceReportId = searchParams.get('sourceReportId');

    if (!sourceReportId) {
      return NextResponse.json({ 
        error: 'sourceReportId parameter is required' 
      }, { status: 400 });
    }

    // Fetch shared reports for the source report
    const { data: sharedReports, error } = await supabase
      .from('shared_reports')
      .select('*')
      .eq('source_report_id', sourceReportId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch shared reports:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      sharedReports: sharedReports || [] 
    });

  } catch (error: any) {
    console.error('Error fetching shared reports:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch shared reports' 
    }, { status: 500 });
  }
}