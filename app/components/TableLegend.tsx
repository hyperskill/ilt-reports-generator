'use client';

import { Box, Card, Heading, Text, Table } from '@radix-ui/themes';
import * as Accordion from '@radix-ui/react-accordion';
import styles from './TableLegend.module.css';

interface LegendProps {
  mode: 'performance' | 'dynamic';
}

export function TableLegend({ mode }: LegendProps) {
  if (mode === 'performance') {
    return (
      <Card>
        <Accordion.Root type="single" collapsible>
          <Accordion.Item value="legend">
            <Accordion.Trigger className={styles.accordionTrigger}>
              <Heading size="3">📊 What the table columns mean</Heading>
            </Accordion.Trigger>
            <Accordion.Content className={styles.accordionContent}>
              <Box pt="3">
                <Text size="2" weight="bold" mb="3">In plain language:</Text>
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
                  <Text size="2" weight="bold" mb="2">Student Groups (Segments):</Text>
                  <Box style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="green">🏆 Highly engaged</Text><br/>
                      Leaders active in meetings: Score ≥80% AND meeting attendance ≥70%
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="green">⚡ Highly efficient</Text><br/>
                      Efficient leaders: Score ≥80% AND few retry attempts (≤3) AND regular study
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="blue">👥 Moderately engaged</Text><br/>
                      Average level, active: Score 30-80% AND attend meetings (≥60%) AND consistency ≥0.4
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="orange">💪 Highly effortful</Text><br/>
                      Trying hard but with difficulties: High effort AND struggle index ≥0.6
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="red">😴 Low participation</Text><br/>
                      Low involvement: Few attempts (&lt;20) OR very low activity
                    </Text>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="gray">📊 Moderately performing</Text><br/>
                      Average level: All other students
                    </Text>
                  </Box>
                </Box>

                <Box mt="4" p="3" style={{ background: 'var(--blue-a2)', borderRadius: 'var(--radius-2)' }}>
                  <Text size="2" weight="bold" mb="1">💡 Important to know:</Text>
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
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </Card>
    );
  }

  return (
    <Card>
      <Accordion.Root type="single" collapsible>
        <Accordion.Item value="legend">
          <Accordion.Trigger className={styles.accordionTrigger}>
            <Heading size="3">📈 What the activity chart shows</Heading>
          </Accordion.Trigger>
          <Accordion.Content className={styles.accordionContent}>
            <Box pt="3">
              <Text size="2" weight="bold" mb="3">In plain language:</Text>
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
                <Text size="2" weight="bold" mb="2">Activity Types (Easing Patterns):</Text>
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
                <Text size="2" weight="bold" mb="2">How to read Frontload Index:</Text>
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
                <Text size="2" weight="bold" mb="1">💡 How activity is calculated:</Text>
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
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </Card>
  );
}
