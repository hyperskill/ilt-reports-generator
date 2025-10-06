'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Box, Container, Flex, Heading, Text } from '@radix-ui/themes';
import { createClient } from '@/lib/supabase/client';
import { UserNav } from './UserNav';
import styles from './AppLayout.module.css';
import type { User } from '@supabase/supabase-js';

interface AppLayoutWithAuthProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayoutWithAuth({ children, title, subtitle }: AppLayoutWithAuthProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name?: string; role: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    };

    getUser();
  }, [supabase]);

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
          {(title || subtitle) && (
            <Box mb="5">
              {title && <Heading size="8" mb="2">{title}</Heading>}
              {subtitle && <Text size="3" color="gray">{subtitle}</Text>}
            </Box>
          )}
          {children}
        </Container>
      </Box>
    </Box>
  );
}

