'use client';

import { useState } from 'use';
import { useRouter } from 'next/navigation';
import { Button, DropdownMenu } from '@radix-ui/themes';

interface ChangeRoleButtonProps {
  userId: string;
  currentRole: string;
  currentAdminId: string;
}

export function ChangeRoleButton({ userId, currentRole, currentAdminId }: ChangeRoleButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRoleChange = async (newRole: 'admin' | 'manager' | 'student') => {
    if (newRole === currentRole) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole,
          requestedAdmin: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change role');
      }

      console.log('Role changed successfully:', data);
      router.refresh();
    } catch (error: any) {
      console.error('Error changing role:', error);
      alert(`Failed to change user role: ${error.message}`);
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
