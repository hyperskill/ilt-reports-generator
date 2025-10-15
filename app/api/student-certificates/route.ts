import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/student-certificates?reportId=...&userId=...
// or GET /api/student-certificates?reportId=... (get all certificates for report)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const userId = searchParams.get('userId');

    if (!reportId) {
      return NextResponse.json(
        { error: 'reportId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If userId is provided, get specific certificate
    if (userId) {
      const { data, error } = await supabase
        .from('student_certificates')
        .select('*')
        .eq('report_id', reportId)
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching certificate:', error);
        return NextResponse.json({ error: 'Failed to fetch certificate' }, { status: 500 });
      }
      
      return NextResponse.json({ certificate: data || null });
    } else {
      // Get all certificates for the report
      const { data, error } = await supabase
        .from('student_certificates')
        .select('*')
        .eq('report_id', reportId)
        .order('user_id');
      
      if (error) {
        console.error('Error fetching certificates:', error);
        return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
      }
      
      return NextResponse.json({ certificates: data || [] });
    }
  } catch (error) {
    console.error('Error in GET /api/student-certificates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/student-certificates - Create or update certificate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reportId, userId, certificateUrl } = body;

    if (!reportId || !userId || !certificateUrl) {
      return NextResponse.json(
        { error: 'reportId, userId, and certificateUrl are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(certificateUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Upsert certificate (insert or update if exists)
    const { data, error } = await supabase
      .from('student_certificates')
      .upsert(
        {
          report_id: reportId,
          user_id: userId,
          certificate_url: certificateUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'report_id,user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving certificate:', error);
      return NextResponse.json({ error: 'Failed to save certificate' }, { status: 500 });
    }

    return NextResponse.json({ certificate: data });
  } catch (error) {
    console.error('Error in POST /api/student-certificates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/student-certificates?reportId=...&userId=...
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const userId = searchParams.get('userId');

    if (!reportId || !userId) {
      return NextResponse.json(
        { error: 'reportId and userId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { error } = await supabase
      .from('student_certificates')
      .delete()
      .eq('report_id', reportId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting certificate:', error);
      return NextResponse.json({ error: 'Failed to delete certificate' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/student-certificates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

