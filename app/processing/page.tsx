'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, Flex, Text, Heading, Progress, Badge, Button, TextField, TextArea, Dialog } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { useAppContext } from '@/lib/context/AppContext';
import { processPerformanceSegmentation } from '@/lib/processors/performance-processor';
import { processDynamicSegmentation } from '@/lib/processors/dynamic-processor';

export default function ProcessingPage() {
  const router = useRouter();
  const { files, excludedUserIds, settings, setResults, setCurrentReportId } = useAppContext();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [processedResults, setProcessedResults] = useState<any>(null);

  useEffect(() => {
    processData();
  }, []);

  const addLog = (message: string) => {
    setLog(prev => [...prev, message]);
  };

  const processData = async () => {
    try {
      // Validate files
      if (!files.grade_book || !files.learners || !files.submissions) {
        throw new Error('Missing required files');
      }

      // Step 1: Merge data
      setCurrentStep('Merge data');
      setProgress(10);
      addLog('Merging uploaded files...');
      await delay(300);

      const gradeBook = files.grade_book.data;
      const learners = files.learners.data;
      const submissions = files.submissions.data;
      const meetings = files.meetings?.data;

      // Log exclusions
      if (excludedUserIds.length > 0) {
        addLog(`Excluding ${excludedUserIds.length} user IDs: ${excludedUserIds.join(', ')}`);
      } else {
        addLog('No user IDs excluded');
      }

      if (meetings) {
        const meetingCols = Object.keys(meetings[0] || {}).filter(col => 
          /^\[\d{2}\.\d{2}\.\d{4}\]/.test(col)
        );
        addLog(`Parsed ${meetingCols.length} meeting columns`);
      }

      // Step 2: Compute metrics
      setCurrentStep('Compute metrics');
      setProgress(30);
      addLog('Computing performance metrics...');
      await delay(300);

      const performanceData = processPerformanceSegmentation({
        gradeBook,
        learners,
        submissions,
        meetings,
        excludedUserIds,
        useMeetings: settings.useMeetingsInSegmentation,
      });

      addLog(`Processed ${performanceData.length} learners for performance segmentation`);

      // Step 3: Build curves
      setCurrentStep('Build curves');
      setProgress(60);
      addLog('Building activity curves from submissions...');
      await delay(300);

      const { summary: dynamicData, series: dynamicSeries } = processDynamicSegmentation({
        gradeBook,
        learners,
        submissions,
        meetings,
        excludedUserIds,
        includeMeetings: settings.includeMeetingsInActivity,
        alpha: settings.alpha,
        beta: settings.beta,
      });

      addLog(`Generated curves for ${dynamicData.length} learners`);

      // Step 4: Assign segments
      setCurrentStep('Assign segments');
      setProgress(90);
      addLog('Classifying segments...');
      await delay(300);

      const segmentCounts = performanceData.reduce((acc, row) => {
        acc[row.simple_segment] = (acc[row.simple_segment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      addLog(`Segments: ${Object.entries(segmentCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}`);

      const easingCounts = dynamicData.reduce((acc, row) => {
        acc[row.easing_label] = (acc[row.easing_label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      addLog(`Easing labels: ${Object.entries(easingCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}`);

      // Step 5: Complete
      setCurrentStep('Complete');
      setProgress(100);
      addLog('Analysis complete!');

      const results = {
        performanceData,
        dynamicData,
        dynamicSeries,
      };

      setResults(results);
      setProcessedResults(results);

      // Generate default title
      const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      setReportTitle(`Report - ${date}`);
      
      await delay(500);
      setShowSaveDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      addLog(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSaveReport = async () => {
    if (!reportTitle.trim()) {
      alert('Please enter a report title');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportTitle,
          description: reportDescription,
          performanceData: processedResults.performanceData,
          dynamicData: processedResults.dynamicData,
          dynamicSeries: processedResults.dynamicSeries,
          settings,
          excludedUserIds,
          fileMetadata: {
            gradeBook: files.grade_book?.name,
            learners: files.learners?.name,
            submissions: files.submissions?.name,
            meetings: files.meetings?.name,
            structure: files.structure?.name,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save report');
      }

      // Store report ID in context
      setCurrentReportId(data.report.id);
      setShowSaveDialog(false);
      router.push('/results');
    } catch (error: any) {
      alert(`Failed to save report: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSkipSave = () => {
    setShowSaveDialog(false);
    router.push('/results');
  };

  return (
    <AppLayoutWithAuth
      title="Crunching your data…"
      subtitle="Processing your files and computing segments."
    >
      <Card>
        <Flex direction="column" gap="4">
          <Box>
            <Flex justify="between" align="center" mb="2">
              <Text weight="bold">Processing steps</Text>
              <Badge color={error ? 'red' : progress === 100 ? 'green' : 'blue'}>
                {error ? 'Failed' : progress === 100 ? 'Complete' : 'Running'}
              </Badge>
            </Flex>
            <Progress value={progress} />
          </Box>

          <Box>
            <Heading size="3" mb="2">{currentStep}</Heading>
            <Flex direction="column" gap="1">
              <StepItem label="Merge data" done={progress >= 30} current={currentStep === 'Merge data'} />
              <StepItem label="Compute metrics" done={progress >= 60} current={currentStep === 'Compute metrics'} />
              <StepItem label="Build curves" done={progress >= 90} current={currentStep === 'Build curves'} />
              <StepItem label="Assign segments" done={progress === 100} current={currentStep === 'Assign segments'} />
            </Flex>
          </Box>

          <Box>
            <Text size="2" weight="bold" mb="2">Processing log</Text>
            <Box 
              style={{
                background: 'var(--gray-a2)',
                borderRadius: 'var(--radius-2)',
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: '12px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {log.map((line, idx) => (
                <Text key={idx} size="1" as="p" style={{ margin: '2px 0' }}>
                  {line}
                </Text>
              ))}
            </Box>
          </Box>

          {error && (
            <Card style={{ background: 'var(--red-a3)', border: '1px solid var(--red-a6)' }}>
              <Text color="red" weight="bold">
                {error}
              </Text>
              <Flex gap="2" mt="3">
                <Box onClick={() => router.push('/settings')} style={{ cursor: 'pointer' }}>
                  <Text size="2" color="red" style={{ textDecoration: 'underline' }}>
                    Go back to settings
                  </Text>
                </Box>
              </Flex>
            </Card>
          )}
        </Flex>
      </Card>

      <Dialog.Root open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Save Report</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Save this report to access it later from the Reports page.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Report Title *
              </Text>
              <TextField.Root
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Enter report title"
              />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Description (optional)
              </Text>
              <TextArea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Add notes about this report..."
                rows={3}
              />
            </label>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" onClick={handleSkipSave}>
                Skip & View Results
              </Button>
            </Dialog.Close>
            <Button onClick={handleSaveReport} disabled={saving}>
              {saving ? 'Saving...' : 'Save Report'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </AppLayoutWithAuth>
  );
}

function StepItem({ label, done, current }: { label: string; done: boolean; current: boolean }) {
  return (
    <Flex align="center" gap="2">
      <Badge color={done ? 'green' : current ? 'blue' : 'gray'} size="1">
        {done ? '✓' : current ? '⋯' : '○'}
      </Badge>
      <Text size="2" color={done ? 'green' : current ? 'blue' : 'gray'}>
        {label}
      </Text>
    </Flex>
  );
}

