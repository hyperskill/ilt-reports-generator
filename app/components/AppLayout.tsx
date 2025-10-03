'use client';

import { ReactNode } from 'react';
import { Box, Container, Flex, Heading, Text } from '@radix-ui/themes';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <Box className={styles.layout}>
      <Box className={styles.header}>
        <Container size="4">
          <Flex justify="between" align="center">
            <Heading size="6">Performance Segmentation</Heading>
            {title && <Text size="2" color="gray">{title}</Text>}
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

