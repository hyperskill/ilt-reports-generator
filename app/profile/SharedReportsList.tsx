'use client';

import { Box, Card, Flex, Heading, Text, Badge, Button } from '@radix-ui/themes';
import Link from 'next/link';

interface SharedReport {
  id: string;
  title: string;
  description?: string;
  report_type: 'manager' | 'student';
  created_at: string;
  updated_at: string;
}

interface ReportAccess {
  shared_report_id: string;
  granted_at: string;
  shared_reports: SharedReport | SharedReport[] | null;
}

interface SharedReportsListProps {
  reports: ReportAccess[];
}

export default function SharedReportsList({ reports }: SharedReportsListProps) {
  const handleDownloadPDF = (reportId: string, reportTitle: string) => {
    // Simply open the report in a new tab where user can use the print button
    const reportUrl = `/reports/shared/${reportId}/view`;
    window.open(reportUrl, '_blank');
  };

  if (!reports || reports.length === 0) {
    return (
      <Box p="4" style={{ textAlign: 'center' }}>
        <Text size="2" color="gray">
          No reports have been shared with you yet.
        </Text>
      </Box>
    );
  }

  return (
    <Flex direction="column" gap="3">
      {reports.map((access) => {
        // Handle both single object and array from Supabase join
        const report = Array.isArray(access.shared_reports) 
          ? access.shared_reports[0] 
          : access.shared_reports;
        
        if (!report) return null;
        
        return (
          <Card key={access.shared_report_id}>
            <Flex justify="between" align="start">
              <Box>
                <Flex gap="2" mb="1" align="center">
                  <Badge color={report.report_type === 'manager' ? 'blue' : 'green'}>
                    {report.report_type === 'manager' ? '📊 Manager' : '👤 Student'}
                  </Badge>
                </Flex>
                <Heading size="4" mb="1">{report.title}</Heading>
                {report.description && (
                  <Text size="2" color="gray">{report.description}</Text>
                )}
                <Text size="1" color="gray" mt="2">
                  Shared: {new Date(access.granted_at).toLocaleDateString()}
                </Text>
              </Box>
              <Flex gap="2">
                <Link href={`/reports/shared/${report.id}/view`}>
                  <Button size="2" variant="soft">
                    View Report
                  </Button>
                </Link>
                <Button 
                  size="2" 
                  variant="outline"
                  onClick={() => handleDownloadPDF(report.id, report.title)}
                >
                  🖨️ Print
                </Button>
              </Flex>
            </Flex>
          </Card>
        );
      })}
    </Flex>
  );
}

