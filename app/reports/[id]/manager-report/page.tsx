'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, Flex, Heading, Text, Button, TextArea, Badge, Separator } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { createClient } from '@/lib/supabase/client';
import ShareReportButton from '../../ShareReportButton';

export default function ManagerReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingComments, setSavingComments] = useState(false);
  const [commentsJustSaved, setCommentsJustSaved] = useState(false);
  const [managerReport, setManagerReport] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [skillsAcquired, setSkillsAcquired] = useState('');
  const [teamEngagement, setTeamEngagement] = useState('');
  const [expertObservations, setExpertObservations] = useState('');
  const [recommendations, setRecommendations] = useState('');
  
  // Expert comments
  const [commentProgramExpert, setCommentProgramExpert] = useState('');
  const [commentTeachingAssistants, setCommentTeachingAssistants] = useState('');
  const [commentLearningSupport, setCommentLearningSupport] = useState('');

  useEffect(() => {
    checkAdminAndLoadReport();
  }, [params.id]);

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
      const { data, error } = await supabase
        .from('manager_reports')
        .select('*')
        .eq('report_id', params.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading manager report:', error);
      }

      if (data) {
        setManagerReport(data);
        const content = data.edited_content || data.generated_content;
        setExecutiveSummary(content.executiveSummary || '');
        setSkillsAcquired(content.skillsAcquired || content.learningOutcomes || ''); // Fallback for old format
        setTeamEngagement(content.teamEngagement || content.groupDynamics || ''); // Fallback for old format
        setExpertObservations(content.expertObservations || '');
        setRecommendations(content.recommendations || content.opportunities || ''); // Fallback for old format
      }

      // Load program-level expert comments from reports table
      const { data: reportData } = await supabase
        .from('reports')
        .select('comment_program_expert, comment_teaching_assistants, comment_learning_support')
        .eq('id', params.id)
        .single();

      if (reportData) {
        setCommentProgramExpert(reportData.comment_program_expert || '');
        setCommentTeachingAssistants(reportData.comment_teaching_assistants || '');
        setCommentLearningSupport(reportData.comment_learning_support || '');
      }
    } catch (error) {
      console.error('Failed to load manager report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/llm/generate-manager-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: params.id }),
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

  const handleSaveComments = async () => {
    setSavingComments(true);
    setCommentsJustSaved(false);
    try {
      const response = await fetch(`/api/reports/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_program_expert: commentProgramExpert,
          comment_teaching_assistants: commentTeachingAssistants,
          comment_learning_support: commentLearningSupport,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save comments');
      }

      alert('Comments saved successfully! Consider regenerating the report to include these insights.');
      setCommentsJustSaved(true);
      await loadReport();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSavingComments(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      
      const editedContent = {
        executiveSummary,
        skillsAcquired,
        teamEngagement,
        expertObservations,
        recommendations,
      };

      const { error } = await supabase
        .from('manager_reports')
        .update({ edited_content: editedContent })
        .eq('report_id', params.id);

      if (error) {
        throw new Error(error.message);
      }

      alert('Report saved successfully!');
      await loadReport();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <AppLayoutWithAuth title="Manager Report">
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
            <Heading size="8" mb="2">Manager Report</Heading>
            <Text size="3" color="gray">AI-generated team performance summary</Text>
          </Box>
          <Flex gap="2" align="center">
            {managerReport && (
              <ShareReportButton
                reportType="manager"
                sourceReportId={params.id}
                isAdmin={isAdmin}
              />
            )}
            <Button variant="outline" onClick={() => router.back()}>
              ← Back
            </Button>
            <Button variant="soft" onClick={() => router.push(`/reports/${params.id}?tab=preview`)}>
              Back to Report
            </Button>
          </Flex>
        </Flex>

        {/* Expert Comments Information */}
        <Card>
          <Flex direction="column" gap="4">
            <Box p="3" style={{ 
              backgroundColor: 'var(--blue-2)',
              borderRadius: 'var(--radius-2)',
              border: '1px solid var(--blue-6)'
            }}>
              <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                💡 Better Reports with Expert Comments
              </Text>
              <Text size="2" style={{ display: 'block' }}>
                Manager LLM reports are significantly improved when Program Experts, Teaching Assistants, and Learning Support provide program-level comments. These insights help create more accurate and valuable reports for managers.
              </Text>
            </Box>

            {/* Comment Status */}
            <Box>
              <Text size="2" weight="bold" mb="3" style={{ display: 'block' }}>
                Program-Level Expert Comments Status
              </Text>
              <Flex gap="3" wrap="wrap">
                <Flex align="center" gap="2" p="2" style={{
                  backgroundColor: commentProgramExpert ? 'var(--green-2)' : 'var(--orange-2)',
                  borderRadius: 'var(--radius-2)',
                  border: `1px solid ${commentProgramExpert ? 'var(--green-6)' : 'var(--orange-6)'}`
                }}>
                  {commentProgramExpert ? '✅' : '❌'}
                  <Text size="2" weight="medium">Program Expert</Text>
                </Flex>
                
                <Flex align="center" gap="2" p="2" style={{
                  backgroundColor: commentTeachingAssistants ? 'var(--green-2)' : 'var(--orange-2)',
                  borderRadius: 'var(--radius-2)',
                  border: `1px solid ${commentTeachingAssistants ? 'var(--green-6)' : 'var(--orange-6)'}`
                }}>
                  {commentTeachingAssistants ? '✅' : '❌'}
                  <Text size="2" weight="medium">Teaching Assistants</Text>
                </Flex>
                
                <Flex align="center" gap="2" p="2" style={{
                  backgroundColor: commentLearningSupport ? 'var(--green-2)' : 'var(--orange-2)',
                  borderRadius: 'var(--radius-2)',
                  border: `1px solid ${commentLearningSupport ? 'var(--green-6)' : 'var(--orange-6)'}`
                }}>
                  {commentLearningSupport ? '✅' : '❌'}
                  <Text size="2" weight="medium">Learning Support</Text>
                </Flex>
              </Flex>
            </Box>
          </Flex>
        </Card>

        {!managerReport && (
          <Card>
            <Flex direction="column" gap="3" align="center" py="6">
              <Text size="3" color="gray">No manager report generated yet.</Text>
              <Button size="3" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating...' : '🤖 Generate Manager Report'}
              </Button>
            </Flex>
          </Card>
        )}

        {managerReport && (
          <>
            <Card>
              <Flex direction="column" gap="4">
                <Flex justify="between" align="center">
                  <Heading size="5">Executive Summary</Heading>
                </Flex>
                <TextArea
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="4">
                <Heading size="5">Skills Acquired & Learning Outcomes</Heading>
                <TextArea
                  value={skillsAcquired}
                  onChange={(e) => setSkillsAcquired(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="4">
                <Heading size="5">Team Engagement & Dynamics</Heading>
                <TextArea
                  value={teamEngagement}
                  onChange={(e) => setTeamEngagement(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="4">
                <Heading size="5">Expert Observations & Project Highlights</Heading>
                <TextArea
                  value={expertObservations}
                  onChange={(e) => setExpertObservations(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="4">
                <Heading size="5">Business Recommendations & Next Steps</Heading>
                <TextArea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            {isAdmin && (
              <Card>
                <Flex direction="column" gap="4">
                  <Heading size="5">Program-Level Expert Comments</Heading>
                  <Text size="2" color="gray" mb="2">
                    Add program-level comments from different expert roles. These will be included in the manager report generation.
                  </Text>
                  
                  <Flex direction="column" gap="3">
                    <Box>
                      <Text as="label" size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                        Program Expert Comments
                      </Text>
                      <TextArea
                        placeholder="Enter comments from the program expert..."
                        value={commentProgramExpert}
                        onChange={(e) => {
                          setCommentProgramExpert(e.target.value);
                          setCommentsJustSaved(false);
                        }}
                        rows={4}
                      />
                    </Box>

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                        Teaching Assistants Comments
                      </Text>
                      <TextArea
                        placeholder="Enter comments from teaching assistants..."
                        value={commentTeachingAssistants}
                        onChange={(e) => {
                          setCommentTeachingAssistants(e.target.value);
                          setCommentsJustSaved(false);
                        }}
                        rows={4}
                      />
                    </Box>

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                        Learning Support Comments
                      </Text>
                      <TextArea
                        placeholder="Enter comments from learning support..."
                        value={commentLearningSupport}
                        onChange={(e) => {
                          setCommentLearningSupport(e.target.value);
                          setCommentsJustSaved(false);
                        }}
                        rows={4}
                      />
                    </Box>
                  </Flex>

                  {/* Save Comments Button */}
                  <Flex gap="3" justify="end">
                    <Button onClick={handleSaveComments} disabled={savingComments} variant="soft">
                      {savingComments ? 'Saving...' : '💾 Save Comments'}
                    </Button>
                    {commentsJustSaved && (
                      <Button onClick={handleGenerate} disabled={generating} color="orange">
                        {generating ? 'Regenerating...' : '🔄 Regenerate Report'}
                      </Button>
                    )}
                  </Flex>
                </Flex>
              </Card>
            )}

            {isAdmin && (
              <Card>
                <Flex gap="3" justify="end">
                  <Button variant="soft" onClick={handleGenerate} disabled={generating}>
                    {generating ? 'Regenerating...' : '🔄 Regenerate'}
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save'}
                  </Button>
                  <ShareReportButton
                    reportType="manager"
                    sourceReportId={params.id}
                    isAdmin={isAdmin}
                  />
                </Flex>
              </Card>
            )}
          </>
        )}
      </Flex>
    </AppLayoutWithAuth>
  );
}

