import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    // Get request body
    const body = await request.json();
    const { 
      title, 
      description,
      performanceData, 
      dynamicData, 
      dynamicSeries,
      settings,
      excludedUserIds,
      fileMetadata,
      studentComments 
    } = body;

    if (!title || !performanceData || !dynamicData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save report to database
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        title,
        description: description || null,
        created_by: user.id,
        performance_data: performanceData,
        dynamic_data: dynamicData,
        dynamic_series: dynamicSeries || null,
        settings: settings || null,
        excluded_user_ids: excludedUserIds || [],
        grade_book_file_path: fileMetadata?.gradeBook || null,
        learners_file_path: fileMetadata?.learners || null,
        submissions_file_path: fileMetadata?.submissions || null,
        meetings_file_path: fileMetadata?.meetings || null,
        structure_file_path: fileMetadata?.structure || null,
        status: 'completed',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Save student comments if provided
    if (studentComments && Object.keys(studentComments).length > 0) {
      const commentsToInsert = Object.values(studentComments).map((comment: any) => ({
        report_id: report.id,
        user_id: comment.userId,
        comment_program_expert: comment.comment_program_expert || null,
        comment_teaching_assistants: comment.comment_teaching_assistants || null,
        comment_learning_support: comment.comment_learning_support || null,
        updated_by: user.id,
      }));

      const { error: commentsError } = await supabase
        .from('student_comments')
        .insert(commentsToInsert);

      if (commentsError) {
        console.error('Failed to save student comments:', commentsError);
      }
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

