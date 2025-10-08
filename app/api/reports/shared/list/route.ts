import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    let query = supabase
      .from('shared_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (isAdmin) {
      // Admins see all reports
    } else {
      // Regular users see only their own created reports and reports they have access to
      const { data: accessibleReports } = await supabase
        .from('report_access')
        .select('shared_report_id')
        .eq('user_id', user.id);

      const accessibleIds = accessibleReports?.map(a => a.shared_report_id) || [];

      query = query.or(`created_by.eq.${user.id},id.in.(${accessibleIds.join(',')})`);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Failed to fetch shared reports:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each report, fetch access count
    const reportsWithCount = await Promise.all(
      (reports || []).map(async (report) => {
        const { count } = await supabase
          .from('report_access')
          .select('*', { count: 'exact', head: true })
          .eq('shared_report_id', report.id);

        return {
          ...report,
          access_count: count || 0,
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      reports: reportsWithCount 
    });

  } catch (error: any) {
    console.error('Error fetching shared reports:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch shared reports' 
    }, { status: 500 });
  }
}
