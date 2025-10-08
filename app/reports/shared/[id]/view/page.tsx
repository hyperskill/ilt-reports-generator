'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Container, Heading, Text, Flex, Button, Card, Spinner, Badge } from '@radix-ui/themes';
import { SharedReport } from '@/lib/types';
import { BlockViewer } from './BlockViewer';
import styles from './view.module.css';

export default function SharedReportViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/shared/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setReport(data.sharedReport);
      setCanEdit(data.sharedReport.can_edit || false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <Heading size="6" mb="4">Access Denied</Heading>
          <Text color="red">{error}</Text>
          <Button mt="4" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
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

  const sortedBlocks = [...report.blocks].sort((a, b) => a.order - b.order);

  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="5">
        {/* Header */}
        <Box>
          <Flex justify="between" align="start" mb="3">
            <Box>
              <Flex gap="2" mb="2" align="center">
                <Badge color={report.report_type === 'manager' ? 'blue' : 'green'}>
                  {report.report_type === 'manager' ? '📊 Manager Report' : '👤 Student Report'}
                </Badge>
                {report.is_public && (
                  <Badge color="orange">🌐 Public</Badge>
                )}
              </Flex>
              <Heading size="8" mb="2">{report.title}</Heading>
              {report.description && (
                <Text size="3" color="gray">{report.description}</Text>
              )}
            </Box>
            
            <Flex gap="2">
              {canEdit && (
                <Button
                  onClick={() => router.push(`/reports/shared/${id}/edit`)}
                >
                  Edit Report
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Back
              </Button>
            </Flex>
          </Flex>

          <Text size="1" color="gray">
            Created: {new Date(report.created_at).toLocaleDateString()}
            {report.updated_at !== report.created_at && (
              <> • Updated: {new Date(report.updated_at).toLocaleDateString()}</>
            )}
          </Text>
        </Box>

        {/* Report Blocks */}
        <Flex direction="column" gap="4">
          {sortedBlocks.map((block) => (
            <Card key={block.id} className={styles.block}>
              <Heading size="5" mb="3">{block.title}</Heading>
              <Box className={styles.content}>
                <BlockViewer block={block} />
              </Box>
            </Card>
          ))}
        </Flex>

        {/* Footer */}
        <Card>
          <Flex justify="between" align="center">
            <Text size="2" color="gray">
              Report ID: {report.id}
            </Text>
            {canEdit && (
              <Button
                size="2"
                variant="soft"
                onClick={() => router.push(`/reports/shared/${id}/access`)}
              >
                Manage Access
              </Button>
            )}
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}
