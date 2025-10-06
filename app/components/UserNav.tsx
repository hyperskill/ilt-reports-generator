'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Flex, Text, DropdownMenu } from '@radix-ui/themes';
import type { User } from '@supabase/supabase-js';

interface UserNavProps {
  user: User;
  profile: {
    full_name?: string;
    role: string;
  } | null;
}

export function UserNav({ user, profile }: UserNavProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="soft">
          <Flex align="center" gap="2">
            <Text size="2">{profile?.full_name || user.email}</Text>
            <Text size="1" color="gray">({profile?.role})</Text>
          </Flex>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onClick={() => router.push('/profile')}>
          Profile
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={() => router.push('/dashboard')}>
          Dashboard
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item color="red" onClick={handleLogout}>
          Logout
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

