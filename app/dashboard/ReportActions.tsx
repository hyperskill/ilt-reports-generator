'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Flex, Dialog, TextField, TextArea, Text, AlertDialog } from '@radix-ui/themes';

interface ReportActionsProps {
  reportId: string;
  reportTitle: string;
  reportDescription: string | null;
  isAdmin: boolean;
  isOwner: boolean;
}

export function ReportActions({ reportId, reportTitle, reportDescription, isAdmin, isOwner }: ReportActionsProps) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [title, setTitle] = useState(reportTitle);
  const [description, setDescription] = useState(reportDescription || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = async () => {
    if (!title.trim()) {
      alert('Please enter a report title');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      setShowEditDialog(false);
      // Force page refresh by navigating to dashboard with timestamp
      router.push(`/dashboard?t=${Date.now()}`);
      router.refresh();
    } catch (error: any) {
      alert(`Failed to update report: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      setShowDeleteDialog(false);
      // Force page refresh by navigating to dashboard with timestamp
      router.push(`/dashboard?t=${Date.now()}`);
      router.refresh();
    } catch (error: any) {
      alert(`Failed to delete report: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const canModify = isAdmin || isOwner;

  return (
    <Flex gap="2">
      <Button 
        size="1" 
        variant="soft"
        onClick={() => router.push(`/reports/${reportId}`)}
      >
        View
      </Button>

      {canModify && (
        <>
          <Dialog.Root open={showEditDialog} onOpenChange={setShowEditDialog}>
            <Dialog.Trigger>
              <Button size="1" variant="soft" color="blue">
                Edit
              </Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: 450 }}>
              <Dialog.Title>Edit Report</Dialog.Title>
              <Dialog.Description size="2" mb="4">
                Update the report title and description.
              </Dialog.Description>

              <Flex direction="column" gap="3">
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Report Title *
                  </Text>
                  <TextField.Root
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter report title"
                  />
                </label>

                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Description (optional)
                  </Text>
                  <TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes about this report..."
                    rows={3}
                  />
                </label>
              </Flex>

              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button onClick={handleEdit} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>

          <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialog.Trigger>
              <Button size="1" variant="soft" color="red">
                Delete
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Title>Delete Report</AlertDialog.Title>
              <AlertDialog.Description size="2">
                Are you sure you want to delete <Text weight="bold">"{reportTitle}"</Text>? 
                This action cannot be undone.
              </AlertDialog.Description>

              <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                  <Button variant="soft" color="gray">
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                  <Button color="red" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Delete Report'}
                  </Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </>
      )}
    </Flex>
  );
}

