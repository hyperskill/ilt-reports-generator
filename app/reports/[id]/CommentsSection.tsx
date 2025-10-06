'use client';

import { useState } from 'react';
import { Card, Flex, Heading, Text, TextArea, Button, Box } from '@radix-ui/themes';

interface CommentsSectionProps {
  reportId: string;
  isAdmin: boolean;
  initialComments: {
    comment_program_expert?: string;
    comment_teaching_assistants?: string;
    comment_learning_support?: string;
  };
  onUpdate?: () => void;
}

export function CommentsSection({ 
  reportId, 
  isAdmin, 
  initialComments,
  onUpdate 
}: CommentsSectionProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState({
    comment_program_expert: initialComments.comment_program_expert || '',
    comment_teaching_assistants: initialComments.comment_teaching_assistants || '',
    comment_learning_support: initialComments.comment_learning_support || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comments),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save comments');
      }

      setEditing(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      alert(`Failed to save comments: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setComments({
      comment_program_expert: initialComments.comment_program_expert || '',
      comment_teaching_assistants: initialComments.comment_teaching_assistants || '',
      comment_learning_support: initialComments.comment_learning_support || '',
    });
    setEditing(false);
  };

  const hasAnyComments = 
    initialComments.comment_program_expert ||
    initialComments.comment_teaching_assistants ||
    initialComments.comment_learning_support;

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="5">Team Comments</Heading>
          {isAdmin && !editing && (
            <Button variant="soft" onClick={() => setEditing(true)}>
              {hasAnyComments ? 'Edit Comments' : 'Add Comments'}
            </Button>
          )}
          {isAdmin && editing && (
            <Flex gap="2">
              <Button variant="soft" color="gray" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Comments'}
              </Button>
            </Flex>
          )}
        </Flex>

        <Flex direction="column" gap="4">
          {editing && (
            <Box 
              p="3" 
              style={{ 
                background: 'var(--blue-a2)', 
                borderRadius: 'var(--radius-3)',
                border: '1px solid var(--blue-a4)'
              }}
            >
              <Text as="div" size="2" color="blue" style={{ lineHeight: '1.6' }}>
                💡 <strong>Guidance for Comments:</strong> Please focus on the team's overall dynamics, 
                final projects and their practical applicability, general atmosphere, and collaboration patterns. 
                Highlight any notable <strong>gaps and opportunities</strong> you observed that could benefit this team's growth.
              </Text>
            </Box>
          )}

          {/* Program Expert Comment */}
          <Box>
            <Text as="div" size="3" weight="bold" mb="2">
              💼 Comment from Program Expert about team activity
            </Text>
            {editing ? (
              <TextArea
                value={comments.comment_program_expert}
                onChange={(e) => setComments({
                  ...comments,
                  comment_program_expert: e.target.value
                })}
                placeholder="Share insights on team dynamics, project quality, practical outcomes, and key opportunities for improvement..."
                rows={4}
                style={{ width: '100%' }}
              />
            ) : (
              <Text size="2" color="gray" style={{ whiteSpace: 'pre-wrap' }}>
                {initialComments.comment_program_expert || '—'}
              </Text>
            )}
          </Box>

          {/* Teaching Assistants Comment */}
          <Box>
            <Text as="div" size="3" weight="bold" mb="2">
              👨‍🏫 Comment from Teaching Assistants
            </Text>
            {editing ? (
              <TextArea
                value={comments.comment_teaching_assistants}
                onChange={(e) => setComments({
                  ...comments,
                  comment_teaching_assistants: e.target.value
                })}
                placeholder="Describe team collaboration, learning atmosphere, engagement patterns, and areas needing attention..."
                rows={4}
                style={{ width: '100%' }}
              />
            ) : (
              <Text size="2" color="gray" style={{ whiteSpace: 'pre-wrap' }}>
                {initialComments.comment_teaching_assistants || '—'}
              </Text>
            )}
          </Box>

          {/* Learning Support Comment */}
          <Box>
            <Text as="div" size="3" weight="bold" mb="2">
              🎓 Comment from Learning Support
            </Text>
            {editing ? (
              <TextArea
                value={comments.comment_learning_support}
                onChange={(e) => setComments({
                  ...comments,
                  comment_learning_support: e.target.value
                })}
                placeholder="Note student well-being, support effectiveness, team morale, and potential growth opportunities..."
                rows={4}
                style={{ width: '100%' }}
              />
            ) : (
              <Text size="2" color="gray" style={{ whiteSpace: 'pre-wrap' }}>
                {initialComments.comment_learning_support || '—'}
              </Text>
            )}
          </Box>
        </Flex>
      </Flex>
    </Card>
  );
}

