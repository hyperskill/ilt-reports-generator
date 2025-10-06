'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, Flex, Heading, Text, Button, TextArea, Badge, Separator } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { createClient } from '@/lib/supabase/client';

export default function ManagerReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [managerReport, setManagerReport] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [groupDynamics, setGroupDynamics] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [expertObservations, setExpertObservations] = useState('');
  const [opportunities, setOpportunities] = useState('');

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
        setGroupDynamics(content.groupDynamics || '');
        setLearningOutcomes(content.learningOutcomes || '');
        setExpertObservations(content.expertObservations || '');
        setOpportunities(content.opportunities || '');
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      
      const editedContent = {
        executiveSummary,
        groupDynamics,
        learningOutcomes,
        expertObservations,
        opportunities,
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

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this report? It will be visible to managers.')) {
      return;
    }

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('manager_reports')
        .update({ is_published: true })
        .eq('report_id', params.id);

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
            {managerReport?.is_published && (
              <Badge color="green">Published</Badge>
            )}
            <Button variant="soft" onClick={() => router.push(`/reports/${params.id}`)}>
              ← Back to Report
            </Button>
          </Flex>
        </Flex>

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
                <Heading size="5">Group Dynamics & Engagement</Heading>
                <TextArea
                  value={groupDynamics}
                  onChange={(e) => setGroupDynamics(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="4">
                <Heading size="5">Learning Outcomes & Projects</Heading>
                <TextArea
                  value={learningOutcomes}
                  onChange={(e) => setLearningOutcomes(e.target.value)}
                  rows={6}
                  disabled={!isAdmin}
                />
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="4">
                <Heading size="5">Expert Observations</Heading>
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
                <Heading size="5">Opportunities & Recommendations</Heading>
                <TextArea
                  value={opportunities}
                  onChange={(e) => setOpportunities(e.target.value)}
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
                    disabled={managerReport.is_published}
                  >
                    {managerReport.is_published ? '✓ Published' : '📤 Publish'}
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

