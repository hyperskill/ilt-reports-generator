import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// PATCH - Update report comments
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
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
    const { 
      comment_program_expert, 
      comment_teaching_assistants, 
      comment_learning_support 
    } = body;

    const updateData: any = {};
    if (comment_program_expert !== undefined) updateData.comment_program_expert = comment_program_expert;
    if (comment_teaching_assistants !== undefined) updateData.comment_teaching_assistants = comment_teaching_assistants;
    if (comment_learning_support !== undefined) updateData.comment_learning_support = comment_learning_support;

    const { data: report, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

