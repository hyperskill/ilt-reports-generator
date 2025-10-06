'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, Flex, Grid, Heading, Text, Badge, Button, Table, Separator } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { useAppContext } from '@/lib/context/AppContext';
import { generateStudentReport } from '@/lib/processors/student-report-processor';
import { EasingChart } from '@/app/components/EasingChart';
import styles from './student.module.css';

interface PageProps {
  params: { userId: string };
}

export default function StudentDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { results, files } = useAppContext();

  const report = useMemo(() => {
    if (!results || !files.submissions) return null;

    return generateStudentReport({
      userId: params.userId,
      performanceData: results.performanceData,
      dynamicData: results.dynamicData,
      dynamicSeries: results.dynamicSeries,
      submissions: files.submissions.data,
      structure: files.structure?.data,
      excludedUserIds: [],
    });
  }, [params.userId, results, files.submissions, files.structure]);

  if (!report) {
    return (
      <AppLayoutWithAuth title="Student Report">
        <Card>
          <Text>Student not found or data not available.</Text>
          <Button mt="3" onClick={() => router.push('/results')}>
            Back to Results
          </Button>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  const getSegmentColor = (segment: string): any => {
    if (segment.includes('Leader')) return 'green';
    if (segment.includes('Low engagement')) return 'red';
    if (segment.includes('Hardworking')) return 'orange';
    if (segment.includes('engaged')) return 'blue';
    return 'gray';
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

  const getEngagementColor = (level: string): any => {
    if (level === 'High') return 'green';
    if (level === 'Low') return 'red';
    return 'blue';
  };

  return (
    <AppLayoutWithAuth>
      <Box className={styles.container}>
        {/* Header */}
        <Card>
          <Flex justify="between" align="start" mb="3">
            <Box>
              <Heading size="7" mb="2">{report.student.name}</Heading>
              <Text size="2" color="gray">User ID: {report.student.user_id}</Text>
            </Box>
            <Button variant="soft" onClick={() => router.push('/results')}>
              ← Back to Results
            </Button>
          </Flex>

          <Grid columns="4" gap="3">
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Segment</Text>
              <Badge color={getSegmentColor(report.student.segment)} size="2">
                {report.student.segment}
              </Badge>
            </Box>
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Activity Pattern</Text>
              <Badge color={getEasingColor(report.student.easing)} size="2">
                {report.student.easing}
              </Badge>
            </Box>
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Score</Text>
              <Text as="div" size="5" weight="bold">{report.performance.total_pct}%</Text>
            </Box>
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Success Rate</Text>
              <Text as="div" size="5" weight="bold">{report.performance.success_rate}%</Text>
            </Box>
          </Grid>
        </Card>

        {/* Highlights */}
        <Card>
          <Heading size="5" mb="3">📋 {report.student.name.split(' ')[0]}'s Progress Highlights</Heading>
          <Flex direction="column" gap="2">
            {report.highlights.map((highlight, idx) => (
              <Box 
                key={idx}
                p="3"
                style={{
                  backgroundColor: highlight.type === 'win' ? 'var(--green-a2)' : 'var(--orange-a2)',
                  borderRadius: 'var(--radius-2)',
                  borderLeft: `3px solid ${highlight.type === 'win' ? 'var(--green-9)' : 'var(--orange-9)'}`,
                }}
              >
                <Text size="3">
                  {highlight.type === 'win' ? '✅ ' : '🎯 '}
                  {highlight.text}
                </Text>
              </Box>
            ))}
          </Flex>
        </Card>

        {/* Overall Engagement */}
        <Card>
          <Flex align="center" gap="3">
            <Box style={{ fontSize: '2rem' }}>
              {report.engagement.level === 'High' && '🔥'}
              {report.engagement.level === 'Medium' && '📊'}
              {report.engagement.level === 'Low' && '💤'}
            </Box>
            <Box style={{ flex: 1 }}>
              <Flex align="center" gap="2" mb="1">
                <Text size="4" weight="bold">Overall Engagement</Text>
                <Badge color={getEngagementColor(report.engagement.level)} size="1">
                  {report.engagement.level}
                </Badge>
              </Flex>
              <Text size="2" color="gray">{report.engagement.description}</Text>
            </Box>
          </Flex>
        </Card>

        {/* Activity Curve */}
        <Card>
          <Heading size="5" mb="3">📈 {report.student.name.split(' ')[0]}'s Activity Over Time</Heading>
          <Text size="2" color="gray" mb="3">
            {report.curve.explain}
          </Text>

          <Grid columns="4" gap="3" mb="4">
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Frontload Index</Text>
              <Text as="div" size="4" weight="bold" color={report.curve.fi > 0 ? 'green' : 'orange'} mb="1">
                {report.curve.fi.toFixed(3)}
              </Text>
              <Text as="div" size="1" color="gray">
                {report.curve.fi > 0 ? 'Early loading' : report.curve.fi < 0 ? 'Late loading' : 'Balanced'}
              </Text>
            </Box>
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Consistency</Text>
              <Text as="div" size="4" weight="bold" mb="1">{(report.curve.consistency * 100).toFixed(0)}%</Text>
              <Text as="div" size="1" color="gray">Active days / total days</Text>
            </Box>
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Burstiness</Text>
              <Text as="div" size="4" weight="bold" mb="1">{report.curve.burstiness.toFixed(2)}</Text>
              <Text as="div" size="1" color="gray">{report.curve.burstiness > 0.6 ? 'Bursty' : 'Steady'}</Text>
            </Box>
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Progress Points</Text>
              <Text as="div" size="2">
                25%: {(report.curve.t25 * 100).toFixed(0)}%<br/>
                50%: {(report.curve.t50 * 100).toFixed(0)}%<br/>
                75%: {(report.curve.t75 * 100).toFixed(0)}%
              </Text>
            </Box>
          </Grid>

          {report.series.length > 0 && (
            <EasingChart 
              series={report.series}
              userData={report.dynamic}
            />
          )}
        </Card>

        {/* Topics */}
        <Grid columns="2" gap="4">
          {/* Going Well */}
          {report.topics.wins.length > 0 && (
            <Card>
              <Heading size="4" mb="3" style={{ color: 'var(--green-11)' }}>
                ✨ Going Well
              </Heading>
              <Flex direction="column" gap="2">
                {report.topics.wins.map((topic, idx) => (
                  <Box 
                    key={idx}
                    p="3"
                    style={{
                      backgroundColor: 'var(--green-a2)',
                      borderRadius: 'var(--radius-2)',
                    }}
                  >
                    <Text as="div" size="3" weight="bold" mb="1">{topic.title}</Text>
                    <Text as="div" size="2" color="gray">{topic.why}</Text>
                  </Box>
                ))}
              </Flex>
            </Card>
          )}

          {/* Needs Attention */}
          {report.topics.focus.length > 0 && (
            <Card>
              <Heading size="4" mb="3" style={{ color: 'var(--orange-11)' }}>
                🎯 Focus Areas
              </Heading>
              <Flex direction="column" gap="2">
                {report.topics.focus.map((topic, idx) => (
                  <Box 
                    key={idx}
                    p="3"
                    style={{
                      backgroundColor: 'var(--orange-a2)',
                      borderRadius: 'var(--radius-2)',
                    }}
                  >
                    <Text as="div" size="3" weight="bold" mb="1">{topic.title}</Text>
                    <Text as="div" size="2" color="gray">{topic.why}</Text>
                    {topic.evidence && (
                      <Text as="div" size="1" color="gray" mt="1" style={{ fontStyle: 'italic' }}>
                        Note: {topic.evidence}
                      </Text>
                    )}
                  </Box>
                ))}
              </Flex>
            </Card>
          )}
        </Grid>

        {/* Detailed Stats */}
        <Card>
          <Heading size="5" mb="3">📊 Detailed Statistics</Heading>
          
          <Heading size="3" mb="2">Performance Metrics</Heading>
          <Grid columns="3" gap="3" mb="4">
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Submissions</Text>
              <Text as="div" size="4" weight="bold">{report.performance.submissions}</Text>
            </Box>
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Unique Steps</Text>
              <Text as="div" size="4" weight="bold">{report.performance.unique_steps}</Text>
            </Box>
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Persistence</Text>
              <Text as="div" size="4" weight="bold" mb="1">{report.performance.persistence.toFixed(2)}</Text>
              <Text as="div" size="1" color="gray">Attempts per step</Text>
            </Box>
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Efficiency</Text>
              <Text as="div" size="4" weight="bold" mb="1">{report.performance.efficiency.toFixed(2)}</Text>
              <Text as="div" size="1" color="gray">Correct per step</Text>
            </Box>
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Active Days</Text>
              <Text as="div" size="4" weight="bold" mb="1">{report.performance.active_days}</Text>
              <Text as="div" size="1" color="gray">{(report.performance.active_days_ratio * 100).toFixed(0)}% of period</Text>
            </Box>
            <Box>
              <Text as="div" size="2" color="gray" mb="1">Effort Index</Text>
              <Text as="div" size="4" weight="bold" color={report.performance.effort_index > 0 ? 'green' : 'orange'} mb="1">
                {report.performance.effort_index.toFixed(2)}
              </Text>
              <Text as="div" size="1" color="gray">vs. course average</Text>
            </Box>
          </Grid>

          {report.performance.meetings_attended > 0 && (
            <>
              <Separator size="4" mb="3" />
              <Heading size="3" mb="2">Meeting Attendance</Heading>
              <Grid columns="2" gap="3">
                <Box>
                  <Text as="div" size="2" color="gray" mb="1">Meetings Attended</Text>
                  <Text as="div" size="4" weight="bold">{report.performance.meetings_attended}</Text>
                </Box>
                <Box>
                  <Text as="div" size="2" color="gray" mb="1">Attendance Rate</Text>
                  <Text as="div" size="4" weight="bold">{report.performance.meetings_attended_pct}%</Text>
                </Box>
              </Grid>
            </>
          )}
        </Card>

        {/* Topic Analysis Table */}
        {report.topicTable.length > 0 && (
          <Card>
            <Heading size="5" mb="3">📚 Topic Analysis</Heading>
            <Text size="2" color="gray" mb="3">
              This table shows how you performed on different topics compared to course averages.
            </Text>
            <Box style={{ overflowX: 'auto' }}>
              <Table.Root size="2" variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Topic</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Label</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Attempts/Step</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>First-Pass Rate</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {report.topicTable.map((topic, idx) => {
                    const labelColor = topic.label_topic === 'Comfortable' ? 'green' : 
                                      topic.label_topic === 'Watch' ? 'orange' : 'red';
                    return (
                      <Table.Row key={idx}>
                        <Table.Cell>
                          {topic.lesson_id ? (
                            <a 
                              href={`https://cogniterra.org/lesson/${topic.lesson_id}/step/1`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ 
                                color: 'var(--accent-11)', 
                                textDecoration: 'none',
                                borderBottom: '1px solid var(--accent-11)',
                                transition: 'opacity 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
                              <Text size="2" weight="bold">{topic.topic_title}</Text>
                            </a>
                          ) : (
                            <Text size="2" weight="bold">{topic.topic_title}</Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color={labelColor} size="1">{topic.label_topic}</Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2" color={topic.mean_delta_attempts > 0 ? 'orange' : 'green'}>
                            {topic.attempts_per_step.toFixed(1)}
                            {topic.mean_delta_attempts !== 0 && (
                              <Text as="span" size="1">
                                {' '}({topic.mean_delta_attempts > 0 ? '+' : ''}{topic.mean_delta_attempts.toFixed(1)})
                              </Text>
                            )}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2" color={topic.student_first_pass_rate >= 0.7 ? 'green' : 'orange'}>
                            {(topic.student_first_pass_rate * 100).toFixed(0)}%
                            {topic.mean_delta_first !== 0 && (
                              <Text as="span" size="1">
                                {' '}({topic.mean_delta_first > 0 ? '+' : ''}{(topic.mean_delta_first * 100).toFixed(0)}%)
                              </Text>
                            )}
                          </Text>
                        </Table.Cell>
                        <Table.Cell><Text size="2">{topic.topic_score.toFixed(2)}</Text></Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            </Box>

            <Box mt="3" p="3" style={{ backgroundColor: 'var(--blue-a2)', borderRadius: 'var(--radius-2)' }}>
              <Text as="div" size="2" weight="bold" mb="2">What this table shows:</Text>
              <Flex direction="column" gap="2">
                <Box>
                  <Text as="div" size="2" weight="medium" mb="1">📌 Label</Text>
                  <Text as="div" size="2" color="gray" mb="1">
                    <Badge color="green" size="1">Comfortable</Badge> — Going well, no issues
                  </Text>
                  <Text as="div" size="2" color="gray" mb="1">
                    <Badge color="orange" size="1">Watch</Badge> — Worth reviewing
                  </Text>
                  <Text as="div" size="2" color="gray">
                    <Badge color="red" size="1">Attention</Badge> — Needs extra practice
                  </Text>
                </Box>
                
                <Box>
                  <Text as="div" size="2" weight="medium" mb="1">🔄 Attempts/Step</Text>
                  <Text as="div" size="2" color="gray">
                    How many tries it took to solve problems on average. Lower is usually better. 
                    Numbers in <Text as="span" color="gray" style={{ fontStyle: 'italic' }}>(parentheses)</Text> show if this is more (+) or fewer (−) tries than other students.
                  </Text>
                </Box>
                
                <Box>
                  <Text as="div" size="2" weight="medium" mb="1">✅ First-Pass Rate</Text>
                  <Text as="div" size="2" color="gray">
                    Percentage of problems solved correctly on the first try. Higher means better understanding. 
                    Numbers in <Text as="span" color="gray" style={{ fontStyle: 'italic' }}>(parentheses)</Text> compare to other students.
                  </Text>
                </Box>
                
                <Box>
                  <Text as="div" size="2" weight="medium" mb="1">📊 Score</Text>
                  <Text as="div" size="2" color="gray">
                    Overall difficulty rating for this topic. Higher scores mean the topic was more challenging and might need review.
                  </Text>
                </Box>
              </Flex>
            </Box>
          </Card>
        )}
      </Box>
    </AppLayoutWithAuth>
  );
}

