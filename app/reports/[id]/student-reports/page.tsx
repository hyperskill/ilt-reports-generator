'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Card, Flex, Heading, Text, Button, Badge, Table } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { createClient } from '@/lib/supabase/client';

export default function StudentReportsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [studentReports, setStudentReports] = useState<any[]>([]);
  const [studentComments, setStudentComments] = useState<any[]>([]);
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

      // Load student comments
      const { data: studentCommentsData } = await supabase
        .from('student_comments')
        .select('*')
        .eq('report_id', params.id);

      setStudentComments(studentCommentsData || []);
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

  const getStudentComments = (userId: string) => {
    return studentComments.find(sc => sc.user_id === userId);
  };

  const getCommentLabels = (userId: string) => {
    const comments = getStudentComments(userId);
    if (!comments) return [];
    
    const labels = [];
    if (comments.comment_program_expert) labels.push('Expert');
    if (comments.comment_teaching_assistants) labels.push('TA');
    if (comments.comment_learning_support) labels.push('Support');
    
    return labels;
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
            <Button 
              variant="soft" 
              onClick={() => {
                const tab = searchParams.get('tab') || 'preview';
                router.push(`/reports/${params.id}?tab=${tab}`);
              }}
            >
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
            
            <Box p="3" style={{ 
              backgroundColor: 'var(--blue-2)',
              borderRadius: 'var(--radius-2)',
              border: '1px solid var(--blue-6)'
            }}>
              <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                💡 Tip: Better LLM Reports with Expert Comments
              </Text>
              <Text size="2" style={{ display: 'block' }}>
                Student LLM reports are significantly improved when Program Experts, Teaching Assistants, and Learning Support provide personalized comments. These insights help create more accurate and valuable reports for each student.
              </Text>
            </Box>
            
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Student</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>User ID</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Comments</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {(report.performance_data || []).map((student: any) => {
                  const studentReport = getStudentReport(student.user_id);
                  const isGenerating = generating === student.user_id;
                  const commentLabels = getCommentLabels(student.user_id);
                  
                  return (
                    <Table.Row key={student.user_id}>
                      <Table.Cell>
                        <Button
                          variant="ghost"
                          size="1"
                          onClick={() => {
                            const tab = searchParams.get('tab') || 'preview';
                            router.push(`/student/${student.user_id}?reportId=${params.id}&tab=${tab}`);
                          }}
                          style={{ 
                            padding: 0, 
                            height: 'auto', 
                            fontWeight: 'bold',
                            textDecoration: 'underline',
                            color: 'var(--blue-11)'
                          }}
                        >
                          {student.name}
                        </Button>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="1" style={{ fontFamily: 'monospace', color: 'var(--gray-11)' }}>
                          {student.user_id}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        {commentLabels.length > 0 ? (
                          <Flex gap="1" wrap="wrap">
                            {commentLabels.map((label) => (
                              <Badge key={label} color="green" size="1">
                                {label}
                              </Badge>
                            ))}
                          </Flex>
                        ) : (
                          <Text size="1" color="gray">No comments</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {studentReport ? (
                          <Flex gap="2">
                            <Badge color="green">Generated</Badge>
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
                              onClick={() => {
                                const tab = searchParams.get('tab') || 'preview';
                                router.push(`/reports/${params.id}/student-reports/${student.user_id}?tab=${tab}`);
                              }}
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

