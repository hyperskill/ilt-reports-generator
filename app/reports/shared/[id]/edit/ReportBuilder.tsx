'use client';

import { useState, useRef } from 'react';
import { Button, Card, Flex, Text, TextArea, TextField, Box, Badge, Dialog, Select } from '@radix-ui/themes';
import { ReportBlock } from '@/lib/types';
import { BlockRenderer } from './BlockRenderer';
import styles from './ReportBuilder.module.css';

interface ReportBuilderProps {
  initialBlocks: ReportBlock[];
  reportTitle: string;
  reportDescription?: string;
  onSave: (blocks: ReportBlock[], title: string, description?: string) => Promise<boolean | void>;
  sourceReportId: string;
  reportType: 'manager' | 'student';
  userId?: number;
}

export default function ReportBuilder({
  initialBlocks,
  reportTitle,
  reportDescription,
  onSave,
  sourceReportId,
  reportType,
  userId,
}: ReportBuilderProps) {
  const [blocks, setBlocks] = useState<ReportBlock[]>(
    initialBlocks.sort((a, b) => a.order - b.order)
  );
  const [allBlocks, setAllBlocks] = useState<ReportBlock[]>(initialBlocks);
  const [title, setTitle] = useState(reportTitle);
  const [description, setDescription] = useState(reportDescription || '');
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [savingBlockId, setSavingBlockId] = useState<string | null>(null);
  const [editedBlocks, setEditedBlocks] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');

  // Get original block ID (without -copy- suffix)
  const getOriginalBlockId = (blockId: string): string => {
    const copyIndex = blockId.indexOf('-copy-');
    return copyIndex > 0 ? blockId.substring(0, copyIndex) : blockId;
  };

  // Update allBlocks whenever blocks are saved to keep track of latest versions
  const updateAllBlocks = (currentBlocks: ReportBlock[]) => {
    const updatedAllBlocks = [...allBlocks];
    
    currentBlocks.forEach(currentBlock => {
      const originalId = getOriginalBlockId(currentBlock.id);
      const index = updatedAllBlocks.findIndex(b => getOriginalBlockId(b.id) === originalId);
      
      if (index >= 0) {
        // Update the block with latest content
        updatedAllBlocks[index] = {
          ...currentBlock,
          id: originalId, // Keep original ID
        };
      }
    });
    
    setAllBlocks(updatedAllBlocks);
  };

  // Filter available blocks to exclude already added ones
  const unusedBlocks = allBlocks.filter(availBlock => {
    const originalId = getOriginalBlockId(availBlock.id);
    return !blocks.some(block => getOriginalBlockId(block.id) === originalId);
  });

  // Add special "Create Learning Outcomes" option if it doesn't exist yet
  const hasLearningOutcomesBlock = blocks.some(b => b.type === 'learning-outcomes');
  const blocksWithSpecialOptions = hasLearningOutcomesBlock ? unusedBlocks : [
    {
      id: '__create_learning_outcomes__',
      type: 'learning-outcomes' as any,
      title: '📚 Create Learning Outcomes & Tools Block',
      content: '',
      order: 0,
    },
    ...unusedBlocks
  ];

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newBlocks = [...blocks];
    const draggedBlock = newBlocks[draggedIndex];
    newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(index, 0, draggedBlock);

    // Update order
    const reorderedBlocks = newBlocks.map((block, idx) => ({
      ...block,
      order: idx,
    }));

    setBlocks(reorderedBlocks);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleBlockContentChange = (blockId: string, newContent: string) => {
    setBlocks(blocks.map(block => {
      if (block.id === blockId) {
        // For learning-outcomes blocks, update data instead of content
        if (block.type === 'learning-outcomes') {
          try {
            const parsedData = JSON.parse(newContent);
            return { ...block, data: parsedData };
          } catch (e) {
            console.error('Failed to parse learning outcomes data:', e);
            return block;
          }
        }
        // For other blocks, update content as usual
        return { ...block, content: newContent };
      }
      return block;
    }));
    setEditedBlocks(prev => new Set(prev).add(blockId));
  };

  const handleBlockTitleChange = (blockId: string, newTitle: string) => {
    setBlocks(blocks.map(block => 
      block.id === blockId ? { ...block, title: newTitle } : block
    ));
    setEditedBlocks(prev => new Set(prev).add(blockId));
  };

  const handleSaveBlock = async (blockId: string) => {
    setSavingBlockId(blockId);
    try {
      const result = await onSave(blocks, title, description);
      if (result !== false) {
        setEditedBlocks(prev => {
          const newSet = new Set(prev);
          newSet.delete(blockId);
          return newSet;
        });
        // Update allBlocks with latest versions
        updateAllBlocks(blocks);
      }
    } catch (error) {
      console.error('Error saving block:', error);
    } finally {
      setSavingBlockId(null);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this block?')) {
      return;
    }

    const newBlocks = blocks.filter(b => b.id !== blockId).map((block, idx) => ({
      ...block,
      order: idx,
    }));
    
    setBlocks(newBlocks);
    setEditedBlocks(prev => {
      const newSet = new Set(prev);
      newSet.delete(blockId);
      return newSet;
    });

    // Auto-save after deleting block
    setIsSaving(true);
    try {
      const result = await onSave(newBlocks, title, description);
      if (result === false) {
        // If save failed, revert
        setBlocks(blocks);
      }
    } catch (error) {
      console.error('Error auto-saving after block delete:', error);
      setBlocks(blocks);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlock = async (sourceBlockId: string) => {
    // Check if this is the special "Create Learning Outcomes" option
    if (sourceBlockId === '__create_learning_outcomes__') {
      setIsAddDialogOpen(false);
      await handleCreateLearningOutcomesBlock();
      return;
    }

    const sourceBlock = allBlocks.find(b => b.id === sourceBlockId);
    if (!sourceBlock) return;

    const newBlockId = `${sourceBlock.id}-copy-${Date.now()}`;
    const newBlock: ReportBlock = {
      ...sourceBlock,
      id: newBlockId,
      order: 0,
    };

    // Add to top and reorder all blocks
    const updatedBlocks = [newBlock, ...blocks].map((block, idx) => ({
      ...block,
      order: idx,
    }));
    
    setBlocks(updatedBlocks);
    setIsAddDialogOpen(false);

    // Auto-save after adding block
    setIsSaving(true);
    try {
      const result = await onSave(updatedBlocks, title, description);
      if (result === false) {
        // If save failed, revert
        setBlocks(blocks);
      }
    } catch (error) {
      console.error('Error auto-saving after block add:', error);
      setBlocks(blocks);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateLearningOutcomesBlock = async () => {
    setIsSaving(true);
    try {
      // Check if learning-outcomes block already exists
      const existingBlock = blocks.find(b => b.type === 'learning-outcomes');
      if (existingBlock) {
        alert('Learning Outcomes block already exists in this report');
        setIsSaving(false);
        return;
      }

      // Call server-side API to generate the block (ensures proper module names from Cogniterra API)
      const { pathname } = new URL(window.location.href);
      const sharedReportId = pathname.split('/')[3]; // Extract ID from /reports/shared/[id]/edit
      
      const response = await fetch(`/api/reports/shared/${sharedReportId}/generate-learning-outcomes-block`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create Learning Outcomes block');
        setIsSaving(false);
        return;
      }

      // Update order for the new block
      const learningOutcomesBlock = data.block;
      learningOutcomesBlock.order = blocks.length;

      // Add block to the end
      const updatedBlocks = [...blocks, learningOutcomesBlock];
      setBlocks(updatedBlocks);

      // Auto-save
      const result = await onSave(updatedBlocks, title, description);
      if (result === false) {
        // If save failed, revert
        setBlocks(blocks);
      }
    } catch (error: any) {
      console.error('Error creating learning outcomes block:', error);
      alert(`Failed to create Learning Outcomes block: ${error.message}`);
      setBlocks(blocks);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await onSave(blocks, title, description);
      if (result !== false) {
        setEditingBlockId(null);
        setEditedBlocks(new Set());
        // Update allBlocks with latest versions
        updateAllBlocks(blocks);
      }
    } catch (error) {
      console.error('Error saving all changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    const reorderedBlocks = newBlocks.map((block, idx) => ({
      ...block,
      order: idx,
    }));
    setBlocks(reorderedBlocks);
  };

  const handleMoveDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    const reorderedBlocks = newBlocks.map((block, idx) => ({
      ...block,
      order: idx,
    }));
    setBlocks(reorderedBlocks);
  };

  return (
    <div className={styles.container}>
      <Box mb="4">
        <Card>
          <Flex direction="column" gap="3">
            <div>
              <Text size="2" weight="bold" mb="1" as="div">Report Title</Text>
              <TextField.Root
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter report title"
                size="3"
              />
            </div>
            <div>
              <Text size="2" weight="bold" mb="1" as="div">Description (optional)</Text>
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this report"
                rows={2}
              />
            </div>
          </Flex>
        </Card>
      </Box>

      <Flex direction="column" gap="3" mb="4">
        <Flex justify="between" align="center">
          <Text size="5" weight="bold">Report Blocks</Text>
          <Flex gap="2" align="center">
            <Dialog.Root 
              open={isAddDialogOpen} 
              onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (open && blocksWithSpecialOptions.length > 0) {
                  setSelectedBlockId(blocksWithSpecialOptions[0].id);
                }
              }}
            >
              <Dialog.Trigger>
                <Button
                  size="2"
                  variant="soft"
                  color="green"
                  disabled={blocksWithSpecialOptions.length === 0}
                >
                  ➕ Add Block
                </Button>
              </Dialog.Trigger>

              <Dialog.Content style={{ maxWidth: 500 }}>
                <Dialog.Title>Add Block</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                  {blocksWithSpecialOptions.length > 0 
                    ? 'Choose a block from the available blocks to add to your report.'
                    : 'All available blocks have been added to your report.'
                  }
                </Dialog.Description>

                {blocksWithSpecialOptions.length > 0 ? (
                  <>
                    <Flex direction="column" gap="3">
                      <label>
                        <Text as="div" size="2" mb="1" weight="bold">
                          Available Blocks ({blocksWithSpecialOptions.length})
                        </Text>
                        <Select.Root value={selectedBlockId} onValueChange={setSelectedBlockId}>
                          <Select.Trigger style={{ width: '100%' }} />
                          <Select.Content>
                            {blocksWithSpecialOptions.map((block) => {
                              const icon = 
                                block.type === 'section' ? '📝' :
                                block.type === 'comments' ? '💬' :
                                block.type === 'table' ? '📊' :
                                block.type === 'pie-chart' ? '📈' :
                                block.type === 'line-chart' ? '📉' :
                                block.type === 'bar-chart' ? '📊' :
                                block.type === 'student-project-comment' ? '📝' :
                                block.type === 'learning-outcomes' ? '📚' : '📄';
                              
                              return (
                                <Select.Item key={block.id} value={block.id}>
                                  {icon} {block.title}
                                </Select.Item>
                              );
                            })}
                          </Select.Content>
                        </Select.Root>
                      </label>
                      <Text size="1" color="gray">
                        {selectedBlockId === '__create_learning_outcomes__' 
                          ? 'This will create a new Learning Outcomes & Tools block with data from your report.'
                          : 'The selected block will be added to the end of your report.'
                        }
                      </Text>
                    </Flex>

                    <Flex gap="3" mt="4" justify="end">
                      <Dialog.Close>
                        <Button variant="soft" color="gray">
                          Cancel
                        </Button>
                      </Dialog.Close>
                      <Button onClick={() => handleAddBlock(selectedBlockId)}>
                        Add Block
                      </Button>
                    </Flex>
                  </>
                ) : (
                  <Flex mt="4" justify="end">
                    <Dialog.Close>
                      <Button>
                        Close
                      </Button>
                    </Dialog.Close>
                  </Flex>
                )}
              </Dialog.Content>
            </Dialog.Root>
            <Text size="2" color="gray">Drag blocks to reorder</Text>
          </Flex>
        </Flex>

        {blocks.map((block, index) => (
          <Card
            key={block.id}
            className={`${styles.block} ${draggedIndex === index ? styles.dragging : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <Flex direction="column" gap="3">
              <Flex justify="between" align="start" gap="3">
                <Flex direction="column" gap="2" style={{ flex: 1 }}>
                  <Flex align="center" gap="2">
                    <div className={styles.dragHandle}>
                      <Text size="3">⋮⋮</Text>
                    </div>
                    <Text size="1" color="gray">Block {index + 1}</Text>
                    <Badge size="1" color={
                      block.type === 'section' ? 'blue' :
                      block.type === 'comments' ? 'yellow' :
                      block.type === 'table' ? 'green' :
                      block.type === 'pie-chart' ? 'purple' :
                      block.type === 'line-chart' ? 'orange' :
                      block.type === 'student-project-comment' ? 'cyan' :
                      block.type === 'learning-outcomes' ? 'purple' : 'gray'
                    }>
                      {block.type}
                    </Badge>
                    {editedBlocks.has(block.id) && (
                      <Badge size="1" color="red">Unsaved</Badge>
                    )}
                  </Flex>
                  
                  {editingBlockId === block.id ? (
                    <TextField.Root
                      value={block.title}
                      onChange={(e) => handleBlockTitleChange(block.id, e.target.value)}
                      placeholder="Block title"
                      size="2"
                      onBlur={() => setEditingBlockId(null)}
                      autoFocus
                    />
                  ) : (
                    <Text 
                      size="4" 
                      weight="bold"
                      className={styles.editableTitle}
                      onClick={() => setEditingBlockId(block.id)}
                    >
                      {block.title}
                    </Text>
                  )}
                </Flex>

                <Flex gap="1">
                  <Button
                    size="1"
                    variant="soft"
                    color="gray"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="1"
                    variant="soft"
                    color="gray"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === blocks.length - 1}
                  >
                    ↓
                  </Button>
                  {(block.type === 'section' || block.type === 'comments' || block.type === 'student-project-comment') && (
                    <Button
                      size="1"
                      variant="soft"
                      color="green"
                      onClick={() => handleSaveBlock(block.id)}
                      disabled={savingBlockId === block.id || !editedBlocks.has(block.id)}
                    >
                      {savingBlockId === block.id ? '...' : '💾'}
                    </Button>
                  )}
                  <Button
                    size="1"
                    variant="soft"
                    color="red"
                    onClick={() => handleDeleteBlock(block.id)}
                  >
                    🗑️
                  </Button>
                </Flex>
              </Flex>

              <BlockRenderer
                block={block}
                isEditing={true}
                onContentChange={(newContent) => handleBlockContentChange(block.id, newContent)}
              />
            </Flex>
          </Card>
        ))}
      </Flex>

      <Card>
        <Flex gap="3" justify="between" align="center">
          <Flex gap="2" align="center">
            <Button
              size="3"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
            
            {editedBlocks.size > 0 && (
              <Text size="2" color="orange" weight="bold">
                {editedBlocks.size} unsaved change{editedBlocks.size !== 1 ? 's' : ''}
              </Text>
            )}
          </Flex>

          <Text size="2" color="gray">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''}
          </Text>
        </Flex>
      </Card>
    </div>
  );
}
