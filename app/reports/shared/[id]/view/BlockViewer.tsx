'use client';

import React, { useState } from 'react';
import { Table, Text, Card, Box, Badge, Flex } from '@radix-ui/themes';
import * as Accordion from '@radix-ui/react-accordion';
import { ReportBlock } from '@/lib/types';
import { Pie, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from 'chart.js';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { 
  getPerformanceSegmentChartColor, 
  getPerformanceSegmentBadgeStyle,
  getEasingPatternChartColor,
  getEasingPatternBadgeStyle,
  CHART_BORDERS
} from '@/lib/utils/segment-colors';

dayjs.extend(isoWeek);

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

interface BlockViewerProps {
  block: ReportBlock;
}

export function BlockViewer({ block }: BlockViewerProps) {
  switch (block.type) {
    case 'section':
      return (
        <Box>
          {block.content.split('\n').map((paragraph, idx) => (
            paragraph.trim() ? (
              <Text key={idx} as="p" size="3" mb="3" style={{ lineHeight: 1.7 }}>
                {paragraph}
              </Text>
            ) : null
          ))}
        </Box>
      );

    case 'comments':
      return (
        <Card style={{ backgroundColor: 'var(--yellow-2)', borderLeft: '4px solid var(--yellow-9)' }}>
          <Box>
            {block.content.split('\n').map((line, idx) => {
              // Check if line starts with **
              if (line.startsWith('**') && line.includes(':**')) {
                const [label, ...rest] = line.split(':**');
                return (
                  <Text key={idx} as="div" size="3" mb="2" weight="bold">
                    {label.replace(/\*\*/g, '')}:{rest.join(':**')}
                  </Text>
                );
              }
              return line.trim() ? (
                <Text key={idx} as="p" size="3" mb="2" style={{ lineHeight: 1.7 }}>
                  {line}
                </Text>
              ) : null;
            })}
          </Box>
        </Card>
      );

    case 'table':
      return (
        <>
          <TableBlockViewer block={block} />
          {block.helpText && <HelpAccordion helpText={block.helpText} />}
        </>
      );

    case 'pie-chart':
      return (
        <>
          <PieChartBlockViewer block={block} />
          {block.helpText && <HelpAccordion helpText={block.helpText} />}
        </>
      );

    case 'line-chart':
      return (
        <>
          <LineChartBlockViewer block={block} />
          {block.helpText && <HelpAccordion helpText={block.helpText} />}
        </>
      );

    case 'bar-chart':
      return (
        <>
          <BarChartBlockViewer block={block} />
          {block.helpText && <HelpAccordion helpText={block.helpText} />}
        </>
      );

    case 'student-project-comment':
      return (
        <Card style={{ backgroundColor: 'var(--blue-2)', borderLeft: '4px solid var(--blue-9)' }}>
          <Box>
            {block.content.split('\n').map((line, idx) => (
              line.trim() ? (
                <Text key={idx} as="p" size="3" mb="2" style={{ lineHeight: 1.7 }}>
                  {line}
                </Text>
              ) : null
            ))}
          </Box>
        </Card>
      );

    case 'certificate':
      return (
        <Card style={{ backgroundColor: 'var(--green-2)', borderLeft: '4px solid var(--green-9)' }}>
          <Box>
            {block.content ? (
              <a 
                href={block.content}
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
                🎓 View Your Certificate →
              </a>
            ) : (
              <Text size="3" color="gray">Certificate URL not available</Text>
            )}
          </Box>
        </Card>
      );

    case 'learning-outcomes':
      return (
        <>
          <LearningOutcomesBlockViewer block={block} />
          {block.helpText && <HelpAccordion helpText={block.helpText} />}
        </>
      );

    default:
      return <Text color="red">Unknown block type: {block.type}</Text>;
  }
}

function TableBlockViewer({ block }: { block: ReportBlock }) {
  if (!block.data || !Array.isArray(block.data)) {
    return <Text color="gray">No table data</Text>;
  }

  const columns = block.config?.columns || Object.keys(block.data[0] || {});

  // Use centralized color system - try both easing and segment badges with exact RGB colors
  const getBadgeStyle = (value: string): React.CSSProperties => {
    if (!value) return {};
    
    // Try easing pattern first (check if it's an easing keyword)
    const easingKeywords = ['ease-out', 'ease-in', 'ease-in-out', 'ease', 'linear', 'no-activity'];
    if (easingKeywords.some(keyword => value.toLowerCase().includes(keyword))) {
      return getEasingPatternBadgeStyle(value);
    }
    
    // Try performance segment
    return getPerformanceSegmentBadgeStyle(value);
  };

  return (
    <Box style={{ overflowX: 'auto' }}>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            {columns.map((col: string) => (
              <Table.ColumnHeaderCell key={col}>
                {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {block.data.map((row: any, idx: number) => (
            <Table.Row key={idx}>
              {columns.map((col: string) => {
                const cellValue = row[col];
                
                // Add clickable link for topic column if lesson_id is available
                if (col === 'topic' && row.lesson_id) {
                  return (
                    <Table.Cell key={col}>
                      <a 
                        href={`https://cogniterra.org/lesson/${row.lesson_id}/step/1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                          color: 'var(--accent-11)', 
                          textDecoration: 'none',
                          borderBottom: '1px solid var(--accent-11)',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        <Text size="2" weight="bold">{cellValue}</Text>
                      </a>
                    </Table.Cell>
                  );
                }
                
                if (col === 'segment' && cellValue) {
                  return (
                    <Table.Cell key={col}>
                      <Badge 
                        size="1" 
                        style={getBadgeStyle(cellValue)}
                      >
                        {cellValue}
                      </Badge>
                    </Table.Cell>
                  );
                }
                
                if (col === 'meetings' && cellValue && typeof cellValue === 'string') {
                  const oldFormatMatch = cellValue.match(/^(\d+)\/(\d+)%$/);
                  if (oldFormatMatch) {
                    const attended = parseInt(oldFormatMatch[1]);
                    const percentage = parseInt(oldFormatMatch[2]);
                    const total = percentage > 0 ? Math.round(attended / (percentage / 100)) : 0;
                    const newFormat = `${attended}/${total} (${percentage}%)`;
                    return (
                      <Table.Cell key={col}>
                        {newFormat}
                      </Table.Cell>
                    );
                  }
                }
                
                if (col === 'pattern' && cellValue) {
                  return (
                    <Table.Cell key={col}>
                      <Badge 
                        size="1"
                        style={getBadgeStyle(cellValue)}
                      >
                        {cellValue}
                      </Badge>
                    </Table.Cell>
                  );
                }
                
                return (
                  <Table.Cell key={col}>
                    {cellValue !== undefined ? String(cellValue) : '-'}
                  </Table.Cell>
                );
              })}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

function PieChartBlockViewer({ block }: { block: ReportBlock }) {
  if (!block.data) {
    return <Text color="gray">No chart data</Text>;
  }

  // Use centralized color system - try both easing and segment colors
  const getChartColor = (label: string): string => {
    if (!label) return 'rgba(156, 163, 175, 0.8)';
    
    // Try easing pattern first
    const easingColor = getEasingPatternChartColor(label);
    if (easingColor !== 'rgba(156, 163, 175, 0.8)') {
      return easingColor;
    }
    
    // Try performance segment
    return getPerformanceSegmentChartColor(label);
  };

  const getSegmentSortOrder = (label: string): number => {
    const labelLower = label.toLowerCase();
    if (labelLower.includes('highly efficient')) return 1;
    if (labelLower.includes('highly engaged')) return 2;
    if (labelLower.includes('moderately engaged')) return 3;
    if (labelLower.includes('moderately performing')) return 4;
    if (labelLower.includes('highly effortful')) return 5;
    if (labelLower.includes('low participation')) return 6;
    return 99;
  };

  const entries = Object.entries(block.data).sort(([labelA], [labelB]) => {
    return getSegmentSortOrder(labelA) - getSegmentSortOrder(labelB);
  });

  const labels = entries.map(([label]) => label);
  const values = entries.map(([, value]) => value as number);

  const backgroundColors = labels.map(label => getChartColor(label));

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: backgroundColors,
        borderColor: CHART_BORDERS.PIE_WHITE,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: block.config?.showLegend !== false,
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = values.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <Box 
      style={{ height: '350px', position: 'relative', padding: '16px 0' }}
      data-chart-type="pie"
      data-chart-data={JSON.stringify(chartData)}
    >
      <Pie data={chartData} options={options} />
    </Box>
  );
}

function LineChartBlockViewer({ block }: { block: ReportBlock }) {
  if (!block.data || !Array.isArray(block.data)) {
    return <Text color="gray">No chart data</Text>;
  }

  const xField = block.config?.xField || 'x';
  const yField = block.config?.yField || 'y';

  const chartData = {
    labels: block.data.map((d: any, idx) => {
      // Format label if it's a normalized value
      const xVal = d[xField];
      if (typeof xVal === 'number' && xVal >= 0 && xVal <= 1) {
        return `${(xVal * 100).toFixed(0)}%`;
      }
      return xVal;
    }),
    datasets: [
      {
        label: block.title,
        data: block.data.map((d: any) => d[yField]),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: block.config?.showLegend !== false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Progress (%)',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cumulative Activity',
        },
      },
    },
  };

  return (
    <Box 
      style={{ height: '350px', position: 'relative', padding: '16px 0' }}
      data-chart-type="line"
      data-chart-data={JSON.stringify(chartData)}
    >
      <Line data={chartData} options={options} />
    </Box>
  );
}

function BarChartBlockViewer({ block }: { block: ReportBlock }) {
  if (!block.data || !Array.isArray(block.data)) {
    return <Text color="gray">No chart data</Text>;
  }

  const groupBy = block.config?.groupBy;
  const datasets = block.config?.datasets;
  
  // Module activity chart (with datasets configuration)
  if (datasets && Array.isArray(datasets)) {
    const labels = block.data.map((item: any) => item.label || '');
    
    const chartDatasets = datasets.map((ds: any) => ({
      label: ds.label,
      data: block.data.map((item: any) => item[ds.dataKey] || 0),
      backgroundColor: ds.backgroundColor,
      borderColor: ds.borderColor,
      borderWidth: ds.borderWidth || 1,
      yAxisID: ds.yAxisID || 'y',
    }));

    const scales: any = {
      x: {
        title: {
          display: true,
          text: 'Module',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    };

    // Add Y axes from config
    if (block.config?.scales) {
      Object.entries(block.config.scales).forEach(([key, scaleConfig]: [string, any]) => {
        scales[key] = {
          type: 'linear' as const,
          display: true,
          position: scaleConfig.position || 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: scaleConfig.title || '',
          },
          ...(scaleConfig.position === 'right' ? {
            grid: {
              drawOnChartArea: false,
            },
          } : {}),
        };
      });
    }

    const chartData = {
      labels,
      datasets: chartDatasets,
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: block.config?.showLegend !== false,
        },
      },
      scales,
    };

    return (
      <Box 
        style={{ height: '400px', position: 'relative', padding: '16px 0' }}
        data-chart-type="bar"
        data-chart-data={JSON.stringify(chartData)}
      >
        <Bar data={chartData} options={options} />
      </Box>
    );
  }
  
  // Weekly activity chart (legacy)
  if (groupBy === 'week') {
    // Group by ISO week
    const weekMap = new Map<string, { weekLabel: string; platformActivity: number; meetingsActivity: number }>();

    block.data.forEach((row: any) => {
      const date = dayjs(row.date_iso);
      if (!date.isValid()) return;

      const weekKey = `${date.isoWeekYear()}-W${String(date.isoWeek()).padStart(2, '0')}`;
      
      if (!weekMap.has(weekKey)) {
        const weekStart = date.startOf('isoWeek');
        const weekEnd = date.endOf('isoWeek');
        weekMap.set(weekKey, {
          weekLabel: `Week ${date.isoWeek()} (${weekStart.format('MMM D')} - ${weekEnd.format('MMM D')})`,
          platformActivity: 0,
          meetingsActivity: 0,
        });
      }

      const weekData = weekMap.get(weekKey)!;
      weekData.platformActivity += row.activity_platform || 0;
      weekData.meetingsActivity += row.activity_meetings || 0;
    });

    // Sort by week
    const sortedWeeks = Array.from(weekMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, data]) => data);

    const chartData = {
      labels: sortedWeeks.map(w => w.weekLabel),
      datasets: [
        {
          label: 'Platform Activity',
          data: sortedWeeks.map(w => w.platformActivity),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Meetings',
          data: sortedWeeks.map(w => w.meetingsActivity),
          backgroundColor: 'rgba(153, 102, 255, 0.8)',
          borderColor: 'rgb(153, 102, 255)',
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: block.config?.showLegend !== false,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Week',
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Platform Activity',
            color: 'rgb(75, 192, 192)',
          },
        },
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          beginAtZero: true,
          max: Math.max(...sortedWeeks.map(w => w.meetingsActivity)) + 1 || 5,
          title: {
            display: true,
            text: 'Meetings',
            color: 'rgb(153, 102, 255)',
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            stepSize: 1,
          },
        },
      },
    };

    return (
      <Box 
        style={{ height: '400px', position: 'relative', padding: '16px 0' }}
        data-chart-type="bar"
        data-chart-data={JSON.stringify(chartData)}
      >
        <Bar data={chartData} options={options} />
      </Box>
    );
  }

  // Default bar chart (no grouping)
  return <Text color="gray">Bar chart configuration not supported</Text>;
}

function LearningOutcomesBlockViewer({ block }: { block: ReportBlock }) {
  // Parse data from block.data or from block.content (JSON string)
  const modules = block.data || (block.content ? JSON.parse(block.content) : []);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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

  const parseOutcomes = (text: string): string[] => {
    return text
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
      .map(line => line.replace(/^[-\d.]\s*/, '').trim())
      .filter(line => line.length > 0);
  };

  const parseTools = (text: string): string[] => {
    return text
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0);
  };

  const getProgressColor = (rate: number): 'green' | 'orange' | 'red' => {
    if (rate >= 75) return 'green';
    if (rate >= 50) return 'orange';
    return 'red';
  };

  if (!modules || modules.length === 0) {
    return <Text color="gray">No learning outcomes data available</Text>;
  }

  const isGroup = block.config?.viewType === 'group';

  return (
    <Box style={{ overflowX: 'auto' }}>
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
          {modules.map((module: any) => {
            const outcomes = module.learning_outcomes ? parseOutcomes(module.learning_outcomes) : [];
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
                      {module.completion_rate?.toFixed(0) || 0}% done
                    </Badge>
                    <Text size="1" color="gray">
                      {module.success_rate?.toFixed(0) || 0}% success
                    </Text>
                    {isGroup && module.total_students && (
                      <Text size="1" color="gray">
                        {module.total_students} students
                      </Text>
                    )}
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
                        <Badge key={idx} color="purple" variant="soft" size="1">
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
  );
}

function HelpAccordion({ helpText }: { helpText: string }) {
  return (
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
            <div
              dangerouslySetInnerHTML={{ __html: helpText }}
              style={{
                fontSize: '14px',
                lineHeight: '1.7',
              }}
              className="help-content"
            />
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
              .help-content :global(em) {
                font-style: italic;
              }
            `}</style>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </Box>
  );
}
