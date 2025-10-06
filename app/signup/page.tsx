'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Box, Card, Flex, Heading, Text, TextField, Button, Select, Callout } from '@radix-ui/themes';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [requestedRole, setRequestedRole] = useState<'manager' | 'student' | 'admin_request'>('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // All users register with student or manager role
      // Admin requests are noted but user gets 'student' role initially
      const actualRole = requestedRole === 'admin_request' ? 'student' : requestedRole;
      const needsApproval = requestedRole === 'admin_request';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: actualRole,
            requested_admin: needsApproval, // Flag for admin to see
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        if (needsApproval) {
          setSuccess('Account created successfully! You requested admin access. Please wait for administrator approval. You can log in now with view-only access.');
        } else if (data.session) {
          router.push('/dashboard');
          router.refresh();
        } else {
          setError('Please check your email to confirm your account');
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gray-2)',
    }}>
      <Card style={{ width: '100%', maxWidth: '450px' }}>
        <Flex direction="column" gap="4">
          <Heading size="6" align="center">Report Builder</Heading>
          <Text align="center" color="gray">Create your account</Text>

          {requestedRole === 'admin_request' && (
            <Callout.Root color="orange">
              <Callout.Icon>⚠️</Callout.Icon>
              <Callout.Text>
                Admin access requires approval. You'll be registered with view-only access until an administrator approves your request.
              </Callout.Text>
            </Callout.Root>
          )}

          <form onSubmit={handleSignup}>
            <Flex direction="column" gap="3">
              <Box>
                <Text as="div" size="2" weight="bold" mb="1">Full Name</Text>
                <TextField.Root
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Box>

              <Box>
                <Text as="div" size="2" weight="bold" mb="1">Email</Text>
                <TextField.Root
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Box>

              <Box>
                <Text as="div" size="2" weight="bold" mb="1">Password</Text>
                <TextField.Root
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </Box>

              <Box>
                <Text as="div" size="2" weight="bold" mb="1">Account Type</Text>
                <Select.Root value={requestedRole} onValueChange={(value: any) => setRequestedRole(value)}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="student">Student - View reports only</Select.Item>
                    <Select.Item value="manager">Manager - View reports only</Select.Item>
                    <Select.Item value="admin_request">Admin - Request admin access (requires approval)</Select.Item>
                  </Select.Content>
                </Select.Root>
                <Text size="1" color="gray" mt="1" as="div">
                  {requestedRole === 'admin_request' 
                    ? 'You will need administrator approval to create reports' 
                    : 'You can view completed reports'}
                </Text>
              </Box>

              {error && (
                <Callout.Root color="red">
                  <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
              )}

              {success && (
                <Callout.Root color="green">
                  <Callout.Text>{success}</Callout.Text>
                </Callout.Root>
              )}

              <Button type="submit" disabled={loading} size="3">
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </Flex>
          </form>

          <Text size="2" align="center">
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-11)' }}>
              Sign in
            </Link>
          </Text>
        </Flex>
      </Card>
    </Box>
  );
}
