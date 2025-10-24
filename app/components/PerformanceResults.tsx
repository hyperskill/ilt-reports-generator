'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, Flex, Grid, Heading, Text, Badge, Table, TextField } from '@radix-ui/themes';
import { PerformanceRow } from '@/lib/types';
import { SegmentPieChart } from './SegmentPieChart';
import { getPerformanceSegmentChartColor, getPerformanceSegmentBadgeStyle } from '@/lib/utils/segment-colors';
import * as Accordion from '@radix-ui/react-accordion';
import styles from './PerformanceResults.module.css';

interface Props {
  data: PerformanceRow[];
  reportId?: string | null;
}

export function PerformanceResults({ data, reportId }: Props) {
  const router = useRouter();
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

  // Prepare pie chart data using centralized color system
  const pieChartData = useMemo(() => {
    return Object.entries(stats.segments).map(([segment, count]) => ({
      label: segment,
      count,
      color: getPerformanceSegmentChartColor(segment),
    }));
  }, [stats.segments]);

  return (
    <Flex direction="column" gap="4">
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

      {/* Performance Help Accordion */}
      <Box>
        <Accordion.Root type="single" collapsible>
          <Accordion.Item value="help" style={{ border: '1px solid var(--gray-6)', borderRadius: '6px' }}>
            <Accordion.Trigger
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--gray-2)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
                color: 'var(--gray-11)',
                fontWeight: 500,
                borderRadius: '6px',
              }}
            >
              <span>ℹ️ How to read this data</span>
              <span style={{ fontSize: '12px' }}>▼</span>
            </Accordion.Trigger>
            <Accordion.Content
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                lineHeight: 1.7,
                color: 'var(--gray-12)',
                backgroundColor: 'var(--gray-1)',
              }}
            >
              <Box
                style={{
                  fontSize: '14px',
                  lineHeight: '1.7',
                }}
                className="help-content"
              >
                <Text size="2" weight="bold" mb="3" as="div">In plain language:</Text>
                <Table.Root size="1" variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Column</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>What it means</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Where it comes from</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">User ID</Text></Table.Cell>
                      <Table.Cell>Unique student identifier</Table.Cell>
                      <Table.Cell>From your files</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Name</Text></Table.Cell>
                      <Table.Cell>Student's first and last name</Table.Cell>
                      <Table.Cell>From learners.csv</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Score %</Text></Table.Cell>
                      <Table.Cell>Percentage of maximum score in the group</Table.Cell>
                      <Table.Cell>From grade_book.csv</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Submissions</Text></Table.Cell>
                      <Table.Cell>Total number of attempts by the student</Table.Cell>
                      <Table.Cell>Calculated from submissions.csv</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Success Rate</Text></Table.Cell>
                      <Table.Cell>Percentage of correct answers on first attempt</Table.Cell>
                      <Table.Cell>Correct answers ÷ all attempts × 100</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Persistence</Text></Table.Cell>
                      <Table.Cell>Average attempts per task<br/>(higher = more effort)</Table.Cell>
                      <Table.Cell>All attempts ÷ number of tasks</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Efficiency</Text></Table.Cell>
                      <Table.Cell>Number of tasks solved correctly<br/>(higher = better)</Table.Cell>
                      <Table.Cell>Correct answers ÷ number of tasks</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Consistency</Text></Table.Cell>
                      <Table.Cell>Study regularity (0-1, where 1 = every day)</Table.Cell>
                      <Table.Cell>Active days ÷ total learning period</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Effort Index</Text></Table.Cell>
                      <Table.Cell>How active compared to the group<br/>(above average = positive number)</Table.Cell>
                      <Table.Cell>Considers attempts and active days</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Struggle Index</Text></Table.Cell>
                      <Table.Cell>Indicator of learning difficulties<br/>(higher = more problems)</Table.Cell>
                      <Table.Cell>High persistence + low success</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Meetings %</Text></Table.Cell>
                      <Table.Cell>Percentage of webinars/meetings attended</Table.Cell>
                      <Table.Cell>From meetings.csv (if available)</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Segment</Text></Table.Cell>
                      <Table.Cell>Which group the student belongs to</Table.Cell>
                      <Table.Cell>Automatically determined by rules below</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>

                <Box mt="4">
                  <Text size="2" weight="bold" mb="2" as="div">Student Groups (Segments):</Text>
                  <Box style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <Text as="p" mb="2">
                      <Text weight="bold" style={{ color: 'rgb(10, 59, 28)' }}>⚡ Highly efficient</Text><br/>
                      Consistently productive, delivers strong results
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" style={{ color: 'rgb(10, 59, 28)' }}>🏆 Highly engaged</Text><br/>
                      Actively participates, contributes with enthusiasm
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" style={{ color: 'rgb(22, 67, 38)' }}>💪 Highly committed</Text><br/>
                      Puts in strong effort, motivated but still finding consistency
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" style={{ color: 'rgb(40, 72, 52)' }}>👥 Moderately engaged</Text><br/>
                      Participates occasionally, shows average involvement
                    </Text>
                    <Text as="p" mb="1">
                      <Text weight="bold" style={{ color: 'rgb(72, 20, 20)' }}>😴 Less engaged</Text><br/>
                      Limited participation or motivation
                    </Text>
                  </Box>
                </Box>

                <Box mt="4" p="3" style={{ background: 'var(--blue-a2)', borderRadius: 'var(--radius-2)' }}>
                  <Text size="2" weight="bold" mb="1" as="div">💡 Important to know:</Text>
                  <Text size="2" as="p" mb="1">
                    • All activity metrics are automatically calculated from your submissions
                  </Text>
                  <Text size="2" as="p" mb="1">
                    • Correct answer = 1 activity point, incorrect = 0.25 points
                  </Text>
                  <Text size="2" as="p">
                    • Higher Consistency means more regular study habits
                  </Text>
                </Box>
              </Box>
              <style jsx>{`
                .help-content :global(p) {
                  margin: 0 0 12px 0;
                }
                .help-content :global(p:last-child) {
                  margin-bottom: 0;
                }
                .help-content :global(ul) {
                  margin: 8px 0;
                  padding-left: 20px;
                }
                .help-content :global(li) {
                  margin: 4px 0;
                }
                .help-content :global(strong) {
                  font-weight: 600;
                  color: var(--gray-12);
                }
              `}</style>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </Box>

      {/* Segment Distribution */}
      <Card>
        <Heading size="4" mb="3">Segment Distribution</Heading>
        <Flex gap="2" wrap="wrap">
          {Object.entries(stats.segments).map(([segment, count]) => {
            const isActive = selectedSegments.size === 0 || selectedSegments.has(segment);
            return (
              <Badge 
                key={segment} 
                size="2"
                style={{ 
                  cursor: 'pointer',
                  ...getPerformanceSegmentBadgeStyle(segment),
                  opacity: isActive ? 1 : 0.4,
                  textDecoration: isActive ? 'none' : 'line-through',
                  transition: 'opacity 0.2s, text-decoration 0.2s',
                }}
                onClick={() => toggleSegment(segment)}
              >
                {segment}: {count}
              </Badge>
            );
          })}
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
                  <Table.Cell><Text size="2">{row.total_pct}%</Text></Table.Cell>
                  <Table.Cell><Text size="2">{row.submissions}</Text></Table.Cell>
                  <Table.Cell><Text size="2">{row.success_rate}%</Text></Table.Cell>
                  <Table.Cell><Text size="2">{row.persistence}</Text></Table.Cell>
                  <Table.Cell><Text size="2">{row.efficiency}</Text></Table.Cell>
                  <Table.Cell>
                    <Badge 
                      size="1"
                      style={getPerformanceSegmentBadgeStyle(row.simple_segment)}
                    >
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

