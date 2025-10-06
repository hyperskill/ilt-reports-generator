import { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Box, Container, Flex, Heading } from '@radix-ui/themes';
import { UserNav } from './UserNav';
import styles from './AppLayout.module.css';

interface AuthLayoutProps {
  children: ReactNode;
}

export async function AuthLayout({ children }: AuthLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <Box className={styles.layout}>
      <Box className={styles.header}>
        <Container size="4">
          <Flex justify="between" align="center">
            <Heading size="6">Performance Segmentation</Heading>
            {user && profile && <UserNav user={user} profile={profile} />}
          </Flex>
        </Container>
      </Box>
      <Box className={styles.main}>
        <Container size="4">
          {children}
        </Container>
      </Box>
    </Box>
  );
}

