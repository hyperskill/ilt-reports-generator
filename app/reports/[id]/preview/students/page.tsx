'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Heading, Text, Card, Flex, Button, Table, Badge } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';

export default function StudentsPreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'Highly engaged':
      case 'Highly efficient':
        return 'green';
      case 'Moderately engaged':
      case 'Moderately performing':
        return 'blue';
      case 'Highly effortful':
        return 'orange';
      case 'Low participation':
        return 'red';
      default:
        return 'gray';
    }
  };

  useEffect(() => {
    fetchReport();
  }, [params.id]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${params.id}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load report');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayoutWithAuth title="Personal Student Reports">
        <Card>
          <Text>Loading report...</Text>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  if (error || !report) {
    return (
      <AppLayoutWithAuth title="Error">
        <Card>
          <Text color="red">{error || 'Report not found'}</Text>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  return (
    <AppLayoutWithAuth>
      <Box mb="5">
        <Flex justify="between" align="start">
          <Box>
            <Heading size="8" mb="2">👤 Personal Student Reports</Heading>
            <Text size="3" color="gray">View individual student performance and reports</Text>
          </Box>
          <Flex gap="2" align="center">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
            >
              ← Back
            </Button>
            <Button 
              variant="soft" 
              onClick={() => {
                const tab = searchParams.get('tab') || 'preview';
                router.push(`/reports/${params.id}?tab=${tab}`);
              }}
            >
              Back to Report
            </Button>
          </Flex>
        </Flex>
      </Box>

      <Card>
        <Flex direction="column" gap="4">
          <Heading size="5">Students ({report.performance_data?.length || 0})</Heading>
          
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Student</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>User ID</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Segment</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {(report.performance_data || []).map((student: any) => (
                <Table.Row key={student.user_id}>
                  <Table.Cell>
                    <Text weight="bold">{student.name}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1" style={{ fontFamily: 'monospace', color: 'var(--gray-11)' }}>
                      {student.user_id}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={getSegmentColor(student.simple_segment || 'Unknown')}>
                      {student.simple_segment || 'Unknown'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2" weight="bold">{student.total_pct}%</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2">
                      <Button 
                        size="1" 
                        variant="outline"
                        onClick={() => {
                          const tab = searchParams.get('tab') || 'preview';
                          router.push(`/student/${student.user_id}?reportId=${params.id}&tab=${tab}`);
                        }}
                      >
                        View Report
                      </Button>
                    </Flex>
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
