'use client';

import { useEffect, useState } from 'react';
import { Box, Card, Heading, Text, Table, Badge, Flex, Spinner } from '@radix-ui/themes';
import { processModuleAnalytics, ModuleStats } from '@/lib/processors/module-analytics';

interface ModuleAnalyticsProps {
  userId: string;
  submissions: any[];
  structure: any[];
  courseId: number;
  meetings?: any[];
}

export function ModuleAnalytics({ userId, submissions, structure, courseId, meetings }: ModuleAnalyticsProps) {
  const [moduleStats, setModuleStats] = useState<ModuleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModuleAnalytics();
  }, [userId, submissions, structure, courseId]);

  const loadModuleAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Extract unique module IDs from structure data
      const moduleIdsSet = new Set<number>();
      for (const row of structure) {
        const moduleId = Number(row.module_id || row.moduleid || 0);
        if (moduleId > 0) {
          moduleIdsSet.add(moduleId);
        }
      }
      
      const moduleIds = Array.from(moduleIdsSet);
      console.log('📋 Found module IDs in structure:', moduleIds);

      if (moduleIds.length === 0) {
        throw new Error('No module IDs found in structure data');
      }

      // Fetch module names from Cogniterra API using module IDs
      const response = await fetch(`/api/cogniterra/modules?moduleIds=${moduleIds.join(',')}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch module names:', response.status, errorData);
        throw new Error(errorData.details || 'Failed to fetch module names from Cogniterra API');
      }

      const data = await response.json();
      const moduleNamesMap = data.modules;
      
      console.log('📚 Module names loaded:', moduleNamesMap);
      console.log('📊 Processing analytics for', Object.keys(moduleNamesMap).length, 'modules');

      // Process module analytics
      const stats = processModuleAnalytics(userId, submissions, structure, moduleNamesMap, meetings);
      console.log('✅ Module stats processed:', stats);
      setModuleStats(stats);
    } catch (err: any) {
      console.error('❌ Error loading module analytics:', err);
      setError(err.message || 'Failed to load module analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <Flex align="center" gap="3" p="4">
          <Spinner />
          <Text>Loading module analytics...</Text>
        </Flex>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ background: 'var(--yellow-a2)', border: '1px solid var(--yellow-a6)' }}>
        <Flex direction="column" gap="2">
          <Text weight="bold" color="orange">⚠️ Module Analytics Unavailable</Text>
          <Text size="2" color="gray">
            {error}
          </Text>
          <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
            Module analytics require Cogniterra API access. Please check your API credentials.
          </Text>
        </Flex>
      </Card>
    );
  }

  if (moduleStats.length === 0) {
    return (
      <Card>
        <Text color="gray">No module data available for this student.</Text>
      </Card>
    );
  }

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'green';
    if (rate >= 50) return 'orange';
    return 'red';
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 70) return 'green';
    if (rate >= 50) return 'orange';
    return 'red';
  };

  return (
    <Card>
      <Heading size="5" mb="3">📚 Module Progress</Heading>
      <Text size="2" color="gray" mb="4">
        Track your progress and performance across different course modules.
      </Text>

      <Box style={{ overflowX: 'auto' }}>
        <Table.Root size="2" variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Module</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Progress</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Success Rate</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Attempts/Step</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Total Attempts</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Meetings</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {moduleStats.map((module) => (
              <Table.Row key={module.module_id}>
                <Table.Cell>
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="bold">{module.module_name}</Text>
                    <Text size="1" color="gray">
                      {module.attempted_steps} of {module.total_steps} steps attempted
                    </Text>
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Flex direction="column" gap="1" align="start">
                    <Badge color={getCompletionColor(module.completion_rate)} size="2">
                      {module.completion_rate.toFixed(1)}%
                    </Badge>
                    <Text size="1" color="gray">
                      {module.completed_steps}/{module.total_steps} completed
                    </Text>
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Flex direction="column" gap="1" align="start">
                    <Badge color={getSuccessColor(module.success_rate)} size="2">
                      {module.success_rate.toFixed(1)}%
                    </Badge>
                    <Text size="1" color="gray">
                      {module.correct_attempts}/{module.total_attempts} correct
                    </Text>
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" weight="medium">
                    {module.avg_attempts_per_step.toFixed(1)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2">{module.total_attempts}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Flex direction="column" gap="1" align="start">
                    <Badge color={module.meetings_attended > 0 ? 'purple' : 'gray'} size="2">
                      {module.meetings_attended}
                    </Badge>
                    {module.first_activity_date && module.last_activity_date && (
                      <Text size="1" color="gray">
                        {new Date(module.first_activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(module.last_activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    )}
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Summary Stats */}
      <Box mt="4" p="3" style={{ backgroundColor: 'var(--gray-a2)', borderRadius: 'var(--radius-2)' }}>
        <Flex gap="4" wrap="wrap">
          <Box>
            <Text size="1" color="gray" as="div">Total Modules</Text>
            <Text size="3" weight="bold">{moduleStats.length}</Text>
          </Box>
          <Box>
            <Text size="1" color="gray" as="div">Avg Completion</Text>
            <Text size="3" weight="bold">
              {(moduleStats.reduce((sum, m) => sum + m.completion_rate, 0) / moduleStats.length).toFixed(1)}%
            </Text>
          </Box>
          <Box>
            <Text size="1" color="gray" as="div">Avg Success Rate</Text>
            <Text size="3" weight="bold">
              {(moduleStats.reduce((sum, m) => sum + m.success_rate, 0) / moduleStats.length).toFixed(1)}%
            </Text>
          </Box>
          <Box>
            <Text size="1" color="gray" as="div">Total Attempts</Text>
            <Text size="3" weight="bold">
              {moduleStats.reduce((sum, m) => sum + m.total_attempts, 0)}
            </Text>
          </Box>
        </Flex>
      </Box>
    </Card>
  );
}

