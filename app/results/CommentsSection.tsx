'use client';

import { useState } from 'react';
import { Card, Flex, Heading, Text, Button, TextArea, Box } from '@radix-ui/themes';

interface CommentsSectionProps {
  reportId: string;
  isAdmin: boolean;
  initialComments: {
    programExpert: string | null;
    teachingAssistants: string | null;
    learningSupport: string | null;
  };
  onUpdate: (comments: any) => void;
}

export function CommentsSection({ reportId, isAdmin, initialComments, onUpdate }: CommentsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [programExpert, setProgramExpert] = useState(initialComments.programExpert || '');
  const [teachingAssistants, setTeachingAssistants] = useState(initialComments.teachingAssistants || '');
  const [learningSupport, setLearningSupport] = useState(initialComments.learningSupport || '');

  const hasAnyComment = initialComments.programExpert || initialComments.teachingAssistants || initialComments.learningSupport;

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_program_expert: programExpert,
          comment_teaching_assistants: teachingAssistants,
          comment_learning_support: learningSupport,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save comments');
      }

      const data = await response.json();
      onUpdate(data.report);
      setIsEditing(false);
    } catch (error: any) {
      alert(`Failed to save comments: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProgramExpert(initialComments.programExpert || '');
    setTeachingAssistants(initialComments.teachingAssistants || '');
    setLearningSupport(initialComments.learningSupport || '');
    setIsEditing(false);
  };

  if (!isAdmin && !hasAnyComment) {
    return null;
  }

  return (
    <Card mt="4">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="5">Team Comments</Heading>
          {isAdmin && !isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="soft">
              {hasAnyComment ? 'Edit Comments' : 'Add Comments'}
            </Button>
          )}
        </Flex>

        {isEditing ? (
          <>
            <Box>
              <Text as="div" size="2" weight="bold" mb="2">
                💼 Comment from Program Expert
              </Text>
              <TextArea
                value={programExpert}
                onChange={(e) => setProgramExpert(e.target.value)}
                placeholder="Add program expert's comment about team activity..."
                rows={3}
              />
            </Box>

            <Box>
              <Text as="div" size="2" weight="bold" mb="2">
                👨‍🏫 Comment from Teaching Assistants
              </Text>
              <TextArea
                value={teachingAssistants}
                onChange={(e) => setTeachingAssistants(e.target.value)}
                placeholder="Add teaching assistants' comment..."
                rows={3}
              />
            </Box>

            <Box>
              <Text as="div" size="2" weight="bold" mb="2">
                🎓 Comment from Learning Support
              </Text>
              <TextArea
                value={learningSupport}
                onChange={(e) => setLearningSupport(e.target.value)}
                placeholder="Add learning support comment..."
                rows={3}
              />
            </Box>

            <Flex gap="2" justify="end">
              <Button variant="soft" color="gray" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Comments'}
              </Button>
            </Flex>
          </>
        ) : (
          <>
            {initialComments.programExpert && (
              <Box>
                <Text as="div" size="2" weight="bold" mb="1">
                  💼 Program Expert
                </Text>
                <Text as="div" size="2" color="gray" style={{ whiteSpace: 'pre-wrap' }}>
                  {initialComments.programExpert}
                </Text>
              </Box>
            )}

            {initialComments.teachingAssistants && (
              <Box>
                <Text as="div" size="2" weight="bold" mb="1">
                  👨‍🏫 Teaching Assistants
                </Text>
                <Text as="div" size="2" color="gray" style={{ whiteSpace: 'pre-wrap' }}>
                  {initialComments.teachingAssistants}
                </Text>
              </Box>
            )}

            {initialComments.learningSupport && (
              <Box>
                <Text as="div" size="2" weight="bold" mb="1">
                  🎓 Learning Support
                </Text>
                <Text as="div" size="2" color="gray" style={{ whiteSpace: 'pre-wrap' }}>
                  {initialComments.learningSupport}
                </Text>
              </Box>
            )}
          </>
        )}
      </Flex>
    </Card>
  );
}

