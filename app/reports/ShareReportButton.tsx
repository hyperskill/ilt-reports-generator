'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';

interface ShareReportButtonProps {
  reportType: 'manager' | 'student';
  sourceReportId: string;
  userId?: string;
  studentName?: string;
  isAdmin: boolean;
}

export default function ShareReportButton({
  reportType,
  sourceReportId,
  userId,
  studentName,
  isAdmin,
}: ShareReportButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isAdmin) {
    return null;
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/reports/shared/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          sourceReportId,
          userId: reportType === 'student' ? userId : undefined,
          title,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create shared report');
      }

      setIsOpen(false);
      setTitle('');
      setDescription('');

      // Navigate to edit page
      router.push(`/reports/shared/${data.sharedReport.id}/edit`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const defaultTitle = reportType === 'manager'
    ? 'Manager Report'
    : `Student Report - ${studentName || 'Student'}`;

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger>
        <Button variant="soft" color="green">
          📤 Share Report
        </Button>
      </Dialog.Trigger>

      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Share Report</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Create a shareable version of this {reportType} report with customizable blocks
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Title
            </Text>
            <TextField.Root
              placeholder={defaultTitle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Description (optional)
            </Text>
            <TextField.Root
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {reportType === 'student' && (
            <Text size="2" color="gray">
              Student: {studentName} (ID: {userId})
            </Text>
          )}
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create & Edit'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
