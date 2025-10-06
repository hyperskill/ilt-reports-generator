'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Dialog, Flex, TextField, TextArea, Text } from '@radix-ui/themes';

interface RenameReportButtonProps {
  reportId: string;
  currentTitle: string;
  currentDescription?: string;
}

export function RenameReportButton({ reportId, currentTitle, currentDescription }: RenameReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription || '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Title cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update report');
      }

      setOpen(false);
      router.refresh();
    } catch (error: any) {
      alert(`Failed to update report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button size="1" variant="soft">
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
              Title *
            </Text>
            <TextField.Root
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Report title"
            />
          </label>

          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Description
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
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

