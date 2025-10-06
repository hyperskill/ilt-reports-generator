'use client';

import { useState, useEffect } from 'react';
import { Card, Flex, Heading, Text, Button, TextArea, Box } from '@radix-ui/themes';
import { useAppContext } from '@/lib/context/AppContext';

interface StudentCommentsSectionProps {
  reportId: string | null;
  userId: string;
  isAdmin: boolean;
}

export function StudentCommentsSection({ reportId, userId, isAdmin }: StudentCommentsSectionProps) {
  const { studentComments, setStudentComment } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<any>(null);
  const [programExpert, setProgramExpert] = useState('');
  const [teachingAssistants, setTeachingAssistants] = useState('');
  const [learningSupport, setLearningSupport] = useState('');

  useEffect(() => {
    if (reportId) {
      loadComments();
    } else {
      // Load from context if no reportId (current session)
      const contextComment = studentComments?.[userId];
      if (contextComment) {
        setProgramExpert(contextComment.comment_program_expert || '');
        setTeachingAssistants(contextComment.comment_teaching_assistants || '');
        setLearningSupport(contextComment.comment_learning_support || '');
        setComments(contextComment);
      }
    }
  }, [reportId, userId, studentComments]);

  const loadComments = async () => {
    if (!reportId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/student-comments?reportId=${reportId}&userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        if (data.comments) {
          setProgramExpert(data.comments.comment_program_expert || '');
          setTeachingAssistants(data.comments.comment_teaching_assistants || '');
          setLearningSupport(data.comments.comment_learning_support || '');
        }
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('=== SAVING STUDENT COMMENTS ===');
    console.log('reportId:', reportId);
    console.log('userId:', userId);
    console.log('programExpert:', programExpert);
    console.log('teachingAssistants:', teachingAssistants);
    console.log('learningSupport:', learningSupport);

    setSaving(true);
    try {
      if (reportId) {
        console.log('Saving to database...');
        // Save to database if reportId exists
        const payload = {
          reportId,
          userId,
          comment_program_expert: programExpert,
          comment_teaching_assistants: teachingAssistants,
          comment_learning_support: learningSupport,
        };
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch('/api/student-comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error('Failed to save comments');
        }

        const data = await response.json();
        console.log('Success response:', data);
        setComments(data.comments);
        alert('Comments saved successfully!');
      } else {
        console.log('Saving to context (no reportId)...');
        // Save to context if no reportId (current session)
        const newComment = {
          userId,
          comment_program_expert: programExpert || undefined,
          comment_teaching_assistants: teachingAssistants || undefined,
          comment_learning_support: learningSupport || undefined,
        };
        console.log('Context comment:', newComment);
        setStudentComment(userId, newComment);
        setComments(newComment);
        alert('Comments saved to session!');
      }
      setIsEditing(false);
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Failed to save comments: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (comments) {
      setProgramExpert(comments.comment_program_expert || '');
      setTeachingAssistants(comments.comment_teaching_assistants || '');
      setLearningSupport(comments.comment_learning_support || '');
    } else {
      setProgramExpert('');
      setTeachingAssistants('');
      setLearningSupport('');
    }
    setIsEditing(false);
  };

  // Don't show if not admin and no comments exist
  if (!isAdmin && !comments) {
    return null;
  }

  const hasAnyComment = comments?.comment_program_expert || comments?.comment_teaching_assistants || comments?.comment_learning_support;

  if (loading) {
    return (
      <Card mt="4">
        <Text size="2" color="gray">Loading comments...</Text>
      </Card>
    );
  }

  return (
    <Card mt="4">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="5">Individual Feedback</Heading>
          {isAdmin && !isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="soft">
              {hasAnyComment ? 'Edit Feedback' : 'Add Feedback'}
            </Button>
          )}
        </Flex>

        {isEditing ? (
          <>
            <Box 
              p="3" 
              style={{ 
                background: 'var(--blue-a2)', 
                borderRadius: 'var(--radius-3)',
                border: '1px solid var(--blue-a4)'
              }}
            >
              <Text as="div" size="2" color="blue" style={{ lineHeight: '1.6' }}>
                💡 <strong>Feedback Guidance:</strong> Focus on <strong>personal observations</strong> about this student's activity and engagement. 
                Comment on their <strong>project work</strong> and its <strong>practical value</strong>. 
                Highlight the student's <strong>talents and abilities</strong> you've noticed. 
                Identify specific <strong>growth opportunities</strong> that could benefit their development.
              </Text>
            </Box>

            <Box>
              <Text as="div" size="2" weight="bold" mb="2">
                💼 Feedback from Program Expert
              </Text>
              <TextArea
                value={programExpert}
                onChange={(e) => setProgramExpert(e.target.value)}
                placeholder="Comment on student's project work quality and practical applicability. Note observed talents, technical abilities, and specific growth opportunities in their domain..."
                rows={4}
              />
            </Box>

            <Box>
              <Text as="div" size="2" weight="bold" mb="2">
                👨‍🏫 Feedback from Teaching Assistants
              </Text>
              <TextArea
                value={teachingAssistants}
                onChange={(e) => setTeachingAssistants(e.target.value)}
                placeholder="Share personal observations about student's activity patterns, engagement level, learning approach, and collaboration. Highlight strengths and areas for development..."
                rows={4}
              />
            </Box>

            <Box>
              <Text as="div" size="2" weight="bold" mb="2">
                🎓 Feedback from Learning Support
              </Text>
              <TextArea
                value={learningSupport}
                onChange={(e) => setLearningSupport(e.target.value)}
                placeholder="Describe student's personal qualities, motivation, resilience, and soft skills. Suggest growth opportunities for their overall development..."
                rows={4}
              />
            </Box>

            <Flex gap="2" justify="end">
              <Button variant="soft" color="gray" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Feedback'}
              </Button>
            </Flex>
          </>
        ) : (
          <>
            {!hasAnyComment ? (
              <Text size="2" color="gray">No feedback available yet.</Text>
            ) : (
              <>
                {comments?.comment_program_expert && (
                  <Box>
                    <Text as="div" size="2" weight="bold" mb="1">
                      💼 Program Expert
                    </Text>
                    <Text as="div" size="2" color="gray" style={{ whiteSpace: 'pre-wrap' }}>
                      {comments.comment_program_expert}
                    </Text>
                  </Box>
                )}

                {comments?.comment_teaching_assistants && (
                  <Box>
                    <Text as="div" size="2" weight="bold" mb="1">
                      👨‍🏫 Teaching Assistants
                    </Text>
                    <Text as="div" size="2" color="gray" style={{ whiteSpace: 'pre-wrap' }}>
                      {comments.comment_teaching_assistants}
                    </Text>
                  </Box>
                )}

                {comments?.comment_learning_support && (
                  <Box>
                    <Text as="div" size="2" weight="bold" mb="1">
                      🎓 Learning Support
                    </Text>
                    <Text as="div" size="2" color="gray" style={{ whiteSpace: 'pre-wrap' }}>
                      {comments.comment_learning_support}
                    </Text>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Flex>
    </Card>
  );
}

