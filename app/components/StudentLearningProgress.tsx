'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, Flex, Spinner, Text, Heading, Box, Badge, Table } from '@radix-ui/themes';
import * as Accordion from '@radix-ui/react-accordion';
import { processModuleAnalytics } from '@/lib/processors/module-analytics';
import { getCompletionRateBadgeColor, BADGE_COLORS } from '@/lib/utils/segment-colors';

interface StudentLearningProgressProps {
  reportId: string;
  userId: string;
  submissions: any[];
  structure: any[];
  courseId: number;
  meetings?: any[];
  studentName?: string;
}

interface ModuleProgress {
  module_id: number;
  module_name: string;
  module_position: number;
  completion_rate: number;
  success_rate: number;
  learningOutcomes?: string;
  tools?: string;
}

export function StudentLearningProgress({ 
  reportId,
  userId,
  submissions, 
  structure, 
  courseId, 
  meetings,
  studentName 
}: StudentLearningProgressProps) {
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadStudentLearningData();
  }, [reportId, userId, submissions, structure, courseId, meetings]);

  const loadStudentLearningData = async () => {
    try {
      setLoading(true);

      // Extract unique module IDs from structure data
      const moduleIdsSet = new Set<number>();
      for (const row of structure) {
        const moduleId = Number(row.module_id || row.moduleid || 0);
        if (moduleId > 0) {
          moduleIdsSet.add(moduleId);
        }
      }
      
      const moduleIds = Array.from(moduleIdsSet);
      
      if (moduleIds.length === 0) {
        setModuleProgress([]);
        return;
      }

      // Fetch module names, learning outcomes, and tools in parallel
      const [modulesResponse, outcomesResponse, toolsResponse] = await Promise.all([
        fetch(`/api/cogniterra/modules?moduleIds=${moduleIds.join(',')}`),
        fetch(`/api/reports/learning-outcomes?reportId=${reportId}`),
        fetch(`/api/reports/module-tools?reportId=${reportId}`),
      ]);

      if (!modulesResponse.ok) {
        throw new Error('Failed to fetch module names');
      }

      const modulesData = await modulesResponse.json();
      const moduleNamesMap = modulesData.modules;

      // Parse outcomes and tools
      const outcomesData = outcomesResponse.ok ? await outcomesResponse.json() : { learningOutcomes: [] };
      const toolsData = toolsResponse.ok ? await toolsResponse.json() : { moduleTools: [] };

      // Create maps for quick lookup
      const outcomesMap = new Map<number, string>(
        (outcomesData.learningOutcomes || []).map((lo: any) => [lo.module_id, lo.outcomes])
      );
      const toolsMap = new Map<number, string>(
        (toolsData.moduleTools || []).map((mt: any) => [mt.module_id, mt.tools])
      );
      
      // Process module analytics for this student
      const stats = processModuleAnalytics(
        userId, 
        submissions, 
        structure, 
        moduleNamesMap, 
        meetings
      );
      
      // Build module progress data
      const progress: ModuleProgress[] = stats.map(stat => ({
        module_id: stat.module_id,
        module_name: stat.module_name,
        module_position: stat.module_position,
        completion_rate: stat.completion_rate,
        success_rate: stat.success_rate,
        learningOutcomes: outcomesMap.get(stat.module_id),
        tools: toolsMap.get(stat.module_id),
      })).sort((a, b) => a.module_position - b.module_position);
      
      setModuleProgress(progress);
    } catch (err: any) {
      console.error('Error loading student learning data:', err);
      setModuleProgress([]);
    } finally {
      setLoading(false);
    }
  };

  // Using centralized color system
  const getProgressColor = getCompletionRateBadgeColor;

  const parseOutcomes = (text: string): string[] => {
    // Parse outcomes from markdown format
    return text
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
      .map(line => line.replace(/^[-\d.]\s*/, '').trim())
      .filter(line => line.length > 0);
  };

  const parseTools = (text: string): string[] => {
    // Parse tools from markdown format
    return text
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0);
  };

  const toggleRowExpansion = (moduleId: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Card>
        <Flex align="center" gap="3" p="4">
          <Spinner />
          <Text>Loading learning outcomes and tools progress...</Text>
        </Flex>
      </Card>
    );
  }

  if (moduleProgress.length === 0) {
    return (
      <Card>
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No module data available
        </div>
      </Card>
    );
  }

  // Filter modules that have outcomes or tools
  const modulesWithContent = moduleProgress.filter(m => m.learningOutcomes || m.tools);
  const firstName = studentName ? studentName.split(' ')[0] : 'Student';

  return (
    <Card>
      <Heading size="5" mb="3">🎯 {firstName}'s Learning Outcomes & Tools Progress</Heading>
      <Text size="2" color="gray" mb="4">
        Track how {firstName} is mastering learning outcomes and tools across course modules.
      </Text>

      {modulesWithContent.length === 0 && (
        <Box p="4" style={{ backgroundColor: 'var(--yellow-2)', borderRadius: 'var(--radius-2)', marginBottom: '16px' }}>
          <Text size="2" color="gray">
            💡 No learning outcomes or tools have been defined yet. Visit the{' '}
            <a href={`/reports/${reportId}/preview/settings?tab=preview`} style={{ color: 'var(--accent-11)', textDecoration: 'underline' }}>
              Settings page
            </a>{' '}
            to generate them for each module.
          </Text>
        </Box>
      )}

      {/* Table with all modules */}
      {modulesWithContent.length > 0 && (
        <Box mb="4" style={{ overflowX: 'auto' }}>
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell style={{ width: '20%' }}>Module</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ width: '15%' }}>Progress</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ width: '40%' }}>📚 Learning Outcomes</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ width: '25%' }}>🔧 Tools</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {modulesWithContent.map((module) => {
                const outcomes = module.learningOutcomes ? parseOutcomes(module.learningOutcomes) : [];
                const tools = module.tools ? parseTools(module.tools) : [];
                const progressColor = getProgressColor(module.completion_rate);

                return (
                  <Table.Row key={module.module_id}>
                    {/* Module Name */}
                    <Table.Cell>
                      <Text size="2" weight="bold" as="div" mb="1">
                        {module.module_name}
                      </Text>
                      <Text size="1" color="gray">
                        Module {module.module_position}
                      </Text>
                    </Table.Cell>

                    {/* Progress Metrics */}
                    <Table.Cell>
                      <Flex direction="column" gap="1">
                        <Badge color={progressColor} size="1">
                          {module.completion_rate.toFixed(0)}% done
                        </Badge>
                        <Text size="1" color="gray">
                          {module.success_rate.toFixed(0)}% success
                        </Text>
                      </Flex>
                    </Table.Cell>

                    {/* Learning Outcomes */}
                    <Table.Cell>
                      {outcomes.length > 0 ? (
                        <Box>
                          <Box 
                            style={{ 
                              maxHeight: expandedRows.has(module.module_id) ? 'none' : '3em',
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                          >
                            {outcomes.map((outcome, idx) => (
                              <Text 
                                key={idx} 
                                size="2" 
                                as="div" 
                                mb="1"
                                style={{ 
                                  color: 'var(--gray-12)',
                                  lineHeight: 1.5,
                                }}
                              >
                                • {outcome}
                              </Text>
                            ))}
                          </Box>
                          {outcomes.length > 1 && (
                            <button
                              onClick={() => toggleRowExpansion(module.module_id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent-11)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                padding: '4px 0',
                                marginTop: '4px',
                                fontWeight: 500,
                              }}
                            >
                              {expandedRows.has(module.module_id) ? '▲ Show less' : '▼ See all'}
                            </button>
                          )}
                        </Box>
                      ) : (
                        <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
                          Not defined
                        </Text>
                      )}
                    </Table.Cell>

                    {/* Tools */}
                    <Table.Cell>
                      {tools.length > 0 ? (
                        <Flex gap="1" wrap="wrap">
                          {tools.map((tool, idx) => (
                            <Badge key={idx} color={BADGE_COLORS.TOOLS} variant="soft" size="1">
                              {tool}
                            </Badge>
                          ))}
                        </Flex>
                      ) : (
                        <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
                          Not defined
                        </Text>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Summary Statistics */}
      <Box mt="4" p="3" style={{ backgroundColor: 'var(--gray-a2)', borderRadius: 'var(--radius-2)' }}>
        <Flex gap="4" wrap="wrap">
          <Box>
            <Text size="1" color="gray" as="div">Total Modules</Text>
            <Text size="3" weight="bold">{moduleProgress.length}</Text>
          </Box>
          <Box>
            <Text size="1" color="gray" as="div">With Outcomes</Text>
            <Text size="3" weight="bold">
              {moduleProgress.filter(m => m.learningOutcomes).length}
            </Text>
          </Box>
          <Box>
            <Text size="1" color="gray" as="div">With Tools</Text>
            <Text size="3" weight="bold">
              {moduleProgress.filter(m => m.tools).length}
            </Text>
          </Box>
          <Box>
            <Text size="1" color="gray" as="div">Avg Progress</Text>
            <Text size="3" weight="bold" style={{ 
              color: `var(--${getProgressColor(
                moduleProgress.reduce((sum, m) => sum + m.completion_rate, 0) / moduleProgress.length
              )}-11)` 
            }}>
              {(moduleProgress.reduce((sum, m) => sum + m.completion_rate, 0) / moduleProgress.length).toFixed(1)}%
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Help Accordion */}
      <Box mt="3">
        <Accordion.Root type="single" collapsible>
          <Accordion.Item value="help" style={{ border: '1px solid var(--gray-6)', borderRadius: '6px' }}>
            <Accordion.Trigger
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--gray-2)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
                color: 'var(--gray-11)',
                fontWeight: 500,
                borderRadius: '6px',
              }}
            >
              <span>ℹ️ How to read this data</span>
              <span style={{ fontSize: '12px' }}>▼</span>
            </Accordion.Trigger>
            <Accordion.Content
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                lineHeight: 1.7,
                color: 'var(--gray-12)',
                backgroundColor: 'var(--gray-1)',
              }}
            >
              <div style={{ fontSize: '14px', lineHeight: '1.7' }} className="help-content">
                <p><strong>What this shows:</strong> This table shows how you're progressing toward mastering the learning outcomes and tools for each module in the course.</p>
                
                <p><strong>Table columns explained:</strong></p>
                <ul>
                  <li><strong>Module</strong> - The course section name and position</li>
                  <li><strong>Progress</strong> - Your completion and success rates
                    <ul>
                      <li>🟢 Green badge: ≥75% completion (excellent!)</li>
                      <li>🟠 Orange badge: 50-74% completion (good progress)</li>
                      <li>🔴 Red badge: &lt;50% completion (keep going!)</li>
                    </ul>
                  </li>
                  <li><strong>Learning Outcomes</strong> - What you should be able to do after completing this module</li>
                  <li><strong>Tools</strong> - Technologies and platforms you're learning to use</li>
                </ul>
                
                <p><strong>Understanding your progress:</strong></p>
                <ul>
                  <li><strong>High completion + high success</strong> - You're mastering the content well!</li>
                  <li><strong>High completion + lower success</strong> - You're engaged but might benefit from review</li>
                  <li><strong>Lower completion</strong> - Focus on completing more exercises in this module</li>
                  <li><strong>Click "See all"</strong> - Expand to view all learning outcomes for a module</li>
                </ul>
              </div>
              <style jsx>{`
                .help-content :global(p) {
                  margin: 0 0 12px 0;
                }
                .help-content :global(p:last-child) {
                  margin-bottom: 0;
                }
                .help-content :global(ul) {
                  margin: 8px 0;
                  padding-left: 20px;
                }
                .help-content :global(li) {
                  margin: 4px 0;
                }
                .help-content :global(strong) {
                  font-weight: 600;
                  color: var(--gray-12);
                }
              `}</style>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </Box>
    </Card>
  );
}

