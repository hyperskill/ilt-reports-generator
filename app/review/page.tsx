'use client';

import { useRouter } from 'next/navigation';
import { Box, Button, Flex, Heading, Text, Card, Badge, Table } from '@radix-ui/themes';
import { AppLayoutWithAuthWithAuth } from '@/app/components/AppLayoutWithAuthWithAuth';
import { useAppContext } from '@/lib/context/AppContext';
import { findColumn } from '@/lib/utils/csv-parser';
import styles from './review.module.css';

export default function ReviewPage() {
  const router = useRouter();
  const { files } = useAppContext();

  const getRecognizedColumns = (fileKey: string, data: any[]) => {
    if (!data || data.length === 0) return [];
    
    const firstRow = data[0];
    const recognized: string[] = [];

    const columnMappings: Record<string, string[][]> = {
      grade_book: [['user_id', 'userid', 'uid'], ['total', 'score']],
      learners: [['user_id', 'userid', 'uid'], ['first_name', 'firstname'], ['last_name', 'lastname']],
      submissions: [['user_id', 'userid', 'uid'], ['step_id', 'stepid'], ['status', 'result'], ['timestamp', 'time']],
      meetings: [['user_id', 'userid', 'uid']],
    };

    const mappings = columnMappings[fileKey] || [];
    for (const aliases of mappings) {
      const found = findColumn(firstRow, aliases);
      if (found) {
        recognized.push(found);
      }
    }

    // Check for meeting columns (date headers)
    if (fileKey === 'meetings') {
      const meetingCols = Object.keys(firstRow).filter(col => 
        /^\[\d{2}\.\d{2}\.\d{4}\]/.test(col)
      );
      recognized.push(...meetingCols);
    }

    return recognized;
  };

  const hasTimestamps = () => {
    if (!files.submissions?.data) return false;
    const firstRow = files.submissions.data[0];
    return !!findColumn(firstRow, ['timestamp', 'time', 'submission_time', 'created_at']);
  };

  const allFilesValid = () => {
    return files.grade_book && files.learners && files.submissions;
  };

  return (
    <AppLayoutWithAuth
      title="Review & Confirm"
      subtitle="Verify that we've correctly identified your data columns."
    >
      <Flex direction="column" gap="4">
        {/* Status Banner */}
        <Card>
          {allFilesValid() ? (
            <Flex align="center" gap="2">
              <Badge color="green">✓ All required fields recognized</Badge>
              {!hasTimestamps() && (
                <Badge color="amber">
                  No timestamps found → Dynamic mode will use row order
                </Badge>
              )}
            </Flex>
          ) : (
            <Badge color="red">Missing required files</Badge>
          )}
        </Card>

        {/* File Previews */}
        {Object.entries(files).map(([key, file]) => {
          if (!file) return null;
          const recognizedColumns = getRecognizedColumns(key, file.data);
          const preview = file.data.slice(0, 10);

          return (
            <Card key={key}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Heading size="4">{key.replace('_', ' ').toUpperCase()}</Heading>
                  <Text size="2" color="gray">
                    {file.data.length} rows
                  </Text>
                </Flex>

                <Box>
                  <Text size="2" weight="bold" mb="2">Recognized columns:</Text>
                  <Flex gap="2" wrap="wrap">
                    {recognizedColumns.map(col => (
                      <Badge key={col} color="green" variant="soft">
                        {col}
                      </Badge>
                    ))}
                  </Flex>
                </Box>

                <Box className={styles.tableContainer}>
                  <Table.Root size="1" variant="surface">
                    <Table.Header>
                      <Table.Row>
                        {Object.keys(preview[0] || {}).slice(0, 6).map(col => (
                          <Table.ColumnHeaderCell key={col}>
                            {col}
                          </Table.ColumnHeaderCell>
                        ))}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {preview.map((row, idx) => (
                        <Table.Row key={idx}>
                          {Object.values(row).slice(0, 6).map((val: any, i) => (
                            <Table.Cell key={i}>
                              <Text size="1">{String(val).slice(0, 30)}</Text>
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              </Flex>
            </Card>
          );
        })}
      </Flex>

      <Flex gap="3" mt="6" justify="between">
        <Button variant="soft" onClick={() => router.push('/upload')}>
          Back
        </Button>
        <Button onClick={() => router.push('/exclusions')} disabled={!allFilesValid()}>
          Looks good
        </Button>
      </Flex>
    </AppLayoutWithAuth>
  );
}

