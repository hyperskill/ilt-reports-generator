'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Container, Heading, Text, Flex, Button, Card, Spinner, Badge } from '@radix-ui/themes';
import { SharedReport } from '@/lib/types';
import { BlockViewer } from './BlockViewer';
import { generateSimplePDFFromElement } from '@/lib/utils/simple-pdf-generator';
import styles from './view.module.css';

export default function SharedReportViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/shared/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setReport(data.sharedReport);
      setCanEdit(data.sharedReport.can_edit || false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !report) {
      alert('Report content not ready. Please try again.');
      return;
    }
    
    setDownloadingPDF(true);
    try {
      const reportTypePrefix = report.report_type === 'manager' ? 'manager-report' : 'student-report';
      const filename = `${reportTypePrefix}-${report.id}.pdf`;
      await generateSimplePDFFromElement(reportRef.current, filename);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate PDF: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) {
    return (
      <Container size="2" py="9">
        <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
          <Spinner size="3" />
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="2" py="9">
        <Box>
          <Heading size="6" mb="4">Access Denied</Heading>
          <Text color="red">{error}</Text>
          <Button mt="4" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </Box>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container size="2" py="9">
        <Text>Report not found</Text>
      </Container>
    );
  }

  const sortedBlocks = [...report.blocks].sort((a, b) => a.order - b.order);

  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="5">
        {/* Action Buttons - Outside PDF content */}
        <Flex justify="end" gap="2">
          <Button
            variant="soft"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
          >
            {downloadingPDF ? '⏳ Generating PDF... (please wait)' : '📄 Download PDF'}
          </Button>
          {canEdit && (
            <>
              <Button
                onClick={() => router.push(`/reports/shared/${id}/edit`)}
              >
                Edit Report
              </Button>
              <Button
                variant="soft"
                color="green"
                onClick={() => router.push(`/reports/shared/${id}/access`)}
              >
                📤 Manage Access
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            ← Back
          </Button>
          {report.source_report_id && canEdit && (
            <Button
              variant="soft"
              onClick={() => router.push(`/reports/${report.source_report_id}?tab=constructor`)}
            >
              Back to Report
            </Button>
          )}
        </Flex>

        {/* PDF Content */}
        <div ref={reportRef} data-report-content>
          <Flex direction="column" gap="5">
            {/* Header */}
            <Box>
              <Flex gap="2" mb="2" align="center" data-pdf-hide>
                <Badge color={report.report_type === 'manager' ? 'blue' : 'green'}>
                  {report.report_type === 'manager' ? '📊 Manager Report' : '👤 Student Report'}
                </Badge>
              </Flex>
              <Heading size="8" mb="2">{report.title}</Heading>
              {report.description && (
                <Text size="3" color="gray">{report.description}</Text>
              )}
              <Text size="1" color="gray" mt="2">
                Created: {new Date(report.created_at).toLocaleDateString()}
                {report.updated_at !== report.created_at && (
                  <> • Updated: {new Date(report.updated_at).toLocaleDateString()}</>
                )}
              </Text>
            </Box>

          {/* Report Blocks */}
          <Flex direction="column" gap="4">
          {sortedBlocks.map((block) => (
            <Card key={block.id} className={styles.block}>
              <Heading size="5" mb="3">{block.title}</Heading>
              <Box className={styles.content}>
                <BlockViewer block={block} />
              </Box>
            </Card>
          ))}
        </Flex>

        {/* Footer */}
        <Card data-pdf-hide>
          <Flex justify="between" align="center">
            <Text size="2" color="gray">
              Report ID: {report.id}
            </Text>
            {canEdit && (
              <Button
                size="2"
                variant="soft"
                onClick={() => router.push(`/reports/shared/${id}/access`)}
              >
                Manage Access
              </Button>
            )}
          </Flex>
        </Card>
          </Flex>
        </div>
      </Flex>
    </Container>
  );
}
