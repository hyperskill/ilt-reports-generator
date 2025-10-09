'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, Flex, Grid, Heading, Text, Badge, Table, TextField } from '@radix-ui/themes';
import { DynamicSummaryRow, DynamicSeriesRow } from '@/lib/types';
import { ModuleActivityChart } from './ModuleActivityChart';
import { TableLegend } from './TableLegend';
import { SegmentPieChart } from './SegmentPieChart';
import styles from './DynamicResults.module.css';

interface Props {
  summary: DynamicSummaryRow[];
  series: DynamicSeriesRow[];
  reportId?: string | null;
  submissions?: any[];
  structure?: any[];
  courseId?: number;
  meetings?: any[];
}

export function DynamicResults({ summary, series, reportId, submissions, structure, courseId, meetings }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEasings, setSelectedEasings] = useState<Set<string>>(new Set());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Calculate stats
  const stats = useMemo(() => {
    const easingCounts: Record<string, number> = {};
    let fiSum = 0;

    for (const row of summary) {
      easingCounts[row.easing_label] = (easingCounts[row.easing_label] || 0) + 1;
      fiSum += row.frontload_index;
    }

    return {
      total: summary.length,
      easings: easingCounts,
      avgFrontloadIndex: (fiSum / summary.length).toFixed(4),
    };
  }, [summary]);

  // Filter data
  const filteredData = useMemo(() => {
    return summary.filter(row => {
      const matchesSearch = 
        row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.user_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEasing = 
        selectedEasings.size === 0 || selectedEasings.has(row.easing_label);
      
      return matchesSearch && matchesEasing;
    });
  }, [summary, searchTerm, selectedEasings]);

  const toggleEasing = (easing: string) => {
    const newSet = new Set(selectedEasings);
    if (newSet.has(easing)) {
      newSet.delete(easing);
    } else {
      newSet.add(easing);
    }
    setSelectedEasings(newSet);
  };

  const getEasingColor = (easing: string): any => {
    switch (easing) {
      case 'linear': return 'gray';
      case 'ease': return 'blue';
      case 'ease-in': return 'orange';
      case 'ease-out': return 'green';
      case 'ease-in-out': return 'purple';
      case 'no-activity': return 'red';
      default: return 'gray';
    }
  };

  const getEasingChartColor = (easing: string): string => {
    switch (easing) {
      case 'linear': return '#6b7280'; // gray-500
      case 'ease': return '#3b82f6'; // blue-500
      case 'ease-in': return '#f97316'; // orange-500
      case 'ease-out': return '#22c55e'; // green-500
      case 'ease-in-out': return '#a855f7'; // purple-500
      case 'no-activity': return '#ef4444'; // red-500
      default: return '#6b7280'; // gray-500
    }
  };

  // Prepare pie chart data
  const pieChartData = useMemo(() => {
    return Object.entries(stats.easings).map(([easing, count]) => ({
      label: easing,
      count,
      color: getEasingChartColor(easing),
    }));
  }, [stats.easings]);

  const selectedUserSeries = useMemo(() => {
    if (!selectedUserId) return [];
    return series.filter(row => row.user_id === selectedUserId);
  }, [selectedUserId, series]);

  const selectedUserData = useMemo(() => {
    if (!selectedUserId) return null;
    return summary.find(row => row.user_id === selectedUserId);
  }, [selectedUserId, summary]);

  return (
    <Flex direction="column" gap="4">
      {/* Table Legend */}
      <TableLegend mode="dynamic" />

      {/* Summary Cards */}
      <Grid columns="3" gap="3">
        <Card>
          <Text size="2" color="gray">Learners Analyzed</Text>
          <Heading size="6">{stats.total}</Heading>
        </Card>
        <Card>
          <Text size="2" color="gray">Avg Frontload Index</Text>
          <Heading size="6">{stats.avgFrontloadIndex}</Heading>
          <Text size="1" color="gray">
            {Number(stats.avgFrontloadIndex) > 0 ? 'Early loading' : 'Late loading'}
          </Text>
        </Card>
        <Card>
          <Text size="2" color="gray">Most Common Pattern</Text>
          <Heading size="6">
            {Object.entries(stats.easings).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
          </Heading>
        </Card>
      </Grid>

      {/* Pie Chart */}
      <Grid columns="2" gap="4">
        <SegmentPieChart 
          title="Easing Pattern Distribution"
          data={pieChartData}
          total={stats.total}
        />
        <Card>
          <Box p="4">
            <Heading size="4" mb="3">Pattern Insights</Heading>
            <Flex direction="column" gap="2">
              {Object.entries(stats.easings)
                .sort(([,a], [,b]) => b - a)
                .map(([easing, count]) => {
                  const percentage = ((count / stats.total) * 100).toFixed(1);
                  return (
                    <Flex key={easing} justify="between" align="center">
                      <Text size="2" weight="bold">{easing}</Text>
                      <Text size="2" color="gray">{count} ({percentage}%)</Text>
                    </Flex>
                  );
                })}
            </Flex>
            <Box mt="4" p="3" style={{ backgroundColor: 'var(--gray-a2)', borderRadius: 'var(--radius-2)' }}>
              <Text size="2" weight="bold" mb="2">Pattern Meanings:</Text>
              <Text size="1" as="p" mb="1">
                <Text weight="bold" color="green">ease-out:</Text> Early activity (frontloaded)
              </Text>
              <Text size="1" as="p" mb="1">
                <Text weight="bold" color="orange">ease-in:</Text> Late activity (backloaded)
              </Text>
              <Text size="1" as="p" mb="1">
                <Text weight="bold" color="gray">linear:</Text> Steady activity throughout
              </Text>
              <Text size="1" as="p" mb="1">
                <Text weight="bold" color="purple">ease-in-out:</Text> S-curve pattern
              </Text>
            </Box>
          </Box>
        </Card>
      </Grid>

      {/* Easing Distribution */}
      <Card>
        <Heading size="4" mb="3">Easing Label Distribution</Heading>
        <Flex gap="2" wrap="wrap">
          {Object.entries(stats.easings).map(([easing, count]) => (
            <Badge 
              key={easing} 
              color={getEasingColor(easing)}
              size="2"
              variant={selectedEasings.has(easing) ? 'solid' : 'soft'}
              style={{ cursor: 'pointer' }}
              onClick={() => toggleEasing(easing)}
            >
              {easing}: {count}
            </Badge>
          ))}
        </Flex>
        {selectedEasings.size > 0 && (
          <Text size="2" color="gray" mt="2">
            Click labels to filter • <span 
              style={{ textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => setSelectedEasings(new Set())}
            >Clear filters</span>
          </Text>
        )}
      </Card>

      {/* Search */}
      <Card>
        <TextField.Root
          placeholder="Search by name or user ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      {/* Chart View */}
      {selectedUserId && selectedUserData && (
        <Card>
          <Flex justify="between" align="center" mb="3">
            <Box>
              <Heading size="4">{selectedUserData.name}</Heading>
              <Text size="2" color="gray">User ID: {selectedUserId}</Text>
            </Box>
            <button 
              onClick={() => setSelectedUserId(null)}
              style={{
                background: 'var(--gray-a3)',
                border: '1px solid var(--gray-a5)',
                borderRadius: 'var(--radius-2)',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </Flex>
          
          <Grid columns="2" gap="3" mb="4">
            <Box>
              <Text size="2" color="gray">Easing Label</Text>
              <Badge color={getEasingColor(selectedUserData.easing_label)} size="3">
                {selectedUserData.easing_label}
              </Badge>
            </Box>
            <Box>
              <Text size="2" color="gray">Frontload Index</Text>
              <Text size="4" weight="bold">{selectedUserData.frontload_index}</Text>
            </Box>
            <Box>
              <Text size="2" color="gray">Quartiles (t25/t50/t75)</Text>
              <Text size="2">{selectedUserData.t25} / {selectedUserData.t50} / {selectedUserData.t75}</Text>
            </Box>
            <Box>
              <Text size="2" color="gray">Score</Text>
              <Text size="4" weight="bold">{selectedUserData.total_pct}%</Text>
            </Box>
          </Grid>

          {structure && courseId && submissions ? (
            <ModuleActivityChart
              userId={selectedUserId}
              submissions={submissions}
              structure={structure}
              courseId={courseId}
              meetings={meetings}
              studentName={selectedUserData.name.split(' ')[0]}
            />
          ) : (
            <Text size="2" color="gray">Module activity chart not available</Text>
          )}
        </Card>
      )}

      {/* Results Table */}
      <Card>
        <Heading size="4" mb="3">
          Learners ({filteredData.length})
        </Heading>
        <Box className={styles.tableContainer}>
          <Table.Root size="2" variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>User ID</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Easing Label</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Frontload Index</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>t25/t50/t75</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Score %</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredData.slice(0, 100).map(row => (
                <Table.Row key={row.user_id} className={styles.clickableRow}>
                  <Table.Cell><Text size="2">{row.user_id}</Text></Table.Cell>
                  <Table.Cell>
                    <Text 
                      size="2" 
                      weight="bold"
                      className={styles.clickableName}
                      onClick={() => router.push(reportId ? `/student/${row.user_id}?reportId=${reportId}` : `/student/${row.user_id}`)}
                    >
                      {row.name}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={getEasingColor(row.easing_label)} size="1">
                      {row.easing_label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2" color={row.frontload_index > 0 ? 'green' : 'orange'}>
                      {row.frontload_index}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">{row.t25.toFixed(2)} / {row.t50.toFixed(2)} / {row.t75.toFixed(2)}</Text>
                  </Table.Cell>
                  <Table.Cell><Text size="2">{row.total_pct}%</Text></Table.Cell>
                  <Table.Cell>
                    <button
                      onClick={() => setSelectedUserId(row.user_id)}
                      style={{
                        background: 'var(--accent-a3)',
                        border: '1px solid var(--accent-a5)',
                        borderRadius: 'var(--radius-2)',
                        padding: '0.25rem 0.75rem',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      View activity
                    </button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
          {filteredData.length > 100 && (
            <Text size="2" color="gray" mt="2">
              Showing first 100 of {filteredData.length} results
            </Text>
          )}
        </Box>
      </Card>
    </Flex>
  );
}

