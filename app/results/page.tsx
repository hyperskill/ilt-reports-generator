'use client';

import { useState } from 'react';
import { Box, Card, Flex, Heading, Text, Tabs } from '@radix-ui/themes';
import { AppLayout } from '@/app/components/AppLayout';
import { useAppContext } from '@/lib/context/AppContext';
import { PerformanceResults } from '@/app/components/PerformanceResults';
import { DynamicResults } from '@/app/components/DynamicResults';

export default function ResultsPage() {
  const { results, currentMode, setCurrentMode } = useAppContext();

  if (!results) {
    return (
      <AppLayout title="Results">
        <Card>
          <Text>No results available. Please process your data first.</Text>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box mb="5">
        <Heading size="8" mb="2">Results Overview</Heading>
        <Text size="3" color="gray">
          Switch between Performance and Dynamic/Easing segmentation modes.
        </Text>
      </Box>

      <Tabs.Root value={currentMode} onValueChange={(value) => setCurrentMode(value as 'performance' | 'dynamic')}>
        <Tabs.List>
          <Tabs.Trigger value="performance">
            <Flex align="center" gap="2">
              Performance Segmentation
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="dynamic">
            <Flex align="center" gap="2">
              Dynamic/Easing Segmentation
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
    </AppLayout>
  );
}

