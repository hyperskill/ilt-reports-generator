import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get shared report ID from query params
    const { searchParams } = new URL(request.url);
    const sharedReportId = searchParams.get('id');

    if (!sharedReportId) {
      return NextResponse.json({ error: 'Shared report ID is required' }, { status: 400 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Delete the shared report (this will cascade delete report_access entries)
    const { error: deleteError } = await supabase
      .from('shared_reports')
      .delete()
      .eq('id', sharedReportId);

    if (deleteError) {
      console.error('Error deleting shared report:', deleteError);
      return NextResponse.json({ error: 'Failed to delete shared report' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete shared report API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

