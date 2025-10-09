'use client';

import { useState, useEffect } from 'react';
import { Button, Dialog, Flex, Text, Box, Badge, Spinner, Checkbox } from '@radix-ui/themes';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AccessRecord {
  id: string;
  user_id: string;
  granted_at: string;
  expires_at?: string;
  user?: User;
}

interface ShareReportDialogProps {
  reportId: string;
  reportTitle: string;
}

export default function ShareReportDialog({ reportId, reportTitle }: ShareReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [accessList, setAccessList] = useState<AccessRecord[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Load all users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, email, role')
        .order('email');
      
      setUsers(usersData || []);

      // Load current access list
      const response = await fetch(`/api/reports/shared/${reportId}/access`);
      const data = await response.json();
      
      if (data.success) {
        setAccessList(data.access || []);
        const currentUserIds = new Set<string>(data.access?.map((a: AccessRecord) => a.user_id) || []);
        setSelectedUserIds(currentUserIds);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get current access list user IDs
      const currentUserIds = new Set(accessList.map(a => a.user_id));
      
      // Find users to add and remove
      const usersToAdd = Array.from(selectedUserIds).filter(id => !currentUserIds.has(id));
      const usersToRemove = Array.from(currentUserIds).filter(id => !selectedUserIds.has(id));

      // Grant access to new users
      if (usersToAdd.length > 0) {
        const response = await fetch(`/api/reports/shared/${reportId}/access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: usersToAdd }),
        });

        if (!response.ok) {
          throw new Error('Failed to grant access');
        }
      }

      // Revoke access from removed users
      if (usersToRemove.length > 0) {
        const response = await fetch(`/api/reports/shared/${reportId}/access`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: usersToRemove }),
        });

        if (!response.ok) {
          throw new Error('Failed to revoke access');
        }
      }

      // Reload access list
      await loadData();
      alert('Access updated successfully!');
    } catch (error) {
      console.error('Error saving access:', error);
      alert('Failed to update access');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button size="2" variant="soft">
          🔗 Share Report
        </Button>
      </Dialog.Trigger>

      <Dialog.Content style={{ maxWidth: 600 }}>
        <Dialog.Title>Share Report</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Select users who can view "{reportTitle}"
        </Dialog.Description>

        {loading ? (
          <Flex justify="center" align="center" p="6">
            <Spinner size="3" />
          </Flex>
        ) : (
          <Flex direction="column" gap="4">
            <Box>
              <Text size="2" weight="bold" mb="2" as="div">
                Current Access: {accessList.length} user{accessList.length !== 1 ? 's' : ''}
              </Text>
              {accessList.length > 0 && (
                <Flex direction="column" gap="1">
                  {accessList.slice(0, 5).map((access) => (
                    <Text key={access.id} size="1" color="gray">
                      • {access.user?.email || access.user_id}
                    </Text>
                  ))}
                  {accessList.length > 5 && (
                    <Text size="1" color="gray">
                      ... and {accessList.length - 5} more
                    </Text>
                  )}
                </Flex>
              )}
            </Box>

            <Box 
              p="3" 
              style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                border: '1px solid var(--gray-6)',
                borderRadius: 'var(--radius-2)'
              }}
            >
              <Flex direction="column" gap="2">
                {users.map((user) => (
                  <label 
                    key={user.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px',
                      borderRadius: 'var(--radius-1)',
                      cursor: 'pointer',
                      backgroundColor: selectedUserIds.has(user.id) ? 'var(--blue-2)' : 'transparent'
                    }}
                  >
                    <Checkbox
                      checked={selectedUserIds.has(user.id)}
                      onCheckedChange={() => handleToggleUser(user.id)}
                    />
                    <Flex align="center" gap="2" style={{ flex: 1 }}>
                      <Text size="2">{user.email}</Text>
                      <Badge size="1" color={user.role === 'admin' ? 'red' : user.role === 'manager' ? 'blue' : 'gray'}>
                        {user.role}
                      </Badge>
                    </Flex>
                  </label>
                ))}
              </Flex>
            </Box>

            <Flex gap="3" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Flex>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

