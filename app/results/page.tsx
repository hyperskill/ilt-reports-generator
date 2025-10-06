'use client';

import { useState } from 'react';
import { Box, Card, Flex, Heading, Text, Tabs } from '@radix-ui/themes';
import { AppLayoutWithAuthWithAuth } from '@/app/components/AppLayoutWithAuthWithAuth';
import { useAppContext } from '@/lib/context/AppContext';
import { PerformanceResults } from '@/app/components/PerformanceResults';
import { DynamicResults } from '@/app/components/DynamicResults';

export default function ResultsPage() {
  const { results, currentMode, setCurrentMode } = useAppContext();

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
    </AppLayoutWithAuth>
  );
}

