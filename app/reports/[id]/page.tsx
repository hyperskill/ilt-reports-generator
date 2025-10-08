'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Heading, Text, Tabs, Card, Flex, Badge, Button, Separator } from '@radix-ui/themes';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { createClient } from '@/lib/supabase/client';

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sharedReports, setSharedReports] = useState<any[]>([]);
  const [loadingSharedReports, setLoadingSharedReports] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const supabase = createClient();

  useEffect(() => {
    checkUserRole();
    fetchReport();
  }, [params.id]);

  useEffect(() => {
    if (isAdmin) {
      loadSharedReports();
    }
  }, [isAdmin, params.id]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['preview', 'constructor', 'access'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setIsAdmin(profile?.role === 'admin');
    }
  };

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${params.id}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load report');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSharedReports = async () => {
    setLoadingSharedReports(true);
    try {
      const response = await fetch(`/api/reports/shared/list?sourceReportId=${params.id}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load shared reports');
      }

      const data = await response.json();
      setSharedReports(data.sharedReports || []);
    } catch (error: any) {
      console.error('Error loading shared reports:', error);
    } finally {
      setLoadingSharedReports(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    router.push(url.pathname + url.search, { scroll: false });
  };

  if (loading) {
    return (
      <AppLayoutWithAuth title="Loading..." subtitle="Fetching report data">
        <Card>
          <Text>Loading report...</Text>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  if (error || !report) {
    return (
      <AppLayoutWithAuth title="Error" subtitle="Failed to load report">
        <Card>
          <Text color="red">{error || 'Report not found'}</Text>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  return (
    <AppLayoutWithAuth>
      <Box mb="5">
        <Flex justify="between" align="start">
          <Box>
            <Heading size="8" mb="2">{report.title}</Heading>
            {report.description && (
              <Text size="3" color="gray">{report.description}</Text>
            )}
          </Box>
          <Flex gap="2" align="center">
            <Button 
              variant="soft" 
              onClick={() => {
                router.push(`/dashboard?t=${Date.now()}`);
                router.refresh();
              }}
            >
              ← Back to Dashboard
            </Button>
            <Badge color="green">Saved Report</Badge>
          </Flex>
        </Flex>
        <Flex gap="2" mt="2">
          <Text size="2" color="gray">
            Created: {new Date(report.created_at).toLocaleString()}
          </Text>
        </Flex>
      </Box>

      {/* Navigation Menu */}
      <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
        <Tabs.List>
          <Tabs.Trigger value="preview">📊 Preview and Setup</Tabs.Trigger>
          <Tabs.Trigger value="constructor">🔧 Constructor</Tabs.Trigger>
          <Tabs.Trigger value="access">🔐 Manage Access</Tabs.Trigger>
        </Tabs.List>

        <Box pt="4">
          <Tabs.Content value="preview">
            <Flex direction="column" gap="4">
              <Heading size="5" mb="3">📊 Preview and Setup</Heading>
              <Text size="3" color="gray" mb="4">
                View reports, generate LLM reports, and manage expert comments
              </Text>
              
              <Flex direction="column" gap="3">
                <Card>
                  <Flex justify="between" align="center" p="3">
                    <Box>
                      <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>📈 Performance Segmentation</Text>
                      <Text size="2" color="gray" style={{ display: 'block' }}>View performance analysis and student segments</Text>
                    </Box>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/reports/${params.id}/preview/performance?tab=preview`)}
                    >
                      View Report
                    </Button>
                  </Flex>
                </Card>

                <Card>
                  <Flex justify="between" align="center" p="3">
                    <Box>
                      <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>📊 Dynamic/Easing Segmentation</Text>
                      <Text size="2" color="gray" style={{ display: 'block' }}>View activity patterns and temporal analysis</Text>
                    </Box>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/reports/${params.id}/preview/dynamic?tab=preview`)}
                    >
                      View Report
                    </Button>
                  </Flex>
                </Card>

                <Card>
                  <Flex justify="between" align="center" p="3">
                    <Box>
                      <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>👤 Personal Student Reports</Text>
                      <Text size="2" color="gray" style={{ display: 'block' }}>View individual student performance and reports</Text>
                    </Box>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/reports/${params.id}/preview/students?tab=preview`)}
                    >
                      View Students
                    </Button>
                  </Flex>
                </Card>

                {isAdmin && (
                  <>
                    <Card>
                      <Flex justify="between" align="center" p="3">
                        <Box>
                          <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>💬 Expert Comments</Text>
                          <Text size="2" color="gray" style={{ display: 'block' }}>Add and manage expert comments for reports</Text>
                        </Box>
                        <Button 
                          variant="outline"
                          onClick={() => router.push(`/reports/${params.id}/preview/comments?tab=preview`)}
                        >
                          Manage Comments
                        </Button>
                      </Flex>
                    </Card>

                    <Card>
                      <Flex justify="between" align="center" p="3">
                        <Box>
                          <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>🤖 LLM Report Generation</Text>
                          <Text size="2" color="gray" style={{ display: 'block' }}>Generate AI-powered manager and student reports</Text>
                        </Box>
                        <Button 
                          variant="outline"
                          onClick={() => router.push(`/reports/${params.id}/preview/llm?tab=preview`)}
                        >
                          Generate Reports
                        </Button>
                      </Flex>
                    </Card>
                  </>
                )}
              </Flex>
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="constructor">
            <Flex direction="column" gap="4">
              <Heading size="5" mb="3">🔧 Constructor</Heading>
              <Text size="3" color="gray" mb="4">
                Create, edit, and manage shared reports for different audiences
              </Text>
              
              {isAdmin ? (
                <Flex direction="column" gap="4">
                  {/* Shared Reports Management */}
                  <Card>
                    <Flex justify="between" align="center" p="3">
                      <Box>
                        <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>📤 Shared Reports Management</Text>
                        <Text size="2" color="gray" style={{ display: 'block' }}>Create and manage shareable report versions</Text>
                      </Box>
                      <Button 
                        variant="outline"
                        onClick={() => router.push(`/reports/${params.id}/shared?tab=constructor`)}
                      >
                        Manage Reports
                      </Button>
                    </Flex>
                  </Card>

                  {/* Manager Reports */}
                  <Card>
                    <Flex direction="column" gap="3">
                      <Flex justify="between" align="center">
                        <Box>
                          <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>👔 Manager Reports</Text>
                          <Text size="2" color="gray" style={{ display: 'block' }}>Edit and customize manager shared reports</Text>
                        </Box>
                        <Badge color="blue" size="2">
                          {sharedReports.filter(r => r.report_type === 'manager').length} reports
                        </Badge>
                      </Flex>
                      
                      {loadingSharedReports ? (
                        <Text size="2" color="gray">Loading reports...</Text>
                      ) : sharedReports.filter(r => r.report_type === 'manager').length > 0 ? (
                        <Flex direction="column" gap="2">
                          {sharedReports.filter(r => r.report_type === 'manager').map((sharedReport) => (
                            <Flex key={sharedReport.id} justify="between" align="center" p="2" style={{ backgroundColor: 'var(--gray-2)', borderRadius: '6px' }}>
                              <Box>
                                <Text size="2" weight="bold">{sharedReport.title}</Text>
                                <Text size="1" color="gray">
                                  Created: {new Date(sharedReport.created_at).toLocaleDateString()}
                                </Text>
                              </Box>
                              <Flex gap="2">
                                <Button 
                                  size="1" 
                                  variant="outline"
                                  onClick={() => router.push(`/reports/shared/${sharedReport.id}/edit`)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="1" 
                                  variant="outline"
                                  onClick={() => router.push(`/reports/shared/${sharedReport.id}/view`)}
                                >
                                  View
                                </Button>
                              </Flex>
                            </Flex>
                          ))}
                        </Flex>
                      ) : (
                        <Text size="2" color="gray">No manager reports created yet</Text>
                      )}
                    </Flex>
                  </Card>

                  {/* Student Reports */}
                  <Card>
                    <Flex direction="column" gap="3">
                      <Flex justify="between" align="center">
                        <Box>
                          <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>🎓 Student Reports</Text>
                          <Text size="2" color="gray" style={{ display: 'block' }}>Edit and customize student shared reports</Text>
                        </Box>
                        <Badge color="green" size="2">
                          {sharedReports.filter(r => r.report_type === 'student').length} reports
                        </Badge>
                      </Flex>
                      
                      {loadingSharedReports ? (
                        <Text size="2" color="gray">Loading reports...</Text>
                      ) : sharedReports.filter(r => r.report_type === 'student').length > 0 ? (
                        <Flex direction="column" gap="2">
                          {sharedReports.filter(r => r.report_type === 'student').map((sharedReport) => (
                            <Flex key={sharedReport.id} justify="between" align="center" p="2" style={{ backgroundColor: 'var(--gray-2)', borderRadius: '6px' }}>
                              <Box>
                                <Text size="2" weight="bold">{sharedReport.title}</Text>
                                <Text size="1" color="gray">
                                  Student: {sharedReport.user_id} • Created: {new Date(sharedReport.created_at).toLocaleDateString()}
                                </Text>
                              </Box>
                              <Flex gap="2">
                                <Button 
                                  size="1" 
                                  variant="outline"
                                  onClick={() => router.push(`/reports/shared/${sharedReport.id}/edit`)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="1" 
                                  variant="outline"
                                  onClick={() => router.push(`/reports/shared/${sharedReport.id}/view`)}
                                >
                                  View
                                </Button>
                              </Flex>
                            </Flex>
                          ))}
                        </Flex>
                      ) : (
                        <Text size="2" color="gray">No student reports created yet</Text>
                      )}
                    </Flex>
                  </Card>
                </Flex>
              ) : (
                <Card>
                  <Flex justify="center" align="center" p="6">
                    <Text size="3" color="gray">Admin access required to manage shared reports</Text>
                  </Flex>
                </Card>
              )}
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="access">
            <Flex direction="column" gap="4">
              <Heading size="5" mb="3">🔐 Manage Access</Heading>
              <Text size="3" color="gray" mb="4">
                Control who can view and access your shared reports
              </Text>
              
              {isAdmin ? (
                <Card>
                  <Flex justify="between" align="center" p="3">
                    <Box>
                      <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>👥 Access Management</Text>
                      <Text size="2" color="gray" style={{ display: 'block' }}>Manage permissions and access to shared reports</Text>
                    </Box>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/reports/${params.id}/access?tab=access`)}
                    >
                      Manage Access
                    </Button>
                  </Flex>
                </Card>
              ) : (
                <Card>
                  <Flex justify="center" align="center" p="6">
                    <Text size="3" color="gray">Admin access required to manage report access</Text>
                  </Flex>
                </Card>
              )}
            </Flex>
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </AppLayoutWithAuth>
  );
}

