'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Flex, Heading, Text, Card } from '@radix-ui/themes';
import { AppLayout } from '@/app/components/AppLayout';
import { FileUploadTile } from '@/app/components/FileUploadTile';
import { useAppContext } from '@/lib/context/AppContext';
import { parseCSV, validateRequiredColumns, getFileValidation } from '@/lib/utils/csv-parser';
import { CSVFile } from '@/lib/types';
import styles from './upload.module.css';

type FileType = 'grade_book' | 'learners' | 'submissions' | 'activity' | 'meetings';

interface FileConfig {
  key: FileType;
  label: string;
  required: boolean;
  description: string;
}

const FILE_CONFIGS: FileConfig[] = [
  {
    key: 'grade_book',
    label: 'Grade Book',
    required: true,
    description: 'Student grades and scores (user_id, total)',
  },
  {
    key: 'learners',
    label: 'Learners',
    required: true,
    description: 'Student information (user_id, first_name, last_name)',
  },
  {
    key: 'submissions',
    label: 'Submissions',
    required: true,
    description: 'Student submissions (user_id, step_id, status, timestamp)',
  },
  {
    key: 'activity',
    label: 'Activity',
    required: true,
    description: 'Student activity data (user_id, timestamp, active_minutes)',
  },
  {
    key: 'meetings',
    label: 'Meetings',
    required: false,
    description: 'Meeting attendance with [dd.mm.yyyy] columns (optional)',
  },
];

export default function UploadPage() {
  const router = useRouter();
  const { files, setFiles } = useAppContext();
  const [uploadState, setUploadState] = useState<Record<string, 'empty' | 'uploading' | 'success' | 'error'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileUpload = async (fileType: FileType, file: File) => {
    setUploadState(prev => ({ ...prev, [fileType]: 'uploading' }));
    setErrors(prev => ({ ...prev, [fileType]: '' }));

    try {
      const data = await parseCSV(file);
      
      // Validate required columns
      const requiredColumns = getFileValidation(fileType);
      if (requiredColumns.length > 0) {
        const validation = validateRequiredColumns(data, requiredColumns);
        if (!validation.valid) {
          throw new Error(`Missing required columns: ${validation.missing.join(', ')}`);
        }
      }

      const csvFile: CSVFile = {
        name: file.name,
        data,
        size: file.size,
        uploadedAt: new Date(),
      };

      setFiles({ ...files, [fileType]: csvFile });
      setUploadState(prev => ({ ...prev, [fileType]: 'success' }));
    } catch (error) {
      setUploadState(prev => ({ ...prev, [fileType]: 'error' }));
      setErrors(prev => ({
        ...prev,
        [fileType]: error instanceof Error ? error.message : 'Failed to upload file',
      }));
    }
  };

  const handleRemove = (fileType: FileType) => {
    const newFiles = { ...files };
    delete newFiles[fileType];
    setFiles(newFiles);
    setUploadState(prev => ({ ...prev, [fileType]: 'empty' }));
    setErrors(prev => ({ ...prev, [fileType]: '' }));
  };

  const canContinue = () => {
    const requiredFiles = FILE_CONFIGS.filter(f => f.required);
    return requiredFiles.every(f => files[f.key] && uploadState[f.key] === 'success');
  };

  const handleContinue = () => {
    if (canContinue()) {
      router.push('/review');
    }
  };

  return (
    <AppLayout
      title="Get Started"
      subtitle="Upload your CSV files to begin analyzing student performance and activity patterns."
    >
      <Box className={styles.uploadGrid}>
        {FILE_CONFIGS.map(config => (
          <FileUploadTile
            key={config.key}
            label={config.label}
            description={config.description}
            required={config.required}
            file={files[config.key]}
            state={uploadState[config.key] || 'empty'}
            error={errors[config.key]}
            onUpload={(file) => handleFileUpload(config.key, file)}
            onRemove={() => handleRemove(config.key)}
          />
        ))}
      </Box>

      <Box mt="6">
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">What does each mode produce?</Heading>
            <Box>
              <Text weight="bold" size="3">Performance Segmentation</Text>
              <Text size="2" color="gray" as="p" mt="1">
                Builds a static performance profile per learner (grades, attempts, persistence, meeting attendance)
                and assigns a segment (e.g., "Leader efficient", "Balanced middle").
              </Text>
            </Box>
            <Box>
              <Text weight="bold" size="3">Dynamic/Easing Segmentation</Text>
              <Text size="2" color="gray" as="p" mt="1">
                Analyzes temporal activity and classifies each learner's cumulative behavior as a CSS-like easing
                (linear, ease, ease-in, ease-out, ease-in-out).
              </Text>
            </Box>
          </Flex>
        </Card>
      </Box>

      <Flex gap="3" mt="6" justify="end">
        <Button size="3" disabled={!canContinue()} onClick={handleContinue}>
          Continue
        </Button>
      </Flex>
    </AppLayout>
  );
}

