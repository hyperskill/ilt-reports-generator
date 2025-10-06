'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Box, Card, Flex, Heading, Text, TextField, Button, Select } from '@radix-ui/themes';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'student'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
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
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <Flex direction="column" gap="4">
          <Heading size="6" align="center">Report Builder</Heading>
          <Text align="center" color="gray">Create your account</Text>

          <form onSubmit={handleSignup}>
            <Flex direction="column" gap="3">
              <Box>
                <Text as="label" size="2" weight="bold" mb="1">Full Name</Text>
                <TextField.Root
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" mb="1">Email</Text>
                <TextField.Root
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" mb="1">Password</Text>
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
                <Text as="label" size="2" weight="bold" mb="1">Role</Text>
                <Select.Root value={role} onValueChange={(value: any) => setRole(value)}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="student">Student - View reports only</Select.Item>
                    <Select.Item value="manager">Manager - View reports only</Select.Item>
                    <Select.Item value="admin">Admin - Create and manage reports</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>

              {error && (
                <Text size="2" color={error.includes('check your email') ? 'green' : 'red'}>
                  {error}
                </Text>
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

