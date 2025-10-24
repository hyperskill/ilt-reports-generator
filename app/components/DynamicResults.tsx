'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, Flex, Grid, Heading, Text, Badge, Table, TextField } from '@radix-ui/themes';
import { DynamicSummaryRow, DynamicSeriesRow } from '@/lib/types';
import { ModuleActivityChart } from './ModuleActivityChart';
import { SegmentPieChart } from './SegmentPieChart';
import { getEasingPatternChartColor, getEasingPatternBadgeStyle } from '@/lib/utils/segment-colors';
import * as Accordion from '@radix-ui/react-accordion';
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

  // Prepare pie chart data using centralized color system
  const pieChartData = useMemo(() => {
    return Object.entries(stats.easings).map(([easing, count]) => ({
      label: easing,
      count,
      color: getEasingPatternChartColor(easing),
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
                <Badge color="green" size="1">ease-out</Badge>
                <Text size="1" style={{ marginLeft: '8px' }}>Early activity (frontloaded)</Text>
              </Text>
              <Text size="1" as="p" mb="1">
                <Badge color="orange" size="1">ease-in</Badge>
                <Text size="1" style={{ marginLeft: '8px' }}>Late activity (backloaded)</Text>
              </Text>
              <Text size="1" as="p" mb="1">
                <Badge color="lime" size="1">linear</Badge>
                <Text size="1" style={{ marginLeft: '8px' }}>Steady activity throughout</Text>
              </Text>
              <Text size="1" as="p" mb="1">
                <Badge color="purple" size="1">ease-in-out</Badge>
                <Text size="1" style={{ marginLeft: '8px' }}>S-curve pattern</Text>
              </Text>
            </Box>
          </Box>
        </Card>
      </Grid>

      {/* Activity Chart Help Accordion */}
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
                      <Table.ColumnHeaderCell>Metric</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>What it means</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>How to understand it</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Easing Label</Text></Table.Cell>
                      <Table.Cell>Student's activity curve type</Table.Cell>
                      <Table.Cell>Shows how activity was distributed over time</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Frontload Index</Text></Table.Cell>
                      <Table.Cell>When the student was most active</Table.Cell>
                      <Table.Cell>Positive = active early<br/>Negative = active late</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Consistency</Text></Table.Cell>
                      <Table.Cell>How regularly the student studied</Table.Cell>
                      <Table.Cell>From 0 to 1: closer to 1 = more regular</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Burstiness</Text></Table.Cell>
                      <Table.Cell>How "bursty" the activity was</Table.Cell>
                      <Table.Cell>Higher = worked in bursts, lower = evenly</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">t25/t50/t75</Text></Table.Cell>
                      <Table.Cell>When 25%, 50%, 75% of work was completed</Table.Cell>
                      <Table.Cell>Numbers from 0 to 1 show the time point</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>

                <Box mt="4">
                  <Text size="2" weight="bold" mb="2" as="div">Activity Types (Easing Patterns):</Text>
                  <Box style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="green">📈 ease-out (Early start)</Text><br/>
                      Student was very active at the beginning, then activity decreased
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="orange">📉 ease-in (Late start)</Text><br/>
                      Student started slowly but became more active towards the end
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="gray">📊 linear (Steady)</Text><br/>
                      Activity distributed evenly throughout the entire period
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="purple">〰️ ease-in-out (S-curve)</Text><br/>
                      Slow start, active middle, fade at the end
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="blue">⚖️ ease (Moderate)</Text><br/>
                      Slight acceleration then deceleration - balanced activity
                    </Text>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="red">❌ no-activity</Text><br/>
                      No activity data for the student
                    </Text>
                  </Box>
                </Box>

                <Box mt="4">
                  <Text size="2" weight="bold" mb="2" as="div">How to read Frontload Index:</Text>
                  <Box style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="green">+0.3 (strong early start):</Text> 80% of work done in first half of period
                    </Text>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="blue">0.0 (balanced):</Text> Half of work by middle of period
                    </Text>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="orange">-0.3 (late start):</Text> Main work in second half of period
                    </Text>
                  </Box>
                </Box>

                <Box mt="4" p="3" style={{ background: 'var(--blue-a2)', borderRadius: 'var(--radius-2)' }}>
                  <Text size="2" weight="bold" mb="1" as="div">💡 How activity is calculated:</Text>
                  <Text size="2" as="p" mb="1">
                    <Text weight="bold">1. Activity from attempts:</Text> Each correct answer = 1 point, incorrect = 0.25 points
                  </Text>
                  <Text size="2" as="p" mb="1">
                    <Text weight="bold">2. Activity from meetings:</Text> Each attended meeting = 1.5 points (if meetings.csv exists)
                  </Text>
                  <Text size="2" as="p" mb="1">
                    <Text weight="bold">3. Accumulation:</Text> Points accumulate day by day, creating a growth curve
                  </Text>
                  <Text size="2" as="p">
                    <Text weight="bold">4. Normalization:</Text> Curve is scaled from 0 to 1 for easy comparison
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

      {/* Easing Distribution */}
      <Card>
        <Heading size="4" mb="3">Easing Label Distribution</Heading>
        <Flex gap="2" wrap="wrap">
          {Object.entries(stats.easings).map(([easing, count]) => {
            const isActive = selectedEasings.size === 0 || selectedEasings.has(easing);
            return (
              <Badge 
                key={easing} 
                size="2"
                style={{ 
                  cursor: 'pointer',
                  ...getEasingPatternBadgeStyle(easing),
                  opacity: isActive ? 1 : 0.4,
                  textDecoration: isActive ? 'none' : 'line-through',
                  transition: 'opacity 0.2s, text-decoration 0.2s',
                }}
                onClick={() => toggleEasing(easing)}
              >
                {easing}: {count}
              </Badge>
            );
          })}
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
              <Badge 
                size="3"
                style={getEasingPatternBadgeStyle(selectedUserData.easing_label)}
              >
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
                    <Badge 
                      size="1"
                      style={getEasingPatternBadgeStyle(row.easing_label)}
                    >
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

