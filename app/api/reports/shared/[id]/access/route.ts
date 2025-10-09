import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Grant access to users
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    
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
    const { userIds, expiresAt } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds must be a non-empty array' }, { status: 400 });
    }

    // Verify the shared report exists
    const { data: report, error: reportError } = await supabase
      .from('shared_reports')
      .select('id')
      .eq('id', id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Shared report not found' }, { status: 404 });
    }

    // Grant access to all users
    const accessRecords = userIds.map(userId => ({
      shared_report_id: id,
      user_id: userId,
      granted_by: user.id,
      expires_at: expiresAt || null,
    }));

    const { data: grantedAccess, error: accessError } = await supabase
      .from('report_access')
      .upsert(accessRecords, {
        onConflict: 'shared_report_id,user_id',
      })
      .select();

    if (accessError) {
      console.error('Failed to grant access:', accessError);
      return NextResponse.json({ error: accessError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      granted: grantedAccess 
    });

  } catch (error: any) {
    console.error('Error granting access:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to grant access' 
    }, { status: 500 });
  }
}

// Revoke access from users
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    
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
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds must be a non-empty array' }, { status: 400 });
    }

    // Revoke access
    const { error: revokeError } = await supabase
      .from('report_access')
      .delete()
      .eq('shared_report_id', id)
      .in('user_id', userIds);

    if (revokeError) {
      console.error('Failed to revoke access:', revokeError);
      return NextResponse.json({ error: revokeError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      revoked: userIds 
    });

  } catch (error: any) {
    console.error('Error revoking access:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to revoke access' 
    }, { status: 500 });
  }
}

// Get users who have access
export async function GET(
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

    // Check if user is the creator
    const { data: report } = await supabase
      .from('shared_reports')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!report) {
      return NextResponse.json({ error: 'Shared report not found' }, { status: 404 });
    }

    const isCreator = report.created_by === user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch access list with user details
    const { data: accessList, error } = await supabase
      .from('report_access')
      .select(`
        id,
        user_id,
        granted_at,
        expires_at,
        granted_by
      `)
      .eq('shared_report_id', id);

    if (error) {
      console.error('Failed to fetch access list:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch user profiles for the access list
    const userIds = accessList?.map(a => a.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, role')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const enrichedAccessList = accessList?.map(access => ({
      ...access,
      user: profileMap.get(access.user_id),
    })) || [];

    return NextResponse.json({ 
      success: true, 
      access: enrichedAccessList 
    });

  } catch (error: any) {
    console.error('Error fetching access list:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch access list' 
    }, { status: 500 });
  }
}
