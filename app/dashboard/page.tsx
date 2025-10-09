import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Box, Card, Flex, Heading, Text, Button, Table, Badge } from '@radix-ui/themes';
import { UserNav } from '@/app/components/UserNav';
import { ReportActions } from './ReportActions';
import Link from 'next/link';

// Disable caching for this page to always show fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
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

  // Fetch recent reports based on role
  let recentReports: any[] = [];
  let managerReports: any[] = [];
  let studentReports: any[] = [];
  
  if (isAdmin) {
    // Admins see all base reports
    const { data } = await supabase
      .from('reports')
      .select('id, title, description, created_at, created_by')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);
    recentReports = data || [];
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
    
    // Transform and separate by type
    const allSharedReports = (data || [])
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
          isShared: true,
        } : null;
      })
      .filter(Boolean);
    
    // Separate by report type
    managerReports = allSharedReports.filter((r: any) => r.report_type === 'manager');
    studentReports = allSharedReports.filter((r: any) => r.report_type === 'student');
  }

  return (
    <Box p="6">
      <Flex direction="column" gap="6" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Flex justify="between" align="center">
          <Box>
            <Heading size="8">Dashboard</Heading>
            <Text size="3" color="gray">Welcome back, {profile?.full_name || user.email}</Text>
          </Box>
          <UserNav user={user} profile={profile} />
        </Flex>

        <Flex gap="4" wrap="wrap">
          {isAdmin && (
            <>
              <Card style={{ flex: '1', minWidth: '300px' }}>
                <Flex direction="column" gap="3">
                  <Heading size="5">📊 Create Report</Heading>
                  <Text size="2" color="gray">
                    Upload data files and generate performance analysis reports for your cohort.
                  </Text>
                  <Link href="/upload">
                    <Button size="3" style={{ width: '100%' }}>
                      Create New Report
                    </Button>
                  </Link>
                </Flex>
              </Card>

              <Card style={{ flex: '1', minWidth: '300px' }}>
                <Flex direction="column" gap="3">
                  <Heading size="5">👥 Manage Users</Heading>
                  <Text size="2" color="gray">
                    Approve admin requests and manage user roles and permissions.
                  </Text>
                  <Link href="/admin/users">
                    <Button size="3" style={{ width: '100%' }} color="orange">
                      User Management
                    </Button>
                  </Link>
                </Flex>
              </Card>
            </>
          )}

          <Card style={{ flex: '1', minWidth: '300px' }}>
            <Flex direction="column" gap="3">
              <Heading size="5">📈 View Reports</Heading>
              <Text size="2" color="gray">
                Browse and analyze completed reports from all cohorts.
              </Text>
              <Link href="/reports">
                <Button variant="soft" size="3" style={{ width: '100%' }}>
                  Browse Reports
                </Button>
              </Link>
            </Flex>
          </Card>
        </Flex>

        {!isAdmin && (
          <Card>
            <Flex direction="column" gap="2">
              <Heading size="4">ℹ️ Limited Access</Heading>
              <Text size="2" color="gray">
                Your account has <Text weight="bold">{profile?.role}</Text> access. 
                You can view completed reports but cannot create new ones. 
                Contact an administrator if you need elevated permissions.
              </Text>
            </Flex>
          </Card>
        )}

        {/* Recent Reports for Admins */}
        {isAdmin && recentReports && recentReports.length > 0 && (
          <Card>
            <Flex direction="column" gap="4">
              <Flex justify="between" align="center">
                <Heading size="5">Recent Reports</Heading>
                <Link href="/reports">
                  <Button variant="soft" size="2">
                    View All
                  </Button>
                </Link>
              </Flex>

              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {recentReports.map((report) => (
                    <Table.Row key={report.id}>
                      <Table.Cell>
                        <Text weight="bold">{report.title}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {report.description || '—'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {new Date(report.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <ReportActions
                          reportId={report.id}
                          reportTitle={report.title}
                          reportDescription={report.description}
                          isAdmin={isAdmin}
                          isOwner={report.created_by === user.id}
                          isShared={report.isShared || false}
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
        )}

        {/* Manager Reports for Non-Admins */}
        {!isAdmin && managerReports && managerReports.length > 0 && (
          <Card>
            <Flex direction="column" gap="4">
              <Flex justify="between" align="center">
                <Heading size="5">📊 Manager Reports</Heading>
                <Link href="/reports">
                  <Button variant="soft" size="2">
                    View All
                  </Button>
                </Link>
              </Flex>

              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Shared</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {managerReports.map((report) => (
                    <Table.Row key={report.id}>
                      <Table.Cell>
                        <Flex gap="2" align="center">
                          <Text weight="bold">{report.title}</Text>
                          <Badge size="1" color="blue">Manager</Badge>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {report.description || '—'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {new Date(report.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <ReportActions
                          reportId={report.id}
                          reportTitle={report.title}
                          reportDescription={report.description}
                          isAdmin={isAdmin}
                          isOwner={false}
                          isShared={true}
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
        )}

        {/* Student Reports for Non-Admins */}
        {!isAdmin && studentReports && studentReports.length > 0 && (
          <Card>
            <Flex direction="column" gap="4">
              <Flex justify="between" align="center">
                <Heading size="5">👤 Student Reports</Heading>
                <Link href="/reports">
                  <Button variant="soft" size="2">
                    View All
                  </Button>
                </Link>
              </Flex>

              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Shared</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {studentReports.map((report) => (
                    <Table.Row key={report.id}>
                      <Table.Cell>
                        <Flex gap="2" align="center">
                          <Text weight="bold">{report.title}</Text>
                          <Badge size="1" color="green">Student</Badge>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {report.description || '—'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {new Date(report.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <ReportActions
                          reportId={report.id}
                          reportTitle={report.title}
                          reportDescription={report.description}
                          isAdmin={isAdmin}
                          isOwner={false}
                          isShared={true}
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
        )}

        {/* No reports message for non-admins */}
        {!isAdmin && managerReports.length === 0 && studentReports.length === 0 && (
          <Card>
            <Flex direction="column" align="center" gap="3" p="6">
              <Text size="5" weight="bold">No reports shared with you yet</Text>
              <Text size="3" color="gray">
                Reports will appear here once an administrator shares them with you.
              </Text>
            </Flex>
          </Card>
        )}
      </Flex>
    </Box>
  );
}
