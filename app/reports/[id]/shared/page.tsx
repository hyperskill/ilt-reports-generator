'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Button, 
  Badge, 
  Table,
  Dialog,
  TextField,
  TextArea,
  Select,
  Spinner,
  AlertDialog
} from '@radix-ui/themes';
import * as Accordion from '@radix-ui/react-accordion';
import { AppLayoutWithAuth } from '@/app/components/AppLayoutWithAuth';
import { createClient } from '@/lib/supabase/client';
import { SharedReport } from '@/lib/types';

export default function SharedReportsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [sharedReports, setSharedReports] = useState<SharedReport[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SharedReport | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingComments, setSavingComments] = useState(false);
  const [llmStatus, setLlmStatus] = useState<{
    hasManagerReport: boolean;
    hasStudentReports: boolean;
    hasManagerComments: boolean;
    hasStudentComments: boolean;
  }>({ hasManagerReport: false, hasStudentReports: false, hasManagerComments: false, hasStudentComments: false });

  const [studentReportsStatus, setStudentReportsStatus] = useState<Record<string, boolean>>({});
  const [studentCommentsStatus, setStudentCommentsStatus] = useState<Record<string, boolean>>({});
  const [studentCommentsDetails, setStudentCommentsDetails] = useState<Record<string, any>>({});

  // Form state
  const [formData, setFormData] = useState({
    reportType: 'manager' as 'manager' | 'student',
    title: '',
    description: '',
    userId: '',
  });

  // Comments state
  const [commentsData, setCommentsData] = useState({
  comment_program_expert: '',
  comment_teaching_assistants: '',
  comment_learning_support: '',
  project_comment: '',
  });

  const supabase = createClient();

  // Helper functions for status determination
  const getStudentCommentsStatus = () => {
    const totalStudents = report?.performance_data?.length || 0;
    const studentsWithComments = Object.values(studentCommentsStatus).filter(status => status).length;
    const allStudentsHaveComments = totalStudents > 0 && studentsWithComments === totalStudents;
    const someStudentsHaveComments = studentsWithComments > 0;
    
    return {
      totalStudents,
      studentsWithComments,
      allComplete: allStudentsHaveComments,
      someComplete: someStudentsHaveComments,
      status: allStudentsHaveComments ? 'complete' : someStudentsHaveComments ? 'partial' : 'none'
    };
  };

  const getStudentReportsStatus = () => {
    const totalStudents = report?.performance_data?.length || 0;
    const studentsWithReports = Object.values(studentReportsStatus).filter(status => status).length;
    const allStudentsHaveReports = totalStudents > 0 && studentsWithReports === totalStudents;
    
    return {
      totalStudents,
      studentsWithReports,
      allComplete: allStudentsHaveReports,
      status: allStudentsHaveReports ? 'complete' : 'incomplete'
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return { bg: 'var(--green-2)', border: 'var(--green-6)', icon: '✅' };
      case 'partial': return { bg: 'var(--yellow-2)', border: 'var(--yellow-6)', icon: '⚠️' };
      case 'incomplete': return { bg: 'var(--red-2)', border: 'var(--red-6)', icon: '❌' };
      default: return { bg: 'var(--gray-2)', border: 'var(--gray-6)', icon: '❌' };
    }
  };

  useEffect(() => {
    checkUserRole();
    fetchData();
  }, [params.id]);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch base report
      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .eq('id', params.id)
        .single();

      setReport(reportData);

      // Fetch shared reports
      const { data: sharedData } = await supabase
        .from('shared_reports')
        .select('*')
        .eq('source_report_id', params.id)
        .order('created_at', { ascending: false });

      setSharedReports(sharedData || []);

      // Check LLM status
      await checkLlmStatus();

      // Load existing comments
      await loadComments();

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkLlmStatus = async () => {
    try {
      // Check manager report
      const { data: managerReport } = await supabase
        .from('manager_reports')
        .select('id')
        .eq('report_id', params.id)
        .single();

      // Check student reports
      const { data: studentReports } = await supabase
        .from('student_reports')
        .select('user_id')
        .eq('report_id', params.id);

      // Create status map for individual students
      const statusMap: Record<string, boolean> = {};
      if (report?.performance_data) {
        report.performance_data.forEach((student: any) => {
          statusMap[student.user_id] = false; // Default to not generated
        });
      }
      
      // Mark students with generated reports
      if (studentReports) {
        studentReports.forEach((report: any) => {
          statusMap[report.user_id] = true;
        });
      }
      
      setStudentReportsStatus(statusMap);

      // Check manager comments (program-level)
      const { data: reportData } = await supabase
        .from('reports')
        .select('comment_program_expert, comment_teaching_assistants, comment_learning_support')
        .eq('id', params.id)
        .single();

      const hasManagerComments = !!(
        reportData?.comment_program_expert ||
        reportData?.comment_teaching_assistants ||
        reportData?.comment_learning_support
      );

      // Check student comments (individual student comments)
      const { data: studentComments } = await supabase
        .from('student_comments')
        .select('user_id, project_comment, comment_program_expert, comment_teaching_assistants, comment_learning_support')
        .eq('report_id', params.id);

      // Create status map and details for individual student comments
      const commentsStatusMap: Record<string, boolean> = {};
      const commentsDetailsMap: Record<string, any> = {};
      if (report?.performance_data) {
        report.performance_data.forEach((student: any) => {
          commentsStatusMap[student.user_id] = false; // Default to no comments
          commentsDetailsMap[student.user_id] = {
            project_comment: '',
            comment_program_expert: '',
            comment_teaching_assistants: '',
            comment_learning_support: '',
            filled: 0,
            total: 4
          };
        });
      }
      
      // Mark students with comments and count filled fields
      if (studentComments) {
        studentComments.forEach((comment: any) => {
          const filled = [
            comment.project_comment,
            comment.comment_program_expert,
            comment.comment_teaching_assistants,
            comment.comment_learning_support
          ].filter(field => field && field.trim() !== '').length;
          
          commentsStatusMap[comment.user_id] = filled > 0;
          commentsDetailsMap[comment.user_id] = {
            project_comment: comment.project_comment || '',
            comment_program_expert: comment.comment_program_expert || '',
            comment_teaching_assistants: comment.comment_teaching_assistants || '',
            comment_learning_support: comment.comment_learning_support || '',
            filled,
            total: 4
          };
        });
      }
      
      setStudentCommentsStatus(commentsStatusMap);
      setStudentCommentsDetails(commentsDetailsMap);
      const hasStudentComments = Object.values(commentsStatusMap).some(status => status);

      setLlmStatus({
        hasManagerReport: !!managerReport,
        hasStudentReports: (studentReports?.length || 0) > 0,
        hasManagerComments,
        hasStudentComments,
      });
    } catch (error) {
      console.error('Failed to check LLM status:', error);
    }
  };

  const loadComments = async () => {
    try {
      const { data: reportData } = await supabase
        .from('reports')
        .select('comment_program_expert, comment_teaching_assistants, comment_learning_support, project_comment')
        .eq('id', params.id)
        .single();

      if (reportData) {
        setCommentsData({
          comment_program_expert: reportData.comment_program_expert || '',
          comment_teaching_assistants: reportData.comment_teaching_assistants || '',
          comment_learning_support: reportData.comment_learning_support || '',
          project_comment: reportData.project_comment || '',
        });
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleSaveComments = async () => {
    setSavingComments(true);
    try {
      const response = await fetch(`/api/reports/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_program_expert: commentsData.comment_program_expert,
          comment_teaching_assistants: commentsData.comment_teaching_assistants,
          comment_learning_support: commentsData.comment_learning_support,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save comments');
      }

      // Refresh data to update status
      await fetchData();
      setIsCommentsDialogOpen(false);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSavingComments(false);
    }
  };

  const handleCreateSharedReport = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (formData.reportType === 'student' && !formData.userId.trim()) {
      alert('Please select a student');
      return;
    }

    // Check if student has LLM report generated
    if (formData.reportType === 'student' && formData.userId) {
      const hasLLMReport = studentReportsStatus[formData.userId];
      if (!hasLLMReport) {
        // Redirect to LLM report generation page
        if (confirm('This student does not have an AI-generated report yet. Would you like to generate it now?')) {
          router.push(`/reports/${params.id}/student-reports/${formData.userId}`);
        }
        return;
      }
    }

    setCreating(true);
    try {
      const response = await fetch('/api/reports/shared/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: formData.reportType,
          sourceReportId: params.id,
          userId: formData.reportType === 'student' ? formData.userId : null,
          title: formData.title,
          description: formData.description || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create shared report');
      }

      // Redirect to edit page
      router.push(`/reports/shared/${data.sharedReport.id}/edit`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setCreating(false);
      setIsCreateDialogOpen(false);
    }
  };

  const handleDeleteSharedReport = async () => {
    if (!selectedReport) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/reports/shared/${selectedReport.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete shared report');
      }

      // Refresh the list
      await fetchData();
      setIsDeleteDialogOpen(false);
      setSelectedReport(null);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const getStudents = () => {
    if (!report?.performance_data) return [];
    return report.performance_data
      .map((student: any) => ({
        value: student.user_id,
        label: `${student.name || student.user_id}${studentReportsStatus[student.user_id] ? ' ✓' : ' (no AI report)'}`,
        hasReport: studentReportsStatus[student.user_id],
      }));
  };

  const getAvailableStudents = () => {
    return getStudents();
  };

  // Auto-select first available student when report type changes to 'student'
  useEffect(() => {
    if (formData.reportType === 'student' && !formData.userId) {
      const availableStudents = getAvailableStudents();
      if (availableStudents.length > 0) {
        setFormData(prev => ({ ...prev, userId: availableStudents[0].value }));
      }
    }
  }, [formData.reportType, studentReportsStatus]);

  const canCreateSharedReport = () => {
    if (formData.reportType === 'manager') {
      return llmStatus.hasManagerReport && llmStatus.hasManagerComments;
    } else {
      // For student reports, allow creation if a student is selected
      // The system will redirect to LLM generation if needed
      return formData.userId.trim().length > 0;
    }
  };

  // Calculate statuses for rendering
  const commentsStatus = getStudentCommentsStatus();
  const commentsColors = getStatusColor(commentsStatus.status);
  const reportsStatus = getStudentReportsStatus();
  const reportsColors = getStatusColor(reportsStatus.status);

  if (loading) {
    return (
      <AppLayoutWithAuth title="Loading..." subtitle="Fetching shared reports">
        <Card>
          <Flex justify="center" align="center" style={{ minHeight: '200px' }}>
            <Spinner size="3" />
          </Flex>
        </Card>
      </AppLayoutWithAuth>
    );
  }

  if (error || !report) {
    return (
      <AppLayoutWithAuth title="Error" subtitle="Failed to load data">
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
            <Heading size="8" mb="2">Shared Reports</Heading>
            <Text size="3" color="gray">
              Manage shareable versions of "{report.title}"
            </Text>
          </Box>
          <Flex gap="2" align="center">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
            >
              ← Back
            </Button>
            <Button 
              variant="soft" 
              onClick={() => {
                const tab = searchParams.get('tab') || 'constructor';
                router.push(`/reports/${params.id}?tab=${tab}`);
              }}
            >
              Back to Report
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Prerequisites for Manager Reports */}
      <Card mb="4">
        <Heading size="4" mb="3">📊 Manager Report Prerequisites</Heading>
        <Text size="2" color="gray" mb="3">
          To create a shared manager report, complete these steps:
        </Text>
        
        <Flex direction="column" gap="4">
          {/* Expert Comments */}
          <Flex align="center" justify="between" p="3" mb="2" style={{ 
            backgroundColor: llmStatus.hasManagerComments ? 'var(--green-2)' : 'var(--orange-2)',
            borderRadius: 'var(--radius-2)',
            border: `1px solid ${llmStatus.hasManagerComments ? 'var(--green-6)' : 'var(--orange-6)'}`
          }}>
            <Flex align="center" gap="2">
              {llmStatus.hasManagerComments ? '✅' : '❌'}
              <Box>
                <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>Expert Comments</Text>
                <Text size="1" color="gray" style={{ display: 'block' }}>
                  {llmStatus.hasManagerComments ? 'Comments added' : 'Add comments from Program Expert, Teaching Assistants, and Learning Support'}
                </Text>
              </Box>
            </Flex>
            <Button
              size="1"
              variant="outline"
              onClick={() => setIsCommentsDialogOpen(true)}
            >
              {llmStatus.hasManagerComments ? 'Edit Comments' : 'Add Comments'}
            </Button>
          </Flex>

          {/* Manager LLM Report */}
          <Flex align="center" justify="between" p="3" mb="2" style={{ 
            backgroundColor: llmStatus.hasManagerReport ? 'var(--green-2)' : 'var(--orange-2)',
            borderRadius: 'var(--radius-2)',
            border: `1px solid ${llmStatus.hasManagerReport ? 'var(--green-6)' : 'var(--orange-6)'}`
          }}>
            <Flex align="center" gap="2">
              {llmStatus.hasManagerReport ? '✅' : '❌'}
              <Box>
                <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>Manager LLM Report</Text>
                <Text size="1" color="gray" style={{ display: 'block' }}>
                  {llmStatus.hasManagerReport ? 'Report generated' : 'Generate AI-powered manager report'}
                </Text>
              </Box>
            </Flex>
            <Button
              size="1"
              variant="outline"
              onClick={() => {
                const tab = searchParams.get('tab') || 'constructor';
                router.push(`/reports/${params.id}/manager-report?tab=${tab}`);
              }}
            >
              {llmStatus.hasManagerReport ? 'View Report' : 'Generate Report'}
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Prerequisites for Student Reports */}
      <Card mb="4">
        <Heading size="4" mb="3">👤 Student Report Prerequisites</Heading>
        <Text size="2" color="gray" mb="3">
          To create shared student reports, complete these steps:
        </Text>
        
        <Flex direction="column" gap="4">
          {/* Student Comments */}
          <Box p="3" mb="2" style={{ 
            backgroundColor: commentsColors.bg,
            borderRadius: 'var(--radius-2)',
            border: `1px solid ${commentsColors.border}`
          }}>
            <Flex align="center" gap="2" mb="2">
              {commentsColors.icon}
              <Box>
                <Flex align="center" gap="2">
                  <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>Student Expert Comments</Text>
                  <Badge size="1" color={commentsStatus.status === 'complete' ? 'green' : commentsStatus.status === 'partial' ? 'yellow' : 'gray'}>
                    {commentsStatus.studentsWithComments}/{commentsStatus.totalStudents}
                  </Badge>
                </Flex>
                <Text size="1" color="gray" style={{ display: 'block' }}>
                  {commentsStatus.status === 'complete' 
                    ? 'All students have expert comments' 
                    : commentsStatus.status === 'partial'
                    ? `${commentsStatus.studentsWithComments} of ${commentsStatus.totalStudents} students have comments`
                    : 'Add individual comments for each student'}
                </Text>
              </Box>
            </Flex>
            
            {/* Accordion with student links */}
            <Accordion.Root type="single" collapsible>
              <Accordion.Item value="students" style={{ border: 'none', backgroundColor: 'transparent' }}>
                <Accordion.Trigger
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--gray-2)',
                    border: '1px solid var(--gray-6)',
                    borderRadius: 'var(--radius-2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    color: 'var(--gray-11)',
                    fontWeight: 500,
                  }}
                >
                  <span>👥 View Individual Student Reports</span>
                  <span style={{ fontSize: '12px' }}>▼</span>
                </Accordion.Trigger>
                <Accordion.Content
                  style={{
                    padding: '12px 0',
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: 'var(--gray-12)',
                  }}
                >
                  <Flex direction="column" gap="2">
                    {report?.performance_data?.map((student: any) => {
                      const hasComments = studentCommentsStatus[student.user_id] || false;
                      return (
                        <Button
                          key={student.user_id}
                          size="1"
                          variant="outline"
                          onClick={() => {
                            const tab = searchParams.get('tab') || 'constructor';
                            router.push(`/student/${student.user_id}?reportId=${params.id}&tab=${tab}`);
                          }}
                          style={{ justifyContent: 'flex-start' }}
                        >
                          {hasComments ? '✅' : '👤'} {student.name || student.user_id} - Add/Edit Comments
                        </Button>
                      );
                    })}
                  </Flex>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          </Box>

          {/* Student LLM Reports */}
          <Box p="3" mb="2" style={{ 
            backgroundColor: reportsColors.bg,
            borderRadius: 'var(--radius-2)',
            border: `1px solid ${reportsColors.border}`
          }}>
            <Flex align="center" justify="between" mb="2">
              <Flex align="center" gap="2">
                {reportsColors.icon}
                <Box>
                  <Flex align="center" gap="2">
                    <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>Student LLM Reports</Text>
                    <Badge size="1" color={reportsStatus.status === 'complete' ? 'green' : 'red'}>
                      {reportsStatus.studentsWithReports}/{reportsStatus.totalStudents}
                    </Badge>
                  </Flex>
                  <Text size="1" color="gray" style={{ display: 'block' }}>
                    {reportsStatus.status === 'complete' 
                      ? 'All students have generated reports' 
                      : `${reportsStatus.studentsWithReports} of ${reportsStatus.totalStudents} students have reports`}
                  </Text>
                </Box>
              </Flex>
                  <Button
                    size="1"
                    variant="outline"
                    onClick={() => {
                      const tab = searchParams.get('tab') || 'constructor';
                      router.push(`/reports/${params.id}/student-reports?tab=${tab}`);
                    }}
                  >
                    {reportsStatus.status === 'complete' ? 'View Reports' : 'Generate Reports'}
                  </Button>
                </Flex>
            
            {/* Accordion with individual student status */}
            <Accordion.Root type="single" collapsible>
              <Accordion.Item value="student-status" style={{ border: 'none', backgroundColor: 'transparent' }}>
                <Accordion.Trigger
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--gray-2)',
                    border: '1px solid var(--gray-6)',
                    borderRadius: 'var(--radius-2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    color: 'var(--gray-11)',
                    fontWeight: 500,
                  }}
                >
                  <span>📊 View Individual Student Report Status</span>
                  <span style={{ fontSize: '12px' }}>▼</span>
                </Accordion.Trigger>
                <Accordion.Content
                  style={{
                    padding: '12px 0',
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: 'var(--gray-12)',
                  }}
                >
                  <Flex direction="column" gap="2">
                    {report?.performance_data?.map((student: any) => {
                      const hasReport = studentReportsStatus[student.user_id] || false;
                      return (
                        <Flex
                          key={student.user_id}
                          align="center"
                          justify="between"
                          p="2"
                          style={{
                            backgroundColor: hasReport ? 'var(--green-1)' : 'var(--orange-1)',
                            borderRadius: 'var(--radius-1)',
                            border: `1px solid ${hasReport ? 'var(--green-4)' : 'var(--orange-4)'}`
                          }}
                        >
                          <Flex align="center" gap="2">
                            {hasReport ? '✅' : '❌'}
                            <Text size="2">
                              {student.name || student.user_id}
                            </Text>
                          </Flex>
                          <Text size="1" color="gray">
                            {hasReport ? 'Report generated' : 'Not generated'}
                          </Text>
                        </Flex>
                      );
                    })}
                  </Flex>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          </Box>
        </Flex>
      </Card>

      {/* Create Button */}
      <Box mb="4">
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={!canCreateSharedReport()}
        >
          ➕ Create New Shared Report
        </Button>
      </Box>

      {/* Shared Reports List */}
      <Card>
        <Heading size="4" mb="3">📤 Existing Shared Reports</Heading>
        {sharedReports.length === 0 ? (
          <Text color="gray">No shared reports created yet.</Text>
        ) : (
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Student</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sharedReports.map((sharedReport) => (
                <Table.Row key={sharedReport.id}>
                  <Table.Cell>
                    <Text weight="bold">{sharedReport.title}</Text>
                    {sharedReport.description && (
                      <Text size="1" color="gray" style={{ display: 'block' }}>
                        {sharedReport.description}
                      </Text>
                    )}
                    {/* project_comment block for shared student report */}
                    {sharedReport.report_type === 'student' && sharedReport.user_id && studentCommentsDetails[sharedReport.user_id]?.project_comment && (
                      <Card mt="2" style={{ backgroundColor: 'var(--yellow-2)', borderLeft: '4px solid var(--yellow-9)' }}>
                        <Text size="2" weight="bold" mb="1">Student Project Comment:</Text>
                        <Text size="2">{studentCommentsDetails[sharedReport.user_id].project_comment}</Text>
                      </Card>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={sharedReport.report_type === 'manager' ? 'blue' : 'green'}>
                      {sharedReport.report_type === 'manager' ? 'Manager' : 'Student'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {sharedReport.user_id ? (
                      <Text size="2">{sharedReport.user_id}</Text>
                    ) : (
                      <Text size="2" color="gray">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">
                      {new Date(sharedReport.created_at).toLocaleDateString()}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2">
                      <Button
                        size="1"
                        variant="outline"
                        onClick={() => router.push(`/reports/shared/${sharedReport.id}/view`)}
                      >
                        View
                      </Button>
                      <Button
                        size="1"
                        variant="outline"
                        onClick={() => router.push(`/reports/shared/${sharedReport.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="1"
                        color="red"
                        variant="outline"
                        onClick={() => {
                          setSelectedReport(sharedReport);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Create Shared Report</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Create a customizable version of this report for sharing.
          </Dialog.Description>

          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" size="2" weight="bold" mb="3" style={{ display: 'block' }}>
                Report Type
              </Text>
              <Select.Root
                value={formData.reportType}
                onValueChange={(value: 'manager' | 'student') => 
                  setFormData(prev => ({ ...prev, reportType: value, userId: '' }))
                }
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="manager">Manager Report</Select.Item>
                  <Select.Item value="student">Student Report</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {formData.reportType === 'student' && (
              <Box>
                <Text as="label" size="2" weight="bold" mb="3" style={{ display: 'block' }}>
                  Student
                </Text>
                <Text size="1" color="gray" mb="3" style={{ display: 'block', marginTop: '4px' }}>
                  Only students with generated LLM reports are available for shared report creation.
                </Text>
                {getAvailableStudents().length > 0 ? (
                  <Select.Root
                    value={formData.userId}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, userId: value }))
                    }
                  >
                    <Select.Trigger placeholder="Select a student..." />
                    <Select.Content>
                      {getStudents().map((student: any) => (
                        <Select.Item key={student.value} value={student.value}>
                          {student.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                ) : (
                  <Box p="3" style={{ 
                    backgroundColor: 'var(--orange-2)',
                    borderRadius: 'var(--radius-2)',
                    border: '1px solid var(--orange-6)'
                  }}>
                    <Text size="2" color="orange">
                      ⚠️ No students with generated LLM reports available. Please generate LLM reports for students first.
                    </Text>
                  </Box>
                )}
              </Box>
            )}

            <Box>
              <Text as="label" size="2" weight="bold" mb="3" style={{ display: 'block' }}>
                Title *
              </Text>
              <TextField.Root
                placeholder="Enter report title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="3" style={{ display: 'block' }}>
                Description
              </Text>
              <TextArea
                placeholder="Optional description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </Box>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button 
              onClick={handleCreateSharedReport}
              disabled={creating || !canCreateSharedReport()}
            >
              {creating ? 'Creating...' : 'Create & Edit'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Delete Dialog */}
      <AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialog.Content style={{ maxWidth: 450 }}>
          <AlertDialog.Title>Delete Shared Report</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Are you sure you want to delete "{selectedReport?.title}"? This action cannot be undone.
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button 
                color="red" 
                onClick={handleDeleteSharedReport}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* Comments Dialog */}
      <Dialog.Root open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
        <Dialog.Content style={{ maxWidth: 600 }}>
          <Dialog.Title>Expert Comments</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Add comments from Program Expert, Teaching Assistants, and Learning Support.
          </Dialog.Description>

          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                Program Expert Comments
              </Text>
              <TextArea
                placeholder="Enter comments from the program expert..."
                value={commentsData.comment_program_expert}
                onChange={(e) => setCommentsData(prev => ({ 
                  ...prev, 
                  comment_program_expert: e.target.value 
                }))}
                rows={4}
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                Teaching Assistants Comments
              </Text>
              <TextArea
                placeholder="Enter comments from teaching assistants..."
                value={commentsData.comment_teaching_assistants}
                onChange={(e) => setCommentsData(prev => ({ 
                  ...prev, 
                  comment_teaching_assistants: e.target.value 
                }))}
                rows={4}
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                Learning Support Comments
              </Text>
              <TextArea
                placeholder="Enter comments from learning support..."
                value={commentsData.comment_learning_support}
                onChange={(e) => setCommentsData(prev => ({ 
                  ...prev, 
                  comment_learning_support: e.target.value 
                }))}
                rows={4}
              />
            </Box>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button 
              onClick={handleSaveComments}
              disabled={savingComments}
            >
              {savingComments ? 'Saving...' : 'Save Comments'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </AppLayoutWithAuth>
  );
}
