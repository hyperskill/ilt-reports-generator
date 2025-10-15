'use client';

import { useEffect, useState } from 'react';
import { Box, Card, Heading, Text, Button, TextField, Flex, Table, Badge } from '@radix-ui/themes';

interface CertificateData {
  user_id: string;
  certificate_url?: string;
  isEditing?: boolean;
  isSaving?: boolean;
  editUrl?: string;
}

interface CertificatesManagementProps {
  reportId: string;
  performanceData: any;
}

export function CertificatesManagement({ reportId, performanceData }: CertificatesManagementProps) {
  const [certificates, setCertificates] = useState<Map<string, string>>(new Map());
  const [students, setStudents] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!dataLoaded && performanceData) {
      loadData();
    }
  }, [reportId, performanceData, dataLoaded]);

  const loadData = async () => {
    if (dataLoaded) return; // Prevent double loading
    
    setLoading(true);
    setError(null);

    try {
      // Load existing certificates
      const response = await fetch(`/api/student-certificates?reportId=${reportId}`);
      if (response.ok) {
        const data = await response.json();
        const certsMap = new Map<string, string>();
        data.certificates.forEach((cert: any) => {
          certsMap.set(cert.user_id, cert.certificate_url);
        });
        setCertificates(certsMap);
      }

      // Get students from performance data
      if (performanceData && Array.isArray(performanceData)) {
        const studentsList: CertificateData[] = performanceData.map((student: any) => ({
          user_id: student.user_id,
          name: student.name,
          segment: student.simple_segment,
        }));
        setStudents(studentsList);
      }
      
      setDataLoaded(true);
    } catch (error) {
      console.error('Failed to load certificates:', error);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userId: string) => {
    setStudents(students.map(s => 
      s.user_id === userId 
        ? { ...s, isEditing: true, editUrl: certificates.get(userId) || '' }
        : s
    ));
  };

  const handleCancel = (userId: string) => {
    setStudents(students.map(s => 
      s.user_id === userId 
        ? { ...s, isEditing: false, editUrl: undefined }
        : s
    ));
  };

  const handleUrlChange = (userId: string, url: string) => {
    setStudents(students.map(s => 
      s.user_id === userId 
        ? { ...s, editUrl: url }
        : s
    ));
  };

  const handleSave = async (userId: string) => {
    const student = students.find(s => s.user_id === userId);
    if (!student || !student.editUrl) return;

    // Validate URL
    try {
      new URL(student.editUrl);
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    setStudents(students.map(s => 
      s.user_id === userId 
        ? { ...s, isSaving: true }
        : s
    ));

    try {
      const response = await fetch('/api/student-certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          userId,
          certificateUrl: student.editUrl.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save certificate');
      }

      const data = await response.json();
      
      // Update certificates map
      const newCerts = new Map(certificates);
      newCerts.set(userId, data.certificate.certificate_url);
      setCertificates(newCerts);

      // Update students state
      setStudents(prevStudents => prevStudents.map(s => 
        s.user_id === userId 
          ? { ...s, isEditing: false, isSaving: false, editUrl: undefined }
          : s
      ));
    } catch (error: any) {
      alert(error.message || 'Failed to save certificate');
      setStudents(prevStudents => prevStudents.map(s => 
        s.user_id === userId 
          ? { ...s, isSaving: false }
          : s
      ));
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this certificate link?')) {
      return;
    }

    setStudents(students.map(s => 
      s.user_id === userId 
        ? { ...s, isSaving: true }
        : s
    ));

    try {
      const response = await fetch(`/api/student-certificates?reportId=${reportId}&userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete certificate');
      }

      // Update certificates map
      const newCerts = new Map(certificates);
      newCerts.delete(userId);
      setCertificates(newCerts);

      // Update students state
      setStudents(prevStudents => prevStudents.map(s => 
        s.user_id === userId 
          ? { ...s, isSaving: false }
          : s
      ));
    } catch (error: any) {
      alert(error.message || 'Failed to delete certificate');
      setStudents(prevStudents => prevStudents.map(s => 
        s.user_id === userId 
          ? { ...s, isSaving: false }
          : s
      ));
    }
  };

  if (loading) {
    return (
      <Box>
        <Text>Loading certificates...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  if (students.length === 0) {
    return (
      <Card>
        <Text color="gray">No students found in this report.</Text>
      </Card>
    );
  }

  return (
    <Flex direction="column" gap="3">
      <Card>
        <Box style={{ overflowX: 'auto' }}>
          <Table.Root size="2" variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>User ID</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Certificate URL</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {students.map((student) => {
                const certUrl = certificates.get(student.user_id);
                const isEditing = student.isEditing;
                const isSaving = student.isSaving;

                return (
                  <Table.Row key={student.user_id}>
                    <Table.Cell>
                      <Text size="2" weight="medium">{student.user_id}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">{(student as any).name || 'Unknown'}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      {isEditing ? (
                        <TextField.Root
                          size="1"
                          placeholder="https://example.com/certificate/..."
                          value={student.editUrl || ''}
                          onChange={(e) => handleUrlChange(student.user_id, e.target.value)}
                          disabled={isSaving}
                          style={{ width: '100%', minWidth: '300px' }}
                        />
                      ) : certUrl ? (
                        <a 
                          href={certUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'var(--accent-11)',
                            textDecoration: 'none',
                            fontSize: '13px',
                            wordBreak: 'break-all',
                          }}
                        >
                          {certUrl.length > 50 ? certUrl.substring(0, 50) + '...' : certUrl}
                        </a>
                      ) : (
                        <Text size="2" color="gray">No certificate</Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {isEditing ? (
                        <Flex gap="1">
                          <Button 
                            size="1" 
                            onClick={() => handleSave(student.user_id)}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button 
                            size="1" 
                            variant="outline" 
                            onClick={() => handleCancel(student.user_id)}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </Flex>
                      ) : (
                        <Flex gap="1">
                          <Button 
                            size="1" 
                            variant="outline"
                            onClick={() => handleEdit(student.user_id)}
                            disabled={isSaving}
                          >
                            {certUrl ? 'Edit' : 'Add'}
                          </Button>
                          {certUrl && (
                            <Button 
                              size="1" 
                              variant="soft" 
                              color="red"
                              onClick={() => handleDelete(student.user_id)}
                              disabled={isSaving}
                            >
                              Remove
                            </Button>
                          )}
                        </Flex>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      </Card>

      <Card style={{ backgroundColor: 'var(--blue-a2)' }}>
        <Text size="2">
          <strong>💡 Tip:</strong> Certificate links will be automatically included at the end of student shared reports. 
          Make sure to provide valid URLs that students can access.
        </Text>
      </Card>
    </Flex>
  );
}

