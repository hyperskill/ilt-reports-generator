'use client';

import { useState, useMemo } from 'react';
import { Box, Card, Flex, Grid, Heading, Text, Badge, Table, TextField } from '@radix-ui/themes';
import { PerformanceRow } from '@/lib/types';
import { TableLegend } from './TableLegend';
import { SegmentPieChart } from './SegmentPieChart';
import styles from './PerformanceResults.module.css';

interface Props {
  data: PerformanceRow[];
}

export function PerformanceResults({ data }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set());

  // Calculate stats
  const stats = useMemo(() => {
    const segmentCounts: Record<string, number> = {};
    let totalPctSum = 0;
    let successRateSum = 0;
    let meetingsSum = 0;

    for (const row of data) {
      segmentCounts[row.simple_segment] = (segmentCounts[row.simple_segment] || 0) + 1;
      totalPctSum += row.total_pct;
      successRateSum += row.success_rate;
      meetingsSum += row.meetings_attended_pct;
    }

    return {
      total: data.length,
      segments: segmentCounts,
      avgTotalPct: (totalPctSum / data.length).toFixed(1),
      avgSuccessRate: (successRateSum / data.length).toFixed(1),
      avgMeetingsPct: (meetingsSum / data.length).toFixed(1),
    };
  }, [data]);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchesSearch = 
        row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.user_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSegment = 
        selectedSegments.size === 0 || selectedSegments.has(row.simple_segment);
      
      return matchesSearch && matchesSegment;
    });
  }, [data, searchTerm, selectedSegments]);

  const toggleSegment = (segment: string) => {
    const newSet = new Set(selectedSegments);
    if (newSet.has(segment)) {
      newSet.delete(segment);
    } else {
      newSet.add(segment);
    }
    setSelectedSegments(newSet);
  };

  const getSegmentColor = (segment: string): any => {
    if (segment.includes('Leader')) return 'green';
    if (segment.includes('Low engagement')) return 'red';
    if (segment.includes('Hardworking')) return 'orange';
    if (segment.includes('engaged')) return 'blue';
    return 'gray';
  };

  const getSegmentChartColor = (segment: string): string => {
    if (segment.includes('Leader engaged')) return '#22c55e'; // green-500
    if (segment.includes('Leader efficient')) return '#16a34a'; // green-600
    if (segment.includes('Balanced + engaged')) return '#3b82f6'; // blue-500
    if (segment.includes('Low engagement but socially active')) return '#ef4444'; // red-500
    if (segment.includes('Hardworking but struggling')) return '#f97316'; // orange-500
    if (segment.includes('Low engagement')) return '#dc2626'; // red-600
    return '#6b7280'; // gray-500 for Balanced middle
  };

  // Prepare pie chart data
  const pieChartData = useMemo(() => {
    return Object.entries(stats.segments).map(([segment, count]) => ({
      label: segment,
      count,
      color: getSegmentChartColor(segment),
    }));
  }, [stats.segments]);

  return (
    <Flex direction="column" gap="4">
      {/* Table Legend */}
      <TableLegend mode="performance" />

      {/* Summary Cards */}
      <Grid columns="4" gap="3">
        <Card>
          <Text size="2" color="gray">Learners Processed</Text>
          <Heading size="6">{stats.total}</Heading>
        </Card>
        <Card>
          <Text size="2" color="gray">Avg Score %</Text>
          <Heading size="6">{stats.avgTotalPct}%</Heading>
        </Card>
        <Card>
          <Text size="2" color="gray">Avg Success Rate</Text>
          <Heading size="6">{stats.avgSuccessRate}%</Heading>
        </Card>
        <Card>
          <Text size="2" color="gray">Avg Meetings %</Text>
          <Heading size="6">{stats.avgMeetingsPct}%</Heading>
        </Card>
      </Grid>

      {/* Pie Chart */}
      <Grid columns="2" gap="4">
        <SegmentPieChart 
          title="Performance Segment Distribution"
          data={pieChartData}
          total={stats.total}
        />
        <Card>
          <Box p="4">
            <Heading size="4" mb="3">Segment Insights</Heading>
            <Flex direction="column" gap="2">
              {Object.entries(stats.segments)
                .sort(([,a], [,b]) => b - a)
                .map(([segment, count]) => {
                  const percentage = ((count / stats.total) * 100).toFixed(1);
                  return (
                    <Flex key={segment} justify="between" align="center">
                      <Text size="2" weight="bold">{segment}</Text>
                      <Text size="2" color="gray">{count} ({percentage}%)</Text>
                    </Flex>
                  );
                })}
            </Flex>
          </Box>
        </Card>
      </Grid>

      {/* Segment Distribution */}
      <Card>
        <Heading size="4" mb="3">Segment Distribution</Heading>
        <Flex gap="2" wrap="wrap">
          {Object.entries(stats.segments).map(([segment, count]) => (
            <Badge 
              key={segment} 
              color={getSegmentColor(segment)}
              size="2"
              variant={selectedSegments.has(segment) ? 'solid' : 'soft'}
              style={{ cursor: 'pointer' }}
              onClick={() => toggleSegment(segment)}
            >
              {segment}: {count}
            </Badge>
          ))}
        </Flex>
        {selectedSegments.size > 0 && (
          <Text size="2" color="gray" mt="2">
            Click segments to filter • <span 
              style={{ textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => setSelectedSegments(new Set())}
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
                <Table.ColumnHeaderCell>Score %</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Submissions</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Success Rate</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Persistence</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Efficiency</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Segment</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Meetings %</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredData.slice(0, 100).map(row => (
                <Table.Row key={row.user_id}>
                  <Table.Cell><Text size="2">{row.user_id}</Text></Table.Cell>
                  <Table.Cell><Text size="2" weight="bold">{row.name}</Text></Table.Cell>
                  <Table.Cell><Text size="2">{row.total_pct}%</Text></Table.Cell>
                  <Table.Cell><Text size="2">{row.submissions}</Text></Table.Cell>
                  <Table.Cell><Text size="2">{row.success_rate}%</Text></Table.Cell>
                  <Table.Cell><Text size="2">{row.persistence}</Text></Table.Cell>
                  <Table.Cell><Text size="2">{row.efficiency}</Text></Table.Cell>
                  <Table.Cell>
                    <Badge color={getSegmentColor(row.simple_segment)} size="1">
                      {row.simple_segment}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell><Text size="2">{row.meetings_attended_pct}%</Text></Table.Cell>
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

