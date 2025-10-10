'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as Accordion from '@radix-ui/react-accordion';
import { Box, Heading, Text, Card, Flex, Button, TextArea, Badge } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { CommentsSection } from '../../CommentsSection';
import { createClient } from '@/lib/supabase/client';
import styles from './comments.module.css';

export default function CommentsPreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [studentComments, setStudentComments] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkUserRole();
    fetchReport();
  }, [params.id]);

  useEffect(() => {
    if (isAdmin) {
      loadStudentComments();
    }
  }, [isAdmin, params.id]);

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

      // Load student comments
      if (isAdmin) {
        await loadStudentComments();
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentComments = async () => {
    const { data, error } = await supabase
      .from('student_comments')
      .select('*')
      .eq('report_id', params.id);

    if (error) {
      console.error('Error loading student comments:', error);
    } else {
      const commentsMap: Record<string, any> = {};
      if (data) {
        data.forEach((comment: any) => {
          commentsMap[comment.user_id] = comment;
        });
      }
      setStudentComments(commentsMap);
    }
  };

  const handleUpdate = async () => {
    await fetchReport();
  };

  const handleSaveStudentComments = async (userId: string, comments: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('student_comments')
        .upsert({
          report_id: params.id,
          user_id: userId,
          comment_program_expert: comments.comment_program_expert || '',
          comment_teaching_assistants: comments.comment_teaching_assistants || '',
          comment_learning_support: comments.comment_learning_support || '',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'report_id,user_id'
        });

      if (error) {
        console.error('Error saving student comments:', error);
        alert('Failed to save comments');
      } else {
        // Update local state
        setStudentComments(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            ...comments
          }
        }));
      }
    } catch (error) {
      console.error('Error saving student comments:', error);
      alert('Failed to save comments');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayoutWithAuth title="Expert Comments">
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
            <Heading size="8" mb="2">💬 Expert Comments</Heading>
            <Text size="3" color="gray">Add and manage expert comments for reports</Text>
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

      {isAdmin ? (
        <Flex direction="column" gap="5">
          {/* Program-level Expert Comments */}
          <Card>
            <Flex direction="column" gap="4">
              <Heading size="5">💬 Program-Level Expert Comments</Heading>
              <Text size="2" color="gray">
                Add comments that apply to the entire program and all students
              </Text>
              <CommentsSection
                reportId={params.id}
                isAdmin={isAdmin}
                initialComments={{
                  comment_program_expert: report.comment_program_expert,
                  comment_teaching_assistants: report.comment_teaching_assistants,
                  comment_learning_support: report.comment_learning_support,
                }}
                onUpdate={handleUpdate}
              />
            </Flex>
          </Card>

          {/* Individual Student Comments */}
          <Card>
            <Flex direction="column" gap="4">
              <Heading size="5">👤 Individual Student Comments</Heading>
              <Text size="2" color="gray">
                Add personalized comments for each student. These comments will be included in individual student reports.
              </Text>
              
              <Accordion.Root type="multiple" className={styles.accordionRoot}>
                {(report.performance_data || []).map((student: any) => {
                  const studentComment = studentComments[student.user_id] || {};
                  const hasComments = studentComment.comment_program_expert || 
                                    studentComment.comment_teaching_assistants || 
                                    studentComment.comment_learning_support;
                  
                  return (
                    <Accordion.Item 
                      key={student.user_id} 
                      value={student.user_id}
                      className={styles.accordionItem}
                    >
                      <Accordion.Trigger className={styles.accordionTrigger}>
                        <Flex justify="between" align="center" style={{ width: '100%' }}>
                          <Flex align="center" gap="2">
                            <Text weight="bold">{student.name}</Text>
                            <Text size="1" color="gray">({student.user_id})</Text>
                            {hasComments && <Badge color="green" size="1">✓ Has comments</Badge>}
                          </Flex>
                          <svg 
                            className={styles.chevron}
                            width="15" 
                            height="15" 
                            viewBox="0 0 15 15" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" 
                              fill="currentColor" 
                              fillRule="evenodd" 
                              clipRule="evenodd"
                            />
                          </svg>
                        </Flex>
                      </Accordion.Trigger>
                      <Accordion.Content className={styles.accordionContent}>
                        <StudentCommentForm
                          student={student}
                          comments={studentComment}
                          onSave={(comments) => handleSaveStudentComments(student.user_id, comments)}
                          saving={saving}
                        />
                      </Accordion.Content>
                    </Accordion.Item>
                  );
                })}
              </Accordion.Root>
            </Flex>
          </Card>
        </Flex>
      ) : (
        <Card>
          <Flex justify="center" align="center" p="6">
            <Text size="3" color="gray">Admin access required to manage expert comments</Text>
          </Flex>
        </Card>
      )}
    </AppLayoutWithAuth>
  );
}

// Student Comment Form Component
function StudentCommentForm({ 
  student, 
  comments, 
  onSave, 
  saving 
}: { 
  student: any; 
  comments: any; 
  onSave: (comments: any) => void; 
  saving: boolean; 
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    comment_program_expert: comments.comment_program_expert || '',
    comment_teaching_assistants: comments.comment_teaching_assistants || '',
    comment_learning_support: comments.comment_learning_support || '',
  });
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setFormData({
      comment_program_expert: comments.comment_program_expert || '',
      comment_teaching_assistants: comments.comment_teaching_assistants || '',
      comment_learning_support: comments.comment_learning_support || '',
    });
    setJustSaved(false);
  }, [comments]);

  const handleSave = async () => {
    await onSave(formData);
    setJustSaved(true);
  };

  const handleRegenerate = () => {
    // Navigate to the student's LLM report page
    const reportId = window.location.pathname.split('/')[2];
    router.push(`/reports/${reportId}/student-reports/${student.user_id}`);
  };

  return (
    <Flex direction="column" gap="4">
      <Flex direction="column" gap="3">
        <Box>
          <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>Program Expert Comments</Text>
          <TextArea
            placeholder="Add comments from the program expert for this student..."
            value={formData.comment_program_expert}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, comment_program_expert: e.target.value }));
              setJustSaved(false);
            }}
            rows={3}
          />
        </Box>

        <Box>
          <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>Teaching Assistants Comments</Text>
          <TextArea
            placeholder="Add comments from teaching assistants for this student..."
            value={formData.comment_teaching_assistants}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, comment_teaching_assistants: e.target.value }));
              setJustSaved(false);
            }}
            rows={3}
          />
        </Box>

        <Box>
          <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>Learning Support Comments</Text>
          <TextArea
            placeholder="Add comments from learning support for this student..."
            value={formData.comment_learning_support}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, comment_learning_support: e.target.value }));
              setJustSaved(false);
            }}
            rows={3}
          />
        </Box>
      </Flex>

      <Flex justify="end" gap="3">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="2"
          variant="soft"
        >
          {saving ? 'Saving...' : '💾 Save Comments'}
        </Button>
        {justSaved && (
          <Button 
            onClick={handleRegenerate}
            size="2"
            color="orange"
          >
            🔄 Regenerate Report
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
