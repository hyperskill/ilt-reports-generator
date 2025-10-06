'use client';

import { useState, useEffect } from 'react';
import { Box, Card, Flex, Heading, Text, Tabs } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { useAppContext } from '@/lib/context/AppContext';
import { PerformanceResults } from '@/app/components/PerformanceResults';
import { DynamicResults } from '@/app/components/DynamicResults';
import { CommentsSection } from './CommentsSection';
import { createClient } from '@/lib/supabase/client';

export default function ResultsPage() {
  const { results, currentMode, setCurrentMode, currentReportId } = useAppContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [reportComments, setReportComments] = useState<any>(null);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    if (currentReportId) {
      loadReportComments();
    }
  }, [currentReportId]);

  const checkAdminStatus = async () => {
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
  };

  const loadReportComments = async () => {
    if (!currentReportId) return;
    
    setLoadingComments(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('reports')
        .select('comment_program_expert, comment_teaching_assistants, comment_learning_support')
        .eq('id', currentReportId)
        .single();

      if (!error && data) {
        setReportComments(data);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentsUpdate = (updatedReport: any) => {
    setReportComments({
      comment_program_expert: updatedReport.comment_program_expert,
      comment_teaching_assistants: updatedReport.comment_teaching_assistants,
      comment_learning_support: updatedReport.comment_learning_support,
    });
  };

  if (!results) {
    return (
      <AppLayoutWithAuth title="Results">
        <Card>
          <Text>No results available. Please process your data first.</Text>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  return (
    <AppLayoutWithAuth>
      <Box mb="5">
        <Heading size="8" mb="2">Analysis Results</Heading>
        <Text size="3" color="gray">
          Switch between performance analysis and activity over time analysis.
        </Text>
        <Text size="2" color="gray" mt="1">
          💡 All metrics are automatically calculated from your student submission data
        </Text>
      </Box>

      <Tabs.Root value={currentMode} onValueChange={(value) => setCurrentMode(value as 'performance' | 'dynamic')}>
        <Tabs.List>
          <Tabs.Trigger value="performance">
            <Flex align="center" gap="2">
              📊 Performance Analysis
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="dynamic">
            <Flex align="center" gap="2">
              📈 Activity Analysis
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Box pt="4">
          <Tabs.Content value="performance">
            <PerformanceResults data={results.performanceData} />
          </Tabs.Content>

          <Tabs.Content value="dynamic">
            <DynamicResults 
              summary={results.dynamicData}
              series={results.dynamicSeries}
            />
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      {currentReportId && reportComments && !loadingComments && (
        <CommentsSection
          reportId={currentReportId}
          isAdmin={isAdmin}
          initialComments={{
            programExpert: reportComments.comment_program_expert,
            teachingAssistants: reportComments.comment_teaching_assistants,
            learningSupport: reportComments.comment_learning_support,
          }}
          onUpdate={handleCommentsUpdate}
        />
      )}
    </AppLayoutWithAuth>
  );
}

