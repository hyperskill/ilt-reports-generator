'use client';

import { useRouter } from 'next/navigation';
import { Box, Button, Flex, Text, Card, Heading, RadioGroup, Switch } from '@radix-ui/themes';
import { AppLayoutWithAuthWithAuth } from '@/app/components/AppLayoutWithAuthWithAuth';
import { useAppContext } from '@/lib/context/AppContext';
import { DisplaySettings } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const { settings, setSettings, files } = useAppContext();

  const hasMeetings = !!files.meetings;

  const updateSetting = <K extends keyof DisplaySettings>(
    key: K,
    value: DisplaySettings[K]
  ) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleBuildResults = () => {
    router.push('/processing');
  };

  return (
    <AppLayoutWithAuth
      title="Display Settings"
      subtitle="Configure how your data will be analyzed and displayed."
    >
      <Flex direction="column" gap="4">
        {/* Time Bucketing */}
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">Time Bucketing</Heading>
            <Text size="2" color="gray">
              Choose how to group activity over time. Both modes use this for charts;
              Dynamic mode relies on it for curve generation.
            </Text>
            <RadioGroup.Root
              value={settings.timeBucketing}
              onValueChange={(value) => updateSetting('timeBucketing', value as 'daily' | 'weekly')}
            >
              <Flex direction="column" gap="2">
                <label>
                  <Flex gap="2" align="center">
                    <RadioGroup.Item value="daily" />
                    <Box>
                      <Text weight="bold">Daily</Text>
                      <Text size="2" color="gray" as="p">
                        Group activity by day (recommended for dense data)
                      </Text>
                    </Box>
                  </Flex>
                </label>
                <label>
                  <Flex gap="2" align="center">
                    <RadioGroup.Item value="weekly" />
                    <Box>
                      <Text weight="bold">Weekly</Text>
                      <Text size="2" color="gray" as="p">
                        Group activity by week (recommended for sparse timestamps)
                      </Text>
                    </Box>
                  </Flex>
                </label>
              </Flex>
            </RadioGroup.Root>
          </Flex>
        </Card>

        {/* Smoothing */}
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">Smoothing</Heading>
            <Text size="2" color="gray">
              Apply smoothing to activity curves (affects Dynamic mode visualization).
            </Text>
            <RadioGroup.Root
              value={settings.smoothing}
              onValueChange={(value) => updateSetting('smoothing', value as 'off' | 'light' | 'strong')}
            >
              <Flex direction="column" gap="2">
                <label>
                  <Flex gap="2" align="center">
                    <RadioGroup.Item value="off" />
                    <Box>
                      <Text weight="bold">Off</Text>
                      <Text size="2" color="gray" as="p">No smoothing applied</Text>
                    </Box>
                  </Flex>
                </label>
                <label>
                  <Flex gap="2" align="center">
                    <RadioGroup.Item value="light" />
                    <Box>
                      <Text weight="bold">Light</Text>
                      <Text size="2" color="gray" as="p">3-day median filter</Text>
                    </Box>
                  </Flex>
                </label>
                <label>
                  <Flex gap="2" align="center">
                    <RadioGroup.Item value="strong" />
                    <Box>
                      <Text weight="bold">Strong</Text>
                      <Text size="2" color="gray" as="p">7-day median filter</Text>
                    </Box>
                  </Flex>
                </label>
              </Flex>
            </RadioGroup.Root>
          </Flex>
        </Card>

        {/* Meetings */}
        {hasMeetings && (
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="4">Meetings Usage</Heading>
              <Text size="2" color="gray">
                Control how meeting attendance data is used in analysis.
              </Text>
              
              <label>
                <Flex gap="3" align="center">
                  <Switch
                    checked={settings.includeMeetingsInActivity}
                    onCheckedChange={(checked) => 
                      updateSetting('includeMeetingsInActivity', checked)
                    }
                  />
                  <Box>
                    <Text weight="bold">Include meetings in activity (Dynamic mode)</Text>
                    <Text size="2" color="gray" as="p">
                      Add meeting attendance to cumulative activity curves
                    </Text>
                  </Box>
                </Flex>
              </label>

              <label>
                <Flex gap="3" align="center">
                  <Switch
                    checked={settings.useMeetingsInSegmentation}
                    onCheckedChange={(checked) => 
                      updateSetting('useMeetingsInSegmentation', checked)
                    }
                  />
                  <Box>
                    <Text weight="bold">Use meetings in segmentation (Performance mode)</Text>
                    <Text size="2" color="gray" as="p">
                      Include meeting attendance in performance segment classification
                    </Text>
                  </Box>
                </Flex>
              </label>
            </Flex>
          </Card>
        )}
      </Flex>

      <Flex gap="3" mt="6" justify="between">
        <Button variant="soft" onClick={() => router.push('/exclusions')}>
          Back
        </Button>
        <Button size="3" onClick={handleBuildResults}>
          Build results
        </Button>
      </Flex>
    </AppLayoutWithAuth>
  );
}

