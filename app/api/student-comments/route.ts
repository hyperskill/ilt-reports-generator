import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const userId = searchParams.get('userId');

    if (!reportId || !userId) {
      return NextResponse.json({ error: 'Missing reportId or userId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('student_comments')
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments: data || null });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    console.log('=== API: Received student comment save request ===');
    console.log('Body:', JSON.stringify(body, null, 2));
    
    const { reportId, userId, comment_program_expert, comment_teaching_assistants, comment_learning_support } = body;

    if (!reportId || !userId) {
      console.error('Missing required fields - reportId:', reportId, 'userId:', userId);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const recordToUpsert = {
      report_id: reportId,
      user_id: userId,
      comment_program_expert: comment_program_expert || null,
      comment_teaching_assistants: comment_teaching_assistants || null,
      comment_learning_support: comment_learning_support || null,
      updated_by: user.id,
    };

    console.log('Record to upsert:', JSON.stringify(recordToUpsert, null, 2));

    // Upsert (insert or update)
    const { data, error } = await supabase
      .from('student_comments')
      .upsert(recordToUpsert, {
        onConflict: 'report_id,user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Successfully saved comment:', data);
    return NextResponse.json({ success: true, comments: data });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

