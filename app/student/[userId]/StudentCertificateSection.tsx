'use client';

import { useEffect, useState } from 'react';
import { Box, Card, Heading, Text, Button, TextField, Flex } from '@radix-ui/themes';

interface StudentCertificateSectionProps {
  reportId: string | null;
  userId: string;
  isAdmin: boolean;
}

export function StudentCertificateSection({ reportId, userId, isAdmin }: StudentCertificateSectionProps) {
  const [certificateUrl, setCertificateUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState('');

  useEffect(() => {
    if (reportId) {
      loadCertificate();
    }
  }, [reportId, userId]);

  const loadCertificate = async () => {
    if (!reportId) return;

    try {
      const response = await fetch(`/api/student-certificates?reportId=${reportId}&userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.certificate) {
          setCertificateUrl(data.certificate.certificate_url);
          setOriginalUrl(data.certificate.certificate_url);
        }
      }
    } catch (error) {
      console.error('Failed to load certificate:', error);
    }
  };

  const handleSave = async () => {
    if (!reportId || !certificateUrl.trim()) {
      setError('Certificate URL is required');
      return;
    }

    // Validate URL
    try {
      new URL(certificateUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/student-certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          userId,
          certificateUrl: certificateUrl.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save certificate');
      }

      const data = await response.json();
      setCertificateUrl(data.certificate.certificate_url);
      setOriginalUrl(data.certificate.certificate_url);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || 'Failed to save certificate');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCertificateUrl(originalUrl);
    setIsEditing(false);
    setError(null);
  };

  const handleDelete = async () => {
    if (!reportId || !window.confirm('Are you sure you want to remove this certificate link?')) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/student-certificates?reportId=${reportId}&userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete certificate');
      }

      setCertificateUrl('');
      setOriginalUrl('');
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || 'Failed to delete certificate');
    } finally {
      setIsSaving(false);
    }
  };

  // Don't show anything if no reportId
  if (!reportId) {
    return null;
  }

  // Show certificate link for all users if it exists
  if (!isAdmin && certificateUrl) {
    return (
      <Card>
        <Heading size="5" mb="3">🎓 Certificate</Heading>
        <Flex direction="column" gap="3">
          <Box>
            <a 
              href={certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--accent-11)',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              View Certificate →
            </a>
          </Box>
        </Flex>
      </Card>
    );
  }

  // Admin interface
  if (!isAdmin) {
    return null;
  }

  return (
    <Card>
      <Heading size="5" mb="3">🎓 Certificate Link</Heading>
      
      {!isEditing && !certificateUrl ? (
        <Flex direction="column" gap="3">
          <Text size="2" color="gray">No certificate link has been added for this student.</Text>
          <Box>
            <Button onClick={() => setIsEditing(true)}>
              Add Certificate Link
            </Button>
          </Box>
        </Flex>
      ) : !isEditing && certificateUrl ? (
        <Flex direction="column" gap="3">
          <Box>
            <Text size="2" color="gray" style={{ display: 'block', marginBottom: '8px' }}>
              Certificate URL:
            </Text>
            <a 
              href={certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--accent-11)',
                textDecoration: 'none',
                fontSize: '14px',
                wordBreak: 'break-all',
              }}
            >
              {certificateUrl}
            </a>
          </Box>
          <Flex gap="2">
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit
            </Button>
            <Button onClick={handleDelete} variant="soft" color="red" disabled={isSaving}>
              Remove
            </Button>
          </Flex>
        </Flex>
      ) : (
        <Flex direction="column" gap="3">
          <Box>
            <Text size="2" color="gray" style={{ display: 'block', marginBottom: '8px' }}>
              Certificate URL:
            </Text>
            <TextField.Root
              size="2"
              placeholder="https://example.com/certificate/..."
              value={certificateUrl}
              onChange={(e) => setCertificateUrl(e.target.value)}
              disabled={isSaving}
            />
          </Box>
          
          {error && (
            <Text size="2" color="red">{error}</Text>
          )}
          
          <Flex gap="2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </Flex>
        </Flex>
      )}
    </Card>
  );
}



