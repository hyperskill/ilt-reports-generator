'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@radix-ui/themes';

interface ApproveAdminButtonProps {
  userId: string;
  currentAdminId: string;
}

export function ApproveAdminButton({ userId, currentAdminId }: ApproveAdminButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: 'admin',
          requestedAdmin: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve admin');
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error('Error approving admin:', error);
      alert(`Failed to approve admin request: ${error.message}`);
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
