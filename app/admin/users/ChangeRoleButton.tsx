'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, DropdownMenu } from '@radix-ui/themes';

interface ChangeRoleButtonProps {
  userId: string;
  currentRole: string;
  currentAdminId: string;
}

export function ChangeRoleButton({ userId, currentRole, currentAdminId }: ChangeRoleButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRoleChange = async (newRole: 'admin' | 'manager' | 'student') => {
    if (newRole === currentRole) return;

    setLoading(true);
    try {
      const updateData: any = { role: newRole };

      // If promoting to admin, mark as approved
      if (newRole === 'admin') {
        updateData.admin_approved_at = new Date().toISOString();
        updateData.admin_approved_by = currentAdminId;
        updateData.requested_admin = false;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      router.refresh();
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Failed to change user role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="soft" size="2" disabled={loading}>
          {loading ? 'Updating...' : 'Change Role'}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item 
          onClick={() => handleRoleChange('admin')}
          disabled={currentRole === 'admin'}
        >
          Admin
        </DropdownMenu.Item>
        <DropdownMenu.Item 
          onClick={() => handleRoleChange('manager')}
          disabled={currentRole === 'manager'}
        >
          Manager
        </DropdownMenu.Item>
        <DropdownMenu.Item 
          onClick={() => handleRoleChange('student')}
          disabled={currentRole === 'student'}
        >
          Student
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

