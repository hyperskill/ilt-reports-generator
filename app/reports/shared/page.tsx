'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Heading,
  Text,
  Flex,
  Button,
  Card,
  Spinner,
  Table,
  Badge,
} from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';

interface SharedReportListItem {
  id: string;
  report_type: 'manager' | 'student';
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  access_count: number;
  user_id?: string;
}

export default function SharedReportsListPage() {
  const router = useRouter();
  const [reports, setReports] = useState<SharedReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports/shared/list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reports');
      }

      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayoutWithAuth title="Shared Reports">
        <Container size="3" py="9">
          <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
            <Spinner size="3" />
          </Flex>
        </Container>
      </AppLayoutWithAuth>
    );
  }

  if (error) {
    return (
      <AppLayoutWithAuth title="Shared Reports">
        <Container size="3" py="6">
          <Card>
            <Text color="red">{error}</Text>
          </Card>
        </Container>
      </AppLayoutWithAuth>
    );
  }

  return (
    <AppLayoutWithAuth title="Shared Reports">
      <Container size="4" py="6">
        <Flex direction="column" gap="5">
          <Flex justify="between" align="center">
            <div>
              <Heading size="8" mb="2">Shared Reports</Heading>
              <Text size="3" color="gray">
                Manage and share your reports with customizable blocks
              </Text>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
          </Flex>

          {reports.length === 0 ? (
            <Card>
              <Flex direction="column" gap="3" align="center" py="6">
                <Text size="3" color="gray">No shared reports yet</Text>
                <Text size="2" color="gray">
                  Create a shared report from any Manager or Student report
                </Text>
              </Flex>
            </Card>
          ) : (
            <Card>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Access</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Updated</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {reports.map((report) => (
                    <Table.Row key={report.id}>
                      <Table.Cell>
                        <Flex direction="column" gap="1">
                          <Text weight="bold">{report.title}</Text>
                          {report.description && (
                            <Text size="1" color="gray">{report.description}</Text>
                          )}
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={report.report_type === 'manager' ? 'blue' : 'green'}>
                          {report.report_type === 'manager' ? '📊 Manager' : '👤 Student'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2">{report.access_count} users</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="1" color="gray">
                          {new Date(report.updated_at).toLocaleDateString()}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex gap="1">
                          <Button
                            size="1"
                            variant="soft"
                            onClick={() => router.push(`/reports/shared/${report.id}/view`)}
                          >
                            View
                          </Button>
                          <Button
                            size="1"
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
            </Card>
          )}
        </Flex>
      </Container>
    </AppLayoutWithAuth>
  );
}
