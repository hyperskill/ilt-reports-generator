import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Box, Card, Flex, Heading, Text, Badge, Separator } from '@radix-ui/themes';
import { UserNav } from '@/app/components/UserNav';
import Link from 'next/link';

export default async function ProfilePage() {
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'manager': return 'blue';
      case 'student': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Box p="6">
      <Flex direction="column" gap="6" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Flex justify="between" align="center">
          <Box>
            <Heading size="8">Profile</Heading>
            <Text size="3" color="gray">Manage your account information</Text>
          </Box>
          <UserNav user={user} profile={profile} />
        </Flex>

        <Card>
          <Flex direction="column" gap="4">
            <Flex justify="between" align="center">
              <Heading size="5">Account Information</Heading>
              <Badge color={getRoleBadgeColor(profile?.role || 'student')} size="2">
                {profile?.role || 'student'}
              </Badge>
            </Flex>

            <Separator size="4" />

            <Box>
              <Text as="div" size="2" weight="bold" mb="1" color="gray">
                Full Name
              </Text>
              <Text size="3">{profile?.full_name || '—'}</Text>
            </Box>

            <Box>
              <Text as="div" size="2" weight="bold" mb="1" color="gray">
                Email Address
              </Text>
              <Text size="3">{user.email}</Text>
            </Box>

            <Box>
              <Text as="div" size="2" weight="bold" mb="1" color="gray">
                User ID
              </Text>
              <Text size="2" style={{ fontFamily: 'monospace', color: 'var(--gray-11)' }}>
                {user.id}
              </Text>
            </Box>

            <Box>
              <Text as="div" size="2" weight="bold" mb="1" color="gray">
                Account Created
              </Text>
              <Text size="3">
                {new Date(user.created_at || '').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </Box>

            {profile?.requested_admin && !profile?.admin_approved_at && (
              <Box 
                p="3" 
                style={{ 
                  background: 'var(--orange-a2)', 
                  borderRadius: 'var(--radius-3)',
                  border: '1px solid var(--orange-a4)'
                }}
              >
                <Flex align="center" gap="2">
                  <Text size="2" weight="bold" color="orange">
                    ⏳ Admin Access Pending
                  </Text>
                </Flex>
                <Text size="2" color="gray" mt="1">
                  Your admin access request is awaiting approval from an administrator.
                </Text>
              </Box>
            )}
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="4">
            <Heading size="5">Role & Permissions</Heading>
            <Separator size="4" />

            <Box>
              <Text as="div" size="2" weight="bold" mb="2">
                Current Role: <Badge color={getRoleBadgeColor(profile?.role || 'student')}>{profile?.role || 'student'}</Badge>
              </Text>
              
              {profile?.role === 'admin' && (
                <Box>
                  <Text size="2" color="gray">
                    ✅ Create and manage reports<br/>
                    ✅ View all reports<br/>
                    ✅ Manage users and approve admins<br/>
                    ✅ Add comments to reports and students
                  </Text>
                </Box>
              )}

              {profile?.role === 'manager' && (
                <Box>
                  <Text size="2" color="gray">
                    ✅ View all reports<br/>
                    ❌ Cannot create reports<br/>
                    ❌ Cannot manage users
                  </Text>
                </Box>
              )}

              {profile?.role === 'student' && (
                <Box>
                  <Text size="2" color="gray">
                    ✅ View assigned reports<br/>
                    ❌ Cannot create reports<br/>
                    ❌ Cannot manage users
                  </Text>
                </Box>
              )}
            </Box>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Heading size="5">Quick Links</Heading>
            <Separator size="4" />
            
            <Link href="/dashboard">
              <Text size="2" style={{ color: 'var(--accent-11)', textDecoration: 'none' }}>
                → Go to Dashboard
              </Text>
            </Link>

            {profile?.role === 'admin' && (
              <Link href="/admin/users">
                <Text size="2" style={{ color: 'var(--accent-11)', textDecoration: 'none' }}>
                  → Manage Users
                </Text>
              </Link>
            )}

            <Link href="/reports">
              <Text size="2" style={{ color: 'var(--accent-11)', textDecoration: 'none' }}>
                → View Reports
              </Text>
            </Link>
          </Flex>
        </Card>
      </Flex>
    </Box>
  );
}

