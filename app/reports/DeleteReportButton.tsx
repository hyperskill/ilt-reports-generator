'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, AlertDialog, Flex } from '@radix-ui/themes';

interface DeleteReportButtonProps {
  reportId: string;
  reportTitle: string;
}

export function DeleteReportButton({ reportId, reportTitle }: DeleteReportButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete report');
      }

      router.refresh();
    } catch (error: any) {
      alert(`Failed to delete report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <Button size="1" color="red" variant="soft">
          Delete
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content style={{ maxWidth: 450 }}>
        <AlertDialog.Title>Delete Report</AlertDialog.Title>
        <AlertDialog.Description size="2">
          Are you sure you want to delete "{reportTitle}"? This action cannot be undone.
        </AlertDialog.Description>

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button color="red" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete Report'}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}

