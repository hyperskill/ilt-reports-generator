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
        <Heading size="8" mb="2">Результаты анализа</Heading>
        <Text size="3" color="gray">
          Переключайтесь между анализом успеваемости и анализом активности во времени.
        </Text>
        <Text size="2" color="gray" mt="1">
          💡 Все метрики автоматически рассчитаны из ваших данных о попытках студентов
        </Text>
      </Box>

      <Tabs.Root value={currentMode} onValueChange={(value) => setCurrentMode(value as 'performance' | 'dynamic')}>
        <Tabs.List>
          <Tabs.Trigger value="performance">
            <Flex align="center" gap="2">
              📊 Анализ успеваемости
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="dynamic">
            <Flex align="center" gap="2">
              📈 Анализ активности
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

