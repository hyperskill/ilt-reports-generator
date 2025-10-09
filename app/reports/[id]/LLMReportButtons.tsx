'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Flex, Heading, Text, Button, Separator, Badge } from '@radix-ui/themes';
import { createClient } from '@/lib/supabase/client';

interface LLMReportButtonsProps {
  reportId: string;
  isAdmin: boolean;
}

export function LLMReportButtons({ reportId, isAdmin }: LLMReportButtonsProps) {
  const router = useRouter();
  const [generatingManager, setGeneratingManager] = useState(false);
  const [generatingStudent, setGeneratingStudent] = useState(false);
  const [managerReport, setManagerReport] = useState<any>(null);
  const [studentReportsCount, setStudentReportsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsStatus();
  }, [reportId]);

  const loadReportsStatus = async () => {
    try {
      const supabase = createClient();
      
      // Check manager report
      const { data: managerData } = await supabase
        .from('manager_reports')
        .select('id')
        .eq('report_id', reportId)
        .single();
      
      setManagerReport(managerData);

      // Count student reports
      const { count } = await supabase
        .from('student_reports')
        .select('*', { count: 'exact', head: true })
        .eq('report_id', reportId);
      
      setStudentReportsCount(count || 0);
    } catch (error) {
      console.error('Failed to load reports status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const handleGenerateManagerReport = async () => {
    setGeneratingManager(true);
    try {
      const response = await fetch('/api/llm/generate-manager-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate manager report');
      }

      const data = await response.json();
      
      // Redirect to manager report page
      router.push(`/reports/${reportId}/manager-report`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setGeneratingManager(false);
    }
  };

  const handleGenerateStudentReports = async () => {
    setGeneratingStudent(true);
    try {
      // Redirect to student reports management page
      router.push(`/reports/${reportId}/student-reports`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setGeneratingStudent(false);
    }
  };

  return (
    <Card mt="5">
      <Flex direction="column" gap="4">
        <Heading size="5">AI-Generated Reports</Heading>
        <Separator size="4" />
        
        <Text size="2" color="gray">
          Generate comprehensive reports using AI to summarize team and individual student performance.
        </Text>

        <Flex gap="3" wrap="wrap">
          <Button 
            size="3" 
            onClick={handleGenerateManagerReport}
            disabled={generatingManager}
            style={{ flex: 1, minWidth: '200px' }}
          >
            {generatingManager ? 'Generating...' : '🤖 Generate Manager Report'}
          </Button>

          <Button 
            size="3" 
            variant="soft"
            onClick={handleGenerateStudentReports}
            disabled={generatingStudent}
            style={{ flex: 1, minWidth: '200px' }}
          >
            {generatingStudent ? 'Opening...' : '📝 Generate Student Reports'}
          </Button>
        </Flex>

        {/* Links to existing reports */}
        {!loading && (managerReport || studentReportsCount > 0) && (
          <>
            <Separator size="4" />
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">Existing Reports:</Text>
              
              {managerReport && (
                <Flex align="center" gap="2">
                  <Button 
                    size="2" 
                    variant="ghost"
                    onClick={() => router.push(`/reports/${reportId}/manager-report`)}
                  >
                    📊 Manager Report
                  </Button>
                  <Badge color="green" size="1">Generated</Badge>
                </Flex>
              )}

              {studentReportsCount > 0 && (
                <Flex align="center" gap="2">
                  <Button 
                    size="2" 
                    variant="ghost"
                    onClick={() => router.push(`/reports/${reportId}/student-reports`)}
                  >
                    👥 Student Reports ({studentReportsCount})
                  </Button>
                </Flex>
              )}
            </Flex>
          </>
        )}

        <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
          💡 These reports are generated using AI and can be edited before sharing with managers or students.
        </Text>
      </Flex>
    </Card>
  );
}

