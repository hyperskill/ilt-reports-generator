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

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { userId, role, requestedAdmin } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the user's profile
    const updateData: any = {
      role,
      requested_admin: requestedAdmin ?? false,
    };

    // If promoting to admin, add approval metadata
    if (role === 'admin') {
      updateData.admin_approved_at = new Date().toISOString();
      updateData.admin_approved_by = user.id;
    }

    console.log('Updating user:', userId, 'with data:', updateData);

    // First, check if the user exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('User before update:', existingUser);

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select();

    console.log('Update result:', { data, error });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: error.message, 
        details: error,
        userId,
        updateData 
      }, { status: 500 });
    }

    // Even if data is empty, the update might have succeeded
    // Check by fetching the updated profile
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Fetched updated profile:', updatedProfile);

    return NextResponse.json({ success: true, data: updatedProfile });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

