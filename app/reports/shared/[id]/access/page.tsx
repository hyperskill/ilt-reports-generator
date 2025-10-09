'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  Card,
  Spinner,
  TextField,
  Table,
  Badge,
  IconButton,
} from '@radix-ui/themes';
import { SharedReport } from '@/lib/types';

interface AccessRecord {
  id: string;
  user_id: string;
  granted_at: string;
  expires_at?: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export default function SharedReportAccessPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<SharedReport | null>(null);
  const [accessList, setAccessList] = useState<AccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isGranting, setIsGranting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch report
      const reportResponse = await fetch(`/api/reports/shared/${id}`);
      const reportData = await reportResponse.json();

      if (!reportResponse.ok) {
        throw new Error(reportData.error || 'Failed to fetch report');
      }

      if (!reportData.sharedReport.can_edit) {
        throw new Error('You do not have permission to manage access for this report');
      }

      setReport(reportData.sharedReport);

      // Fetch access list
      const accessResponse = await fetch(`/api/reports/shared/${id}/access`);
      const accessData = await accessResponse.json();

      if (accessResponse.ok) {
        setAccessList(accessData.access || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!newUserEmail.trim()) {
      alert('Please enter a user email');
      return;
    }

    setIsGranting(true);
    try {
      // First, find user by email
      const userResponse = await fetch(`/api/users/search?email=${encodeURIComponent(newUserEmail)}`);
      const userData = await userResponse.json();

      if (!userResponse.ok || !userData.user) {
        throw new Error('User not found with this email');
      }

      // Grant access
      const response = await fetch(`/api/reports/shared/${id}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: [userData.user.id],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grant access');
      }

      setNewUserEmail('');
      await fetchData();
      alert('Access granted successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke access for this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/shared/${id}/access`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: [userId],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke access');
      }

      await fetchData();
      alert('Access revoked successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <Container size="2" py="9">
        <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
          <Spinner size="3" />
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="2" py="9">
        <Box>
          <Heading size="6" mb="4">Error</Heading>
          <Text color="red">{error}</Text>
          <Button mt="4" onClick={() => router.back()}>Go Back</Button>
        </Box>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container size="2" py="9">
        <Text>Report not found</Text>
      </Container>
    );
  }

  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="5">
        {/* Header */}
        <Box>
          <Flex justify="between" align="center" mb="3">
            <Box>
              <Heading size="7" mb="2">Manage Access</Heading>
              <Text size="3" color="gray">{report.title}</Text>
            </Box>
            <Flex gap="2">
              <Button
                variant="soft"
                onClick={() => router.push(`/reports/shared/${id}/view`)}
              >
                View Report
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Back
              </Button>
            </Flex>
          </Flex>

          <Flex gap="2" align="center">
            <Text size="2" color="gray">
              {accessList.length} user{accessList.length !== 1 ? 's' : ''} with access
            </Text>
          </Flex>
        </Box>

        {/* Grant Access Form */}
        <Card>
          <Heading size="4" mb="3">Grant Access</Heading>
          <Text size="2" color="gray" mb="3">
            Add users by email address to give them access to this report
          </Text>
          <Flex gap="2">
            <TextField.Root
              placeholder="user@example.com"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGrantAccess()}
              style={{ flex: 1 }}
            />
            <Button
              onClick={handleGrantAccess}
              disabled={isGranting || !newUserEmail.trim()}
            >
              {isGranting ? 'Granting...' : 'Grant Access'}
            </Button>
          </Flex>
        </Card>

        {/* Access List */}
        <Card>
          <Heading size="4" mb="3">Users with Access</Heading>
          {accessList.length === 0 ? (
            <Text size="2" color="gray">No users have been granted access yet</Text>
          ) : (
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Granted</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {accessList.map((access) => (
                  <Table.Row key={access.id}>
                    <Table.Cell>
                      <Text size="2">{access.user?.email || 'Unknown'}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={access.user?.role === 'admin' ? 'red' : 'blue'} size="1">
                        {access.user?.role || 'user'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="1" color="gray">
                        {new Date(access.granted_at).toLocaleDateString()}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        size="1"
                        variant="soft"
                        color="red"
                        onClick={() => handleRevokeAccess(access.user_id)}
                      >
                        Revoke
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Card>
      </Flex>
    </Container>
  );
}
