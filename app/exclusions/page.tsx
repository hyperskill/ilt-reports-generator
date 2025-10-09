'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Flex, Text, Card, TextField, Badge } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { useAppContext } from '@/lib/context/AppContext';
import styles from './exclusions.module.css';

export default function ExclusionsPage() {
  const router = useRouter();
  const { excludedUserIds, setExcludedUserIds } = useAppContext();
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const newIds = inputValue
      .split(/[,\s\n]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0 && !excludedUserIds.includes(id));
    
    if (newIds.length > 0) {
      setExcludedUserIds([...excludedUserIds, ...newIds]);
      setInputValue('');
    }
  };

  const handleRemove = (id: string) => {
    setExcludedUserIds(excludedUserIds.filter(uid => uid !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <AppLayoutWithAuth
      title="Exclude IDs"
      subtitle="Optionally exclude specific user IDs from analysis."
    >
      <Card>
        <Flex direction="column" gap="4">
          <Box>
            <Text size="2" weight="bold" mb="2">Enter User IDs to Exclude</Text>
            <Text size="2" color="gray" as="p" mb="3">
              Enter one or more user IDs separated by commas, spaces, or line breaks.
            </Text>
            <Flex gap="2">
              <TextField.Root
                placeholder="e.g., 123, 456, 789"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ flex: 1 }}
              />
              <Button onClick={handleAdd} disabled={!inputValue.trim()}>
                Add
              </Button>
            </Flex>
          </Box>

          {excludedUserIds.length > 0 && (
            <Box>
              <Flex justify="between" align="center" mb="2">
                <Text size="2" weight="bold">
                  Excluding {excludedUserIds.length} learner{excludedUserIds.length !== 1 ? 's' : ''}
                </Text>
                <Button 
                  size="1" 
                  variant="soft" 
                  color="red"
                  onClick={() => setExcludedUserIds([])}
                >
                  Clear all
                </Button>
              </Flex>
              <Box className={styles.chipContainer}>
                {excludedUserIds.map(id => (
                  <Badge key={id} size="2" className={styles.chip}>
                    {id}
                    <button 
                      className={styles.removeButton}
                      onClick={() => handleRemove(id)}
                      aria-label={`Remove ${id}`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </Box>
            </Box>
          )}

          {excludedUserIds.length === 0 && (
            <Box className={styles.hint}>
              <Text size="2" color="gray">
                You can always exclude learners later from the Results screen.
              </Text>
            </Box>
          )}
        </Flex>
      </Card>

      <Flex gap="3" mt="6" justify="between">
        <Button variant="soft" onClick={() => router.push('/review')}>
          Back
        </Button>
        <Flex gap="2">
          <Button variant="soft" onClick={() => router.push('/processing')}>
            Skip for now
          </Button>
          <Button onClick={() => router.push('/processing')}>
            Build results
          </Button>
        </Flex>
      </Flex>
    </AppLayoutWithAuth>
  );
}

