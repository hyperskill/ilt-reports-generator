'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Heading, Text, Card, Flex, Button, Table, Badge, Select } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { createClient } from '@/lib/supabase/client';

interface SharedReport {
  id: string;
  title: string;
  report_type: 'manager' | 'student';
  user_id?: string;
  created_at: string;
  created_by: string;
  profiles?: {
    email: string;
  };
}

interface User {
  id: string;
  email: string;
  role: string;
}

export default function AccessManagementPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sharedReports, setSharedReports] = useState<SharedReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingSharedReports, setLoadingSharedReports] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, [params.id]);

  useEffect(() => {
    if (isAdmin) {
      loadSharedReports();
      loadUsers();
    }
  }, [isAdmin, params.id]);

  const checkAdminAndLoadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      setIsAdmin(profile?.role === 'admin');
    }
    
    setLoading(false);
  };

  const loadSharedReports = async () => {
    setLoadingSharedReports(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('shared_reports')
        .select('*')
        .eq('source_report_id', params.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading shared reports:', error);
      } else {
        setSharedReports(data || []);
      }
    } catch (error) {
      console.error('Error loading shared reports:', error);
    } finally {
      setLoadingSharedReports(false);
    }
  };

  const loadUsers = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .order('email');

    if (error) {
      console.error('Error loading users:', error);
    } else {
      setUsers(data || []);
    }
  };


  if (loading) {
    return (
      <AppLayoutWithAuth title="Access Management">
        <Card>
          <Text>Loading...</Text>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayoutWithAuth title="Access Management">
        <Card>
          <Flex justify="center" align="center" p="6">
            <Text size="3" color="gray">Admin access required to manage report access</Text>
          </Flex>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  return (
    <AppLayoutWithAuth>
      <Box mb="5">
        <Flex justify="between" align="start">
          <Box>
            <Heading size="8" mb="2">🔐 Manage Access</Heading>
            <Text size="3" color="gray">Control who can view and access your shared reports</Text>
          </Box>
          <Flex gap="2" align="center">
            <Button 
              variant="soft" 
              onClick={() => {
                const tab = searchParams.get('tab') || 'access';
                router.push(`/reports/${params.id}?tab=${tab}`);
              }}
            >
              ← Back to Report
            </Button>
          </Flex>
        </Flex>
      </Box>

      <Card>
        <Flex direction="column" gap="4">
          <Heading size="5">Shared Reports Access Control</Heading>
          <Text size="2" color="gray" mb="3">
            Manage permissions and access to your shared reports. Toggle between public and private access.
          </Text>
          
          {loadingSharedReports ? (
            <Flex justify="center" align="center" p="6">
              <Text color="gray">Loading shared reports...</Text>
            </Flex>
          ) : sharedReports.length === 0 ? (
            <Flex justify="center" align="center" p="6">
              <Text color="gray">No shared reports found. Create shared reports first to manage access.</Text>
            </Flex>
          ) : (
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Target User</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sharedReports.map((report) => (
                  <Table.Row key={report.id}>
                    <Table.Cell>
                      <Text weight="bold">{report.title}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={report.report_type === 'manager' ? 'blue' : 'green'}>
                        {report.report_type === 'manager' ? 'Manager' : 'Student'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      {report.user_id ? (
                        <Text size="2">{report.user_id}</Text>
                      ) : (
                        <Text size="2" color="gray">-</Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2">
                        <Button
                          size="1"
                          variant="outline"
                          onClick={() => router.push(`/reports/shared/${report.id}/view`)}
                        >
                          View
                        </Button>
                        <Button
                          size="1"
                          variant="outline"
                          onClick={() => router.push(`/reports/shared/${report.id}/edit`)}
                        >
                          Edit
                        </Button>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Flex>
      </Card>

      <Card>
        <Flex direction="column" gap="4">
          <Heading size="5">User Management</Heading>
          <Text size="2" color="gray" mb="3">
            View all users in the system and their roles.
          </Text>
          
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>User ID</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>
                    <Text weight="bold">{user.email}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={user.role === 'admin' ? 'red' : 'blue'}>
                      {user.role}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1" style={{ fontFamily: 'monospace', color: 'var(--gray-11)' }}>
                      {user.id}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Flex>
      </Card>
    </AppLayoutWithAuth>
  );
}
