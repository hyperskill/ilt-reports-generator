import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Box, Card, Flex, Heading, Text, Code, Button } from '@radix-ui/themes';
import Link from 'next/link';

export default async function DebugAuthPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <Box p="6">
      <Flex direction="column" gap="6" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Heading size="8">🔍 Auth Debug Info</Heading>

        <Card>
          <Flex direction="column" gap="3">
            <Heading size="5">User Info</Heading>
            <Box>
              <Text size="2" weight="bold">User ID:</Text>
              <Code>{user.id}</Code>
            </Box>
            <Box>
              <Text size="2" weight="bold">Email:</Text>
              <Text size="2">{user.email}</Text>
            </Box>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Heading size="5">Profile Info</Heading>
            {error && (
              <Text size="2" color="red">Error loading profile: {error.message}</Text>
            )}
            {profile && (
              <>
                <Box>
                  <Text size="2" weight="bold">Full Name:</Text>
                  <Text size="2">{profile.full_name || 'Not set'}</Text>
                </Box>
                <Box>
                  <Text size="2" weight="bold">Role:</Text>
                  <Text size="2" weight="bold" color={profile.role === 'admin' ? 'green' : 'blue'}>
                    {profile.role}
                  </Text>
                </Box>
                <Box>
                  <Text size="2" weight="bold">Requested Admin:</Text>
                  <Text size="2">{profile.requested_admin ? 'Yes' : 'No'}</Text>
                </Box>
                <Box>
                  <Text size="2" weight="bold">Created At:</Text>
                  <Text size="2">{new Date(profile.created_at).toLocaleString()}</Text>
                </Box>
              </>
            )}
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Heading size="5">Raw Profile Data</Heading>
            <Code style={{ padding: '1rem', borderRadius: '4px', background: 'var(--gray-3)' }}>
              <pre>{JSON.stringify(profile, null, 2)}</pre>
            </Code>
          </Flex>
        </Card>

        <Flex gap="3">
          <Link href="/dashboard">
            <Button variant="soft">Back to Dashboard</Button>
          </Link>
          <Link href="/login">
            <Button color="red">Logout & Re-login</Button>
          </Link>
        </Flex>

        <Card>
          <Flex direction="column" gap="2">
            <Heading size="4">💡 Troubleshooting</Heading>
            <Text size="2">
              If your role shows as <Code>admin</Code> above but you still can't access admin features:
            </Text>
            <Text size="2" as="div">
              1. Click "Logout & Re-login" button above<br/>
              2. Sign in again<br/>
              3. Your admin permissions should now work
            </Text>
          </Flex>
        </Card>
      </Flex>
    </Box>
  );
}

