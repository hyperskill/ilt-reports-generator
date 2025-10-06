import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Box, Card, Flex, Heading, Text, Button, Table, Badge } from '@radix-ui/themes';
import { UserNav } from '@/app/components/UserNav';
import Link from 'next/link';

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

  // Fetch recent reports
  const { data: recentReports } = await supabase
    .from('reports')
    .select('id, title, description, created_at, created_by')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);

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

          <Card style={{ flex: '1', minWidth: '300px' }}>
            <Flex direction="column" gap="3">
              <Heading size="5">👤 Profile</Heading>
              <Text size="2" color="gray">
                View and update your account settings and preferences.
              </Text>
              <Link href="/profile">
                <Button variant="soft" size="3" style={{ width: '100%' }}>
                  View Profile
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

        {/* Recent Reports */}
        {recentReports && recentReports.length > 0 && (
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
                        <Link href={`/reports/${report.id}`}>
                          <Button size="1" variant="soft">
                            View
                          </Button>
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
        )}
      </Flex>
    </Box>
  );
}
