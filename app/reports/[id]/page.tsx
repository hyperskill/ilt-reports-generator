'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Heading, Text, Tabs, Card, Flex, Badge } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { PerformanceResults } from '@/app/components/PerformanceResults';
import { DynamicResults } from '@/app/components/DynamicResults';

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

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
      <AppLayoutWithAuth title="Loading..." subtitle="Fetching report data">
        <Card>
          <Text>Loading report...</Text>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  if (error || !report) {
    return (
      <AppLayoutWithAuth title="Error" subtitle="Failed to load report">
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
            <Heading size="8" mb="2">{report.title}</Heading>
            {report.description && (
              <Text size="3" color="gray">{report.description}</Text>
            )}
          </Box>
          <Badge color="green">Saved Report</Badge>
        </Flex>
        <Flex gap="2" mt="2">
          <Text size="2" color="gray">
            Created: {new Date(report.created_at).toLocaleString()}
          </Text>
        </Flex>
      </Box>

      <Tabs.Root defaultValue="performance">
        <Tabs.List>
          <Tabs.Trigger value="performance">Performance Segmentation</Tabs.Trigger>
          <Tabs.Trigger value="dynamic">Dynamic/Easing Segmentation</Tabs.Trigger>
        </Tabs.List>

        <Box pt="4">
          <Tabs.Content value="performance">
            <PerformanceResults data={report.performance_data} />
          </Tabs.Content>

          <Tabs.Content value="dynamic">
            <DynamicResults 
              summaryData={report.dynamic_data} 
              seriesData={report.dynamic_series || []}
            />
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </AppLayoutWithAuth>
  );
}

