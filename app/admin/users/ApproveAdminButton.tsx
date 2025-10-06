'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@radix-ui/themes';

interface ApproveAdminButtonProps {
  userId: string;
  currentAdminId: string;
}

export function ApproveAdminButton({ userId, currentAdminId }: ApproveAdminButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleApprove = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          requested_admin: false,
          admin_approved_at: new Date().toISOString(),
          admin_approved_by: currentAdminId,
        })
        .eq('id', userId);

      if (error) throw error;

      router.refresh();
    } catch (error) {
      console.error('Error approving admin:', error);
      alert('Failed to approve admin request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      size="2" 
      color="green" 
      onClick={handleApprove}
      disabled={loading}
    >
      {loading ? 'Approving...' : '✓ Approve as Admin'}
    </Button>
  );
}

