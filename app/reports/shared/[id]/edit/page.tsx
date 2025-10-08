'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Container, Heading, Text, Flex, Button, Spinner } from '@radix-ui/themes';
import ReportBuilder from './ReportBuilder';
import { SharedReport, ReportBlock } from '@/lib/types';

export default function SharedReportEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      if (!data.sharedReport.can_edit) {
        setError('You do not have permission to edit this report');
        return;
      }

      setReport(data.sharedReport);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (blocks: ReportBlock[], title: string, description?: string) => {
    try {
      const response = await fetch(`/api/reports/shared/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks, title, description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      setReport(data.sharedReport);
      return true;
    } catch (err: any) {
      console.error('Error saving report:', err);
      return false;
    }
  };

  const handlePublish = async () => {
    if (!report) return;

    const newPublicState = !report.is_public;
    const confirmed = confirm(
      newPublicState
        ? 'Make this report public? Anyone with the link will be able to view it.'
        : 'Make this report private? Only users with explicit access can view it.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/reports/shared/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: newPublicState }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update');
      }

      setReport(data.sharedReport);
    } catch (err: any) {
      console.error('Error updating public status:', err);
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
    <Container size="4" py="6">
      <Flex direction="column" gap="4" mb="6">
        <Flex justify="between" align="center">
          <Box>
            <Heading size="7" mb="2">Edit Shared Report</Heading>
            <Text size="2" color="gray">
              {report.report_type === 'manager' ? '📊 Manager Report' : '👤 Student Report'}
              {report.user_id && <> • Student ID: {report.user_id}</>}
            </Text>
          </Box>
          <Flex gap="2">
            <Button
              variant="soft"
              onClick={() => router.push(`/reports/shared/${id}/access`)}
            >
              Manage Access
            </Button>
            <Button
              variant="soft"
              onClick={() => router.push(`/reports/shared/${id}/view`)}
            >
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Back
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <ReportBuilder
        initialBlocks={report.blocks}
        reportTitle={report.title}
        reportDescription={report.description}
        onSave={handleSave}
        onPublish={handlePublish}
        isPublic={report.is_public}
      />
    </Container>
  );
}
