'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { GeneralReportSettings } from '@/app/components/GeneralReportSettings';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
      <AppLayoutWithAuth>
        <Text>Loading...</Text>
      </AppLayoutWithAuth>
    );
  }

  if (error || !report) {
    return (
      <AppLayoutWithAuth>
        <Text color="red">{error || 'Report not found'}</Text>
      </AppLayoutWithAuth>
    );
  }

  return (
    <AppLayoutWithAuth>
      <Box mb="5">
        <Flex justify="between" align="start">
          <Box>
            <Heading size="8" mb="2">⚙️ General Report Settings</Heading>
            <Text size="3" color="gray">
              Manage report metadata and define learning outcomes for each module
            </Text>
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
              onClick={() => router.push(`/reports/${params.id}?tab=preview`)}
            >
              Back to Report
            </Button>
          </Flex>
        </Flex>
      </Box>

      <GeneralReportSettings
        reportId={params.id}
        initialTitle={report.title}
        initialDescription={report.description}
        structureData={report.structure_data}
        onTitleChange={(newTitle) => {
          setReport({ ...report, title: newTitle });
        }}
        onDescriptionChange={(newDesc) => {
          setReport({ ...report, description: newDesc });
        }}
      />
    </AppLayoutWithAuth>
  );
}

