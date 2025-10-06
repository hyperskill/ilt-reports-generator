'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, Flex, Text, Heading, Progress, Badge } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { useAppContext } from '@/lib/context/AppContext';
import { processPerformanceSegmentation } from '@/lib/processors/performance-processor';
import { processDynamicSegmentation } from '@/lib/processors/dynamic-processor';

export default function ProcessingPage() {
  const router = useRouter();
  const { files, excludedUserIds, settings, setResults } = useAppContext();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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

      setResults({
        performanceData,
        dynamicData,
        dynamicSeries,
      });

      await delay(500);
      router.push('/results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      addLog(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

