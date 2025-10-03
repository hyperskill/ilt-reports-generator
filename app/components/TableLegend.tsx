'use client';

import { Box, Card, Heading, Text, Table } from '@radix-ui/themes';
import { Accordion } from 'radix-ui';

interface LegendProps {
  mode: 'performance' | 'dynamic';
}

export function TableLegend({ mode }: LegendProps) {
  if (mode === 'performance') {
    return (
      <Card>
        <Accordion.Root type="single" collapsible>
          <Accordion.Item value="legend">
            <Accordion.Trigger>
              <Heading size="3">📊 Performance Segmentation - Column Legend</Heading>
            </Accordion.Trigger>
            <Accordion.Content>
              <Box>
                <Text size="2" weight="bold" mb="3">Column Descriptions:</Text>
                <Table.Root size="1" variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Column</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Calculation</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">User ID</Text></Table.Cell>
                      <Table.Cell>Unique identifier for the learner</Table.Cell>
                      <Table.Cell>From learners.csv or grade_book.csv</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Name</Text></Table.Cell>
                      <Table.Cell>Full name of the learner</Table.Cell>
                      <Table.Cell>first_name + last_name from learners.csv</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Score %</Text></Table.Cell>
                      <Table.Cell>Percentage score relative to highest score</Table.Cell>
                      <Table.Cell>(total / max_total) × 100</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Submissions</Text></Table.Cell>
                      <Table.Cell>Total number of submissions made</Table.Cell>
                      <Table.Cell>Count of all submission records</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Success Rate</Text></Table.Cell>
                      <Table.Cell>Percentage of correct submissions</Table.Cell>
                      <Table.Cell>(correct_submissions / total_submissions) × 100</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Persistence</Text></Table.Cell>
                      <Table.Cell>Average submissions per unique step</Table.Cell>
                      <Table.Cell>total_submissions / unique_steps</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Efficiency</Text></Table.Cell>
                      <Table.Cell>Correct submissions per unique step</Table.Cell>
                      <Table.Cell>correct_submissions / unique_steps</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Segment</Text></Table.Cell>
                      <Table.Cell>Performance classification</Table.Cell>
                      <Table.Cell>Rule-based assignment (see segment definitions below)</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Meetings %</Text></Table.Cell>
                      <Table.Cell>Percentage of meetings attended</Table.Cell>
                      <Table.Cell>(meetings_attended / total_meetings) × 100</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>

                <Box mt="4">
                  <Text size="2" weight="bold" mb="2">Segment Definitions:</Text>
                  <Box style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="green">Leader engaged:</Text> Score ≥80% AND meetings ≥70%
                    </Text>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="green">Leader efficient:</Text> Score ≥80% AND persistence ≤3
                    </Text>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="blue">Balanced + engaged:</Text> 30% ≤ Score &lt;80% AND meetings ≥60%
                    </Text>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="red">Low engagement but socially active:</Text> Score &lt;30% AND meetings ≥50%
                    </Text>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="orange">Hardworking but struggling:</Text> Score &lt;30% AND persistence ≥5
                    </Text>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="red">Low engagement:</Text> Score &lt;30% AND submissions &lt;20
                    </Text>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="gray">Balanced middle:</Text> All other cases
                    </Text>
                  </Box>
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
          <Accordion.Trigger>
            <Heading size="3">📈 Dynamic/Easing Segmentation - Column Legend</Heading>
          </Accordion.Trigger>
          <Accordion.Content>
            <Box>
              <Text size="2" weight="bold" mb="3">Column Descriptions:</Text>
              <Table.Root size="1" variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Column</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Calculation</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell><Text weight="bold">User ID</Text></Table.Cell>
                    <Table.Cell>Unique identifier for the learner</Table.Cell>
                    <Table.Cell>From learners.csv or grade_book.csv</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Text weight="bold">Name</Text></Table.Cell>
                    <Table.Cell>Full name of the learner</Table.Cell>
                    <Table.Cell>first_name + last_name from learners.csv</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Text weight="bold">Easing Label</Text></Table.Cell>
                    <Table.Cell>CSS-like easing pattern classification</Table.Cell>
                    <Table.Cell>Based on cumulative activity curve shape</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Text weight="bold">Frontload Index</Text></Table.Cell>
                    <Table.Cell>How early activity accumulates</Table.Cell>
                    <Table.Cell>0.5 - t50 (positive = early, negative = late)</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Text weight="bold">t25/t50/t75</Text></Table.Cell>
                    <Table.Cell>Time points for 25%, 50%, 75% completion</Table.Cell>
                    <Table.Cell>Normalized time (0-1) when cumulative activity reaches quartiles</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Text weight="bold">Score %</Text></Table.Cell>
                    <Table.Cell>Percentage score for context</Table.Cell>
                    <Table.Cell>(total / max_total) × 100</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>

              <Box mt="4">
                <Text size="2" weight="bold" mb="2">Easing Pattern Definitions:</Text>
                <Box style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="gray">linear:</Text> Steady, consistent activity throughout
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="blue">ease:</Text> Moderate acceleration, then deceleration
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="orange">ease-in:</Text> Slow start, then accelerates (late loading)
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="green">ease-out:</Text> Fast start, then slows down (early loading)
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="purple">ease-in-out:</Text> S-curve: slow start, fast middle, slow end
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="red">no-activity:</Text> No timestamp data or activity recorded
                  </Text>
                </Box>
              </Box>

              <Box mt="4">
                <Text size="2" weight="bold" mb="2">Frontload Index Interpretation:</Text>
                <Box style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="green">Positive (&gt;0.1):</Text> Early loading - most activity happens early
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="orange">Negative (&lt;-0.1):</Text> Late loading - most activity happens late
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="gray">Near zero (-0.1 to 0.1):</Text> Balanced activity distribution
                  </Text>
                </Box>
              </Box>

              <Box mt="4">
                <Text size="2" weight="bold" mb="2">Activity Calculation:</Text>
                <Box style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  <Text as="p" mb="1">
                    <Text weight="bold">Platform Activity:</Text> Weighted submissions (correct=1.0, incorrect=0.25)
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold">Meeting Activity:</Text> Binary attendance (1.5x weight)
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold">Total Activity:</Text> Platform + Meeting activity per day
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold">Normalization:</Text> Time (0→1) and Activity (0→1) for curve comparison
                  </Text>
                </Box>
              </Box>
            </Box>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </Card>
  );
}
