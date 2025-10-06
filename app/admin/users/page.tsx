import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Box, Card, Flex, Heading, Text, Table, Badge, Button } from '@radix-ui/themes';
import { UserNav } from '@/app/components/UserNav';
import { ApproveAdminButton } from './ApproveAdminButton';
import { ChangeRoleButton } from './ChangeRoleButton';

export default async function AdminUsersPage() {
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

  // Only admins can access this page
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get all users
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Get pending admin requests
  const pendingAdmins = allUsers?.filter(u => u.requested_admin && u.role !== 'admin') || [];
  const otherUsers = allUsers?.filter(u => !u.requested_admin || u.role === 'admin') || [];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'manager': return 'blue';
      case 'student': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <Box p="6">
      <Flex direction="column" gap="6" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <Flex justify="between" align="center">
          <Box>
            <Heading size="8">User Management</Heading>
            <Text size="3" color="gray">Approve admin requests and manage user roles</Text>
          </Box>
          <UserNav user={user} profile={profile} />
        </Flex>

        {/* Pending Admin Requests */}
        {pendingAdmins.length > 0 && (
          <Card>
            <Flex direction="column" gap="4">
              <Flex align="center" gap="2">
                <Heading size="5">⚠️ Pending Admin Requests</Heading>
                <Badge color="orange">{pendingAdmins.length}</Badge>
              </Flex>
              
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Current Role</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Requested</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {pendingAdmins.map((u) => (
                    <Table.Row key={u.id}>
                      <Table.Cell>
                        <Text weight="bold">{u.full_name || 'No name'}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">{u.email}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getRoleBadgeColor(u.role)}>
                          {u.role}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {new Date(u.created_at).toLocaleDateString()}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex gap="2">
                          <ApproveAdminButton userId={u.id} currentAdminId={user.id} />
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
        )}

        {/* All Users */}
        <Card>
          <Flex direction="column" gap="4">
            <Heading size="5">All Users</Heading>
            
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Joined</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {otherUsers.map((u) => (
                  <Table.Row key={u.id}>
                    <Table.Cell>
                      <Text weight="bold">{u.full_name || 'No name'}</Text>
                      {u.id === user.id && (
                        <Badge color="green" ml="2" size="1">You</Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">{u.email}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={getRoleBadgeColor(u.role)}>
                        {u.role}
                      </Badge>
                      {u.admin_approved_at && (
                        <Text size="1" color="gray" ml="2">
                          (approved {new Date(u.admin_approved_at).toLocaleDateString()})
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {new Date(u.created_at).toLocaleDateString()}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      {u.id !== user.id && (
                        <ChangeRoleButton 
                          userId={u.id} 
                          currentRole={u.role}
                          currentAdminId={user.id}
                        />
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="2">
            <Heading size="4">ℹ️ About User Management</Heading>
            <Text size="2" color="gray">
              • <Text weight="bold">Admin</Text> - Can create reports and manage users<br/>
              • <Text weight="bold">Manager</Text> - Can view all reports<br/>
              • <Text weight="bold">Student</Text> - Can view completed reports
            </Text>
          </Flex>
        </Card>
      </Flex>
    </Box>
  );
}

