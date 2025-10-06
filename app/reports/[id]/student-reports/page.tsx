'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, Flex, Heading, Text, Button, Badge, Table } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { createClient } from '@/lib/supabase/client';

export default function StudentReportsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [studentReports, setStudentReports] = useState<any[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Load base report
      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .eq('id', params.id)
        .single();

      setReport(reportData);

      // Load student reports
      const { data: studentReportsData } = await supabase
        .from('student_reports')
        .select('*')
        .eq('report_id', params.id);

      setStudentReports(studentReportsData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForStudent = async (userId: string, studentName: string, redirect: boolean = true) => {
    setGenerating(userId);
    try {
      const response = await fetch('/api/llm/generate-student-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: params.id, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate student report');
      }

      await loadData();
      
      // Navigate to student report edit page only if redirect is true
      if (redirect) {
        router.push(`/reports/${params.id}/student-reports/${userId}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateAll = async () => {
    if (!confirm(`Generate AI reports for all ${report.performance_data?.length || 0} students? This may take a few minutes.`)) {
      return;
    }

    setGenerating('batch');
    for (const student of report.performance_data || []) {
      await handleGenerateForStudent(student.user_id, student.name, false);
    }
    setGenerating(null);
    alert('All student reports generated successfully!');
  };

  const getStudentReport = (userId: string) => {
    return studentReports.find(sr => sr.user_id === userId);
  };

  if (loading) {
    return (
      <AppLayoutWithAuth title="Student Reports">
        <Card>
          <Text>Loading...</Text>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  return (
    <AppLayoutWithAuth>
      <Flex direction="column" gap="5">
        <Flex justify="between" align="start">
          <Box>
            <Heading size="8" mb="2">Student Reports</Heading>
            <Text size="3" color="gray">AI-generated personalized learning reports</Text>
          </Box>
          <Flex gap="2">
            <Button variant="soft" onClick={() => router.push(`/reports/${params.id}`)}>
              ← Back to Report
            </Button>
            <Button onClick={handleGenerateAll} disabled={!!generating}>
              {generating === 'batch' ? 'Generating...' : '🤖 Generate All'}
            </Button>
          </Flex>
        </Flex>

        <Card>
          <Flex direction="column" gap="4">
            <Heading size="5">Students ({report.performance_data?.length || 0})</Heading>
            
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Student</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>User ID</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {(report.performance_data || []).map((student: any) => {
                  const studentReport = getStudentReport(student.user_id);
                  const isGenerating = generating === student.user_id;
                  
                  return (
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
                        {studentReport ? (
                          <Flex gap="2">
                            <Badge color={studentReport.is_published ? 'green' : 'yellow'}>
                              {studentReport.is_published ? 'Published' : 'Draft'}
                            </Badge>
                            {studentReport.edited_content && (
                              <Badge color="blue">Edited</Badge>
                            )}
                          </Flex>
                        ) : (
                          <Badge color="gray">Not Generated</Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Flex gap="2">
                          {studentReport ? (
                            <Button 
                              size="1" 
                              variant="soft"
                              onClick={() => router.push(`/reports/${params.id}/student-reports/${student.user_id}`)}
                            >
                              Edit
                            </Button>
                          ) : (
                            <Button 
                              size="1"
                              onClick={() => handleGenerateForStudent(student.user_id, student.name)}
                              disabled={isGenerating}
                            >
                              {isGenerating ? 'Generating...' : 'Generate'}
                            </Button>
                          )}
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Flex>
        </Card>
      </Flex>
    </AppLayoutWithAuth>
  );
}

