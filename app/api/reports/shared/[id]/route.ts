import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Get current user (optional - some reports may be public)
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch shared report with access info
    const { data: sharedReport, error } = await supabase
      .from('shared_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !sharedReport) {
      return NextResponse.json({ error: 'Shared report not found' }, { status: 404 });
    }

    // Check access permissions
    const isAdmin = user && await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => data?.role === 'admin');

    const isCreator = user && sharedReport.created_by === user.id;
    const isPublic = sharedReport.is_public;

    // Check if user has explicit access
    const hasAccess = user && await supabase
      .from('report_access')
      .select('id')
      .eq('shared_report_id', id)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => !!data);

    if (!isAdmin && !isCreator && !isPublic && !hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If admin or creator, fetch access list
    let accessList: any[] = [];
    if (isAdmin || isCreator) {
      const { data: accessData } = await supabase
        .from('report_access')
        .select(`
          id,
          user_id,
          granted_at,
          expires_at,
          profiles:user_id (
            id,
            email
          )
        `)
        .eq('shared_report_id', id);

      accessList = accessData || [];
    }

    return NextResponse.json({ 
      success: true, 
      sharedReport: {
        ...sharedReport,
        access_list: accessList,
        can_edit: isAdmin || isCreator,
      }
    });

  } catch (error: any) {
    console.error('Error fetching shared report:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch shared report' 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    
    // Check if current user is admin or creator
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

    // Fetch the report to check ownership
    const { data: existingReport } = await supabase
      .from('shared_reports')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!existingReport) {
      return NextResponse.json({ error: 'Shared report not found' }, { status: 404 });
    }

    const isCreator = existingReport.created_by === user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Forbidden: You can only edit your own reports' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, blocks, is_public } = body;

    // Validate blocks if provided
    if (blocks && !Array.isArray(blocks)) {
      return NextResponse.json({ error: 'Blocks must be an array' }, { status: 400 });
    }

    // Update the report
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (blocks !== undefined) updateData.blocks = blocks;
    if (is_public !== undefined) updateData.is_public = is_public;

    const { data: updatedReport, error: updateError } = await supabase
      .from('shared_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update shared report:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      sharedReport: updatedReport 
    });

  } catch (error: any) {
    console.error('Error updating shared report:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update shared report' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    
    // Check if current user is admin or creator
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

    // Fetch the report to check ownership
    const { data: existingReport } = await supabase
      .from('shared_reports')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!existingReport) {
      return NextResponse.json({ error: 'Shared report not found' }, { status: 404 });
    }

    const isCreator = existingReport.created_by === user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own reports' }, { status: 403 });
    }

    // Delete the report (cascades to report_access)
    const { error: deleteError } = await supabase
      .from('shared_reports')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete shared report:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting shared report:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete shared report' 
    }, { status: 500 });
  }
}
