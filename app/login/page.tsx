'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Box, Card, Flex, Heading, Text, TextField, Button } from '@radix-ui/themes';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login');
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
          <Text align="center" color="gray">Sign in to your account</Text>

          <form onSubmit={handleLogin}>
            <Flex direction="column" gap="3">
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
                />
              </Box>

              {error && (
                <Text size="2" color="red">{error}</Text>
              )}

              <Button type="submit" disabled={loading} size="3">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Flex>
          </form>

          <Text size="2" align="center">
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--accent-11)' }}>
              Sign up
            </Link>
          </Text>
        </Flex>
      </Card>
    </Box>
  );
}

