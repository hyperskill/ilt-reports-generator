'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Box, Card, Heading, Text, Button, Flex } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { createClient } from '@/lib/supabase/client';
import { CertificatesManagement } from '../../CertificatesManagement';

export default function CertificatesManagementPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const reportId = params.id as string;
  const tab = searchParams.get('tab') || 'preview';
  
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadReport();
  }, [reportId]);

  const checkAdminStatus = async () => {
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
  };

  const loadReport = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayoutWithAuth title="Loading...">
        <Card>
          <Text>Loading...</Text>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayoutWithAuth title="Access Denied">
        <Card>
          <Text color="red">Admin access required</Text>
          <Button mt="3" onClick={() => router.back()}>Go Back</Button>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  if (!report) {
    return (
      <AppLayoutWithAuth title="Report Not Found">
        <Card>
          <Text>Report not found</Text>
          <Button mt="3" onClick={() => router.back()}>Go Back</Button>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  return (
    <AppLayoutWithAuth>
      <Box mb="5">
        <Flex justify="between" align="start" mb="4">
          <Box>
            <Heading size="8" mb="2">🎓 Student Certificates</Heading>
            <Text size="3" color="gray">
              Manage certificate links for all students in {report.title}
            </Text>
          </Box>
          <Button 
            variant="soft" 
            onClick={() => router.push(`/reports/${reportId}?tab=${tab}`)}
          >
            ← Back to Report
          </Button>
        </Flex>
      </Box>

      <CertificatesManagement 
        reportId={reportId}
        performanceData={report.performance_data}
      />
    </AppLayoutWithAuth>
  );
}

