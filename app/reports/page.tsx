import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Box, Card, Flex, Heading, Text, Table, Badge, Button } from '@radix-ui/themes';
import { UserNav } from '@/app/components/UserNav';
import Link from 'next/link';
import { DeleteReportButton } from './DeleteReportButton';
import { RenameReportButton } from './RenameReportButton';

export default async function ReportsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  // Fetch reports based on role
  let reports: any[] = [];
  
  if (isAdmin) {
    // Admins see all base reports
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    reports = data || [];
  } else {
    // Non-admins see only shared reports they have access to
    const { data } = await supabase
      .from('report_access')
      .select(`
        shared_report_id,
        granted_at,
        shared_reports (
          id,
          title,
          description,
          created_at,
          created_by,
          report_type
        )
      `)
      .eq('user_id', user.id)
      .order('granted_at', { ascending: false });
    
    // Transform to match the expected format
    reports = (data || [])
      .map((access: any) => {
        const report = Array.isArray(access.shared_reports) 
          ? access.shared_reports[0] 
          : access.shared_reports;
        return report ? {
          id: report.id,
          title: report.title,
          description: report.description,
          created_at: report.created_at,
          created_by: report.created_by,
          report_type: report.report_type,
          isShared: true, // Flag to identify shared reports
        } : null;
      })
      .filter(Boolean);
  }

  return (
    <Box p="6">
      <Flex direction="column" gap="6" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <Flex justify="between" align="center">
          <Box>
            <Heading size="8">Reports</Heading>
            <Text size="3" color="gray">Browse and analyze saved reports</Text>
          </Box>
          <UserNav user={user} profile={profile} />
        </Flex>

        {reports && reports.length > 0 ? (
          <Card>
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Created By</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {reports.map((report: any) => {
                  const viewUrl = report.isShared ? `/reports/shared/${report.id}/view` : `/reports/${report.id}`;
                  const showAdminActions = isAdmin && !report.isShared; // Only show edit/delete for base reports
                  
                  return (
                    <Table.Row key={report.id}>
                      <Table.Cell>
                        <Link href={viewUrl} style={{ textDecoration: 'none' }}>
                          <Flex gap="2" align="center">
                            <Text weight="bold" style={{ color: 'var(--accent-11)' }}>
                              {report.title}
                            </Text>
                            {report.isShared && (
                              <Badge size="1" color={report.report_type === 'manager' ? 'blue' : 'green'}>
                                {report.report_type === 'manager' ? 'Manager' : 'Student'}
                              </Badge>
                            )}
                          </Flex>
                        </Link>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {report.description || '—'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {report.created_by === user.id ? 'You' : 'Admin'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {new Date(report.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex gap="2">
                          <Link href={viewUrl}>
                            <Button size="1" variant="soft">
                              View
                            </Button>
                          </Link>
                          {showAdminActions && (
                            <>
                              <RenameReportButton 
                                reportId={report.id} 
                                currentTitle={report.title}
                                currentDescription={report.description}
                              />
                              <DeleteReportButton reportId={report.id} reportTitle={report.title} />
                            </>
                          )}
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Card>
        ) : (
          <Card>
            <Flex direction="column" align="center" gap="3" p="6">
              <Text size="5" weight="bold">No reports yet</Text>
              <Text size="3" color="gray">
                {isAdmin 
                  ? 'Create your first report by uploading data files'
                  : 'Reports will appear here once admins create them'
                }
              </Text>
              {isAdmin && (
                <Link href="/upload">
                  <Button size="3" mt="2">
                    Create First Report
                  </Button>
                </Link>
              )}
            </Flex>
          </Card>
        )}
      </Flex>
    </Box>
  );
}

