'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Heading, Text, Card, Flex, Button } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { LLMReportButtons } from '../../LLMReportButtons';
import { createClient } from '@/lib/supabase/client';

export default function LLMPreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [commentsStatus, setCommentsStatus] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    checkUserRole();
    fetchReport();
  }, [params.id]);

  useEffect(() => {
    if (report && isAdmin) {
      fetchCommentsStatus();
    }
  }, [report, isAdmin]);

  const checkUserRole = async () => {
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

  const fetchCommentsStatus = async () => {
    try {
      // Fetch program-level comments
      const { data: reportData } = await supabase
        .from('reports')
        .select('comment_program_expert, comment_teaching_assistants, comment_learning_support')
        .eq('id', params.id)
        .single();

      // Fetch student-level comments
      const { data: studentComments } = await supabase
        .from('student_comments')
        .select('user_id, comment_program_expert, comment_teaching_assistants, comment_learning_support')
        .eq('report_id', params.id);

      const totalStudents = report?.performance_data?.length || 0;
      
      // Count program-level comments
      const programComments = {
        expert: !!reportData?.comment_program_expert,
        teaching: !!reportData?.comment_teaching_assistants,
        support: !!reportData?.comment_learning_support,
      };

      // Count student-level comments
      const studentsWithComments = new Set();
      const studentCommentsStats = {
        expert: 0,
        teaching: 0,
        support: 0,
      };

      if (studentComments) {
        studentComments.forEach((comment: any) => {
          if (comment.comment_program_expert) {
            studentsWithComments.add(comment.user_id);
            studentCommentsStats.expert++;
          }
          if (comment.comment_teaching_assistants) {
            studentsWithComments.add(comment.user_id);
            studentCommentsStats.teaching++;
          }
          if (comment.comment_learning_support) {
            studentsWithComments.add(comment.user_id);
            studentCommentsStats.support++;
          }
        });
      }

      setCommentsStatus({
        program: programComments,
        students: {
          total: totalStudents,
          withComments: studentsWithComments.size,
          stats: studentCommentsStats,
        },
      });
    } catch (error) {
      console.error('Failed to fetch comments status:', error);
    }
  };

  if (loading) {
    return (
      <AppLayoutWithAuth title="LLM Report Generation">
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
            <Heading size="8" mb="2">🤖 LLM Report Generation</Heading>
            <Text size="3" color="gray">Generate AI-powered manager and student reports</Text>
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

      {/* Expert Comments Recommendation */}
      <Card mb="4">
        <Flex direction="column" gap="3">
          <Box>
            <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>
              💡 Recommendation for Better Reports
            </Text>
            <Text size="2" color="gray" style={{ display: 'block' }}>
              For more comprehensive and personalized LLM reports, it is highly recommended to fill in expert comments before generation. Expert insights significantly improve the quality and relevance of AI-generated content.
            </Text>
          </Box>

          {/* Comments Status */}
          {commentsStatus && (
            <Box p="3" style={{ backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-2)' }}>
              <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                📊 Current Comments Status
              </Text>
              
              {/* Program-level comments */}
              <Box mb="3">
                <Text size="1" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>
                  Program-level Comments:
                </Text>
                <Flex gap="2" wrap="wrap">
                  <Text size="1" color={commentsStatus.program.expert ? 'green' : 'red'}>
                    {commentsStatus.program.expert ? '✅' : '❌'} Program Expert
                  </Text>
                  <Text size="1" color={commentsStatus.program.teaching ? 'green' : 'red'}>
                    {commentsStatus.program.teaching ? '✅' : '❌'} Teaching Assistants
                  </Text>
                  <Text size="1" color={commentsStatus.program.support ? 'green' : 'red'}>
                    {commentsStatus.program.support ? '✅' : '❌'} Learning Support
                  </Text>
                </Flex>
              </Box>

              {/* Student-level comments */}
              <Box>
                <Text size="1" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>
                  Individual Student Comments:
                </Text>
                <Text size="1" color="gray" style={{ display: 'block' }}>
                  {commentsStatus.students.withComments} of {commentsStatus.students.total} students have at least one comment
                </Text>
              </Box>
            </Box>
          )}

          <Button 
            size="2" 
            variant="soft"
            onClick={() => {
              const tab = searchParams.get('tab') || 'preview';
              router.push(`/reports/${params.id}/preview/comments?tab=${tab}`);
            }}
          >
            📝 Manage Expert Comments
          </Button>
        </Flex>
      </Card>

      {isAdmin ? (
        <LLMReportButtons reportId={params.id} isAdmin={isAdmin} />
      ) : (
        <Card>
          <Flex justify="center" align="center" p="6">
            <Text size="3" color="gray">Admin access required to generate LLM reports</Text>
          </Flex>
        </Card>
      )}
    </AppLayoutWithAuth>
  );
}
