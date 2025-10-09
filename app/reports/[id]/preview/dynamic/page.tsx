'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Heading, Text, Card, Flex, Button } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { DynamicResults } from '@/app/components/DynamicResults';

export default function DynamicPreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      <AppLayoutWithAuth title="Dynamic/Easing Segmentation">
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
            <Heading size="8" mb="2">📊 Dynamic/Easing Segmentation</Heading>
            <Text size="3" color="gray">View activity patterns and temporal analysis</Text>
          </Box>
          <Flex gap="2" align="center">
            <Button 
              variant="soft" 
              onClick={() => {
                const tab = searchParams.get('tab') || 'preview';
                router.push(`/reports/${params.id}?tab=${tab}`);
              }}
            >
              ← Back to Report
            </Button>
          </Flex>
        </Flex>
      </Box>

      <DynamicResults 
        summary={report.dynamic_data} 
        series={report.dynamic_series || []}
        reportId={params.id}
        submissions={report.submissions_data || []}
        structure={report.structure_data || []}
        courseId={report.structure_data?.[0]?.course_id || report.structure_data?.[0]?.courseid}
        meetings={report.meetings_data || []}
      />
    </AppLayoutWithAuth>
  );
}
