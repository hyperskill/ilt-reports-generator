'use client';

import { useRef } from 'react';
import { Box, Card, Flex, Text, Badge, Button } from '@radix-ui/themes';
import { CSVFile } from '@/lib/types';
import styles from './FileUploadTile.module.css';

interface FileUploadTileProps {
  label: string;
  description: string;
  required: boolean;
  file?: CSVFile;
  state: 'empty' | 'uploading' | 'success' | 'error';
  error?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export function FileUploadTile({
  label,
  description,
  required,
  file,
  state,
  error,
  onUpload,
  onRemove,
}: FileUploadTileProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onUpload(selectedFile);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      onUpload(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getStateColor = () => {
    switch (state) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'uploading':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <Card className={styles.tile}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start">
          <Box>
            <Text weight="bold" size="3">{label}</Text>
            <Text size="2" color="gray" as="p" mt="1">{description}</Text>
          </Box>
          <Badge color={required ? 'red' : 'gray'}>
            {required ? 'Required' : 'Optional'}
          </Badge>
        </Flex>

        {state === 'empty' && (
          <Box
            className={styles.dropzone}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Text size="2" color="gray">
              Drag & drop or click to upload
            </Text>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </Box>
        )}

        {state === 'uploading' && (
          <Box className={styles.statusBox}>
            <Text size="2" color="blue">Uploading...</Text>
          </Box>
        )}

        {state === 'success' && file && (
          <Box className={styles.statusBox}>
            <Flex direction="column" gap="2">
              <Flex justify="between" align="center">
                <Text size="2" weight="bold">{file.name}</Text>
                <Badge color="green">✓</Badge>
              </Flex>
              <Text size="1" color="gray">
                {file.data.length} rows • {(file.size / 1024).toFixed(1)} KB
              </Text>
              <Flex gap="2" mt="2">
                <Button size="1" variant="soft" onClick={handleClick}>
                  Replace
                </Button>
                <Button size="1" variant="soft" color="red" onClick={onRemove}>
                  Remove
                </Button>
              </Flex>
            </Flex>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </Box>
        )}

        {state === 'error' && (
          <Box className={styles.statusBox}>
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <Badge color="red">Error</Badge>
                <Text size="2" color="red">{error}</Text>
              </Flex>
              <Button size="2" variant="soft" onClick={handleClick}>
                Try Again
              </Button>
            </Flex>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </Box>
        )}
      </Flex>
    </Card>
  );
}

