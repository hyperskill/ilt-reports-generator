'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, Flex, Heading, Text, Button, TextArea, Badge } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { createClient } from '@/lib/supabase/client';
import ShareReportButton from '../../../ShareReportButton';

export default function StudentReportEditPage({ 
  params 
}: { 
  params: { id: string; userId: string } 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [studentReport, setStudentReport] = useState<any>(null);
  const [studentName, setStudentName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [learningJourney, setLearningJourney] = useState('');
  const [strengthsAchievements, setStrengthsAchievements] = useState('');
  const [skillsDevelopment, setSkillsDevelopment] = useState('');
  const [instructorFeedback, setInstructorFeedback] = useState('');
  const [growthOpportunities, setGrowthOpportunities] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  
  // Expert comments
  const [commentProgramExpert, setCommentProgramExpert] = useState('');
  const [commentTeachingAssistants, setCommentTeachingAssistants] = useState('');
  const [commentLearningSupport, setCommentLearningSupport] = useState('');

  useEffect(() => {
    checkAdminAndLoadReport();
  }, [params.id, params.userId]);

  const checkAdminAndLoadReport = async () => {
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

    await loadReport();
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Get student name from base report
      const { data: baseReport } = await supabase
        .from('reports')
        .select('performance_data')
        .eq('id', params.id)
        .single();
      
      const student = baseReport?.performance_data?.find((s: any) => s.user_id === params.userId);
      setStudentName(student?.name || 'Student');

      // Load student report
      const { data, error } = await supabase
        .from('student_reports')
        .select('*')
        .eq('report_id', params.id)
        .eq('user_id', params.userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading student report:', error);
      }

      if (data) {
        setStudentReport(data);
        const content = data.edited_content || data.generated_content;
        setLearningJourney(content.learningJourney || '');
        setStrengthsAchievements(content.strengthsAchievements || '');
        setSkillsDevelopment(content.skillsDevelopment || '');
        setInstructorFeedback(content.instructorFeedback || '');
        setGrowthOpportunities(content.growthOpportunities || '');
        setNextSteps(content.nextSteps || '');
      }

      // Load expert comments
      const { data: commentsData } = await supabase
        .from('student_comments')
        .select('*')
        .eq('report_id', params.id)
        .eq('user_id', params.userId)
        .single();

      if (commentsData) {
        setCommentProgramExpert(commentsData.comment_program_expert || '');
        setCommentTeachingAssistants(commentsData.comment_teaching_assistants || '');
        setCommentLearningSupport(commentsData.comment_learning_support || '');
      }
    } catch (error) {
      console.error('Failed to load student report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/llm/generate-student-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: params.id, userId: params.userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      await loadReport();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      
      const editedContent = {
        learningJourney,
        strengthsAchievements,
        skillsDevelopment,
        instructorFeedback,
        growthOpportunities,
        nextSteps,
      };

      const { error } = await supabase
        .from('student_reports')
        .update({ edited_content: editedContent })
        .eq('report_id', params.id)
        .eq('user_id', params.userId);

      if (error) {
        throw new Error(error.message);
      }

      // Save expert comments
      const { error: commentsError } = await supabase
        .from('student_comments')
        .upsert({
          report_id: params.id,
          user_id: params.userId,
          comment_program_expert: commentProgramExpert,
          comment_teaching_assistants: commentTeachingAssistants,
          comment_learning_support: commentLearningSupport,
        });

      if (commentsError) {
        throw new Error(commentsError.message);
      }

      alert('Report and comments saved successfully!');
      await loadReport();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this report? It will be visible to the student.')) {
      return;
    }

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('student_reports')
        .update({ is_published: true })
        .eq('report_id', params.id)
        .eq('user_id', params.userId);

      if (error) {
        throw new Error(error.message);
      }

      alert('Report published successfully!');
      await loadReport();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <AppLayoutWithAuth title="Student Report">
        <Card>
          <Text>Loading...</Text>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  return (
    <AppLayoutWithAuth>
      <Flex direction="column" gap="5" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Flex justify="between" align="start">
          <Box>
            <Heading size="8" mb="2">{studentName}&apos;s Learning Report</Heading>
            <Text size="3" color="gray">AI-generated personalized feedback</Text>
          </Box>
          <Flex gap="2" align="center">
            {studentReport?.is_published && (
              <Badge color="green">Published</Badge>
            )}
            {studentReport && (
              <ShareReportButton
                reportType="student"
                sourceReportId={params.id}
                userId={params.userId}
                studentName={studentName}
                isAdmin={isAdmin}
              />
            )}
            <Button variant="soft" onClick={() => router.push(`/reports/${params.id}/student-reports`)}>
              ← Back to List
            </Button>
          </Flex>
        </Flex>

        {!studentReport && (
          <Card>
            <Flex direction="column" gap="3" align="center" py="6">
              <Text size="3" color="gray">No report generated yet for this student.</Text>
              <Button size="3" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating...' : '🤖 Generate Student Report'}
              </Button>
            </Flex>
          </Card>
        )}

        {studentReport && (
          <>
            <Card>
              <Flex direction="column" gap="4">
                <Heading size="5">Your Learning Journey</Heading>
                <TextArea
                  value={learningJourney}
                  onChange={(e) => setLearningJourney(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="4">
                <Heading size="5">Your Strengths & Achievements</Heading>
                <TextArea
                  value={strengthsAchievements}
                  onChange={(e) => setStrengthsAchievements(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="4">
                <Heading size="5">Your Skills Development</Heading>
                <TextArea
                  value={skillsDevelopment}
                  onChange={(e) => setSkillsDevelopment(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="4">
                <Heading size="5">Feedback from Your Instructors</Heading>
                <TextArea
                  value={instructorFeedback}
                  onChange={(e) => setInstructorFeedback(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            {isAdmin && (
              <Card>
                <Flex direction="column" gap="4">
                  <Heading size="5">Expert Comments</Heading>
                  <Text size="2" color="gray" mb="2">
                    Add individual comments from different expert roles for this student.
                  </Text>
                  
                  <Flex direction="column" gap="3">
                    <Box>
                      <Text as="label" size="2" weight="bold" mb="2" display="block">
                        Program Expert Comments
                      </Text>
                      <TextArea
                        placeholder="Enter comments from the program expert..."
                        value={commentProgramExpert}
                        onChange={(e) => setCommentProgramExpert(e.target.value)}
                        rows={4}
                      />
                    </Box>

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="2" display="block">
                        Teaching Assistants Comments
                      </Text>
                      <TextArea
                        placeholder="Enter comments from teaching assistants..."
                        value={commentTeachingAssistants}
                        onChange={(e) => setCommentTeachingAssistants(e.target.value)}
                        rows={4}
                      />
                    </Box>

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="2" display="block">
                        Learning Support Comments
                      </Text>
                      <TextArea
                        placeholder="Enter comments from learning support..."
                        value={commentLearningSupport}
                        onChange={(e) => setCommentLearningSupport(e.target.value)}
                        rows={4}
                      />
                    </Box>
                  </Flex>
                </Flex>
              </Card>
            )}

            <Card>
              <Flex direction="column" gap="4">
                <Heading size="5">Opportunities for Growth</Heading>
                <TextArea
                  value={growthOpportunities}
                  onChange={(e) => setGrowthOpportunities(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="4">
                <Heading size="5">Next Steps & Recommendations</Heading>
                <TextArea
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            {isAdmin && (
              <Card>
                <Flex gap="3" justify="end">
                  <Button variant="soft" onClick={handleGenerate} disabled={generating}>
                    {generating ? 'Regenerating...' : '🔄 Regenerate'}
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save'}
                  </Button>
                  <Button 
                    color="green" 
                    onClick={handlePublish}
                    disabled={studentReport.is_published}
                  >
                    {studentReport.is_published ? '✓ Published' : '📤 Publish'}
                  </Button>
                </Flex>
              </Card>
            )}
          </>
        )}
      </Flex>
    </AppLayoutWithAuth>
  );
}

