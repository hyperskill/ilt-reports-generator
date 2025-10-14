'use client';

import { TextArea, Table, Text, Card, Box, Badge } from '@radix-ui/themes';
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

interface BlockRendererProps {
  block: ReportBlock;
  isEditing: boolean;
  onContentChange: (content: string) => void;
}

export function BlockRenderer({ block, isEditing, onContentChange }: BlockRendererProps) {
  switch (block.type) {
    case 'section':
      return (
        <TextArea
          value={block.content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={6}
          placeholder="Block content..."
          disabled={!isEditing}
        />
      );

    case 'comments':
      return (
        <Card style={{ backgroundColor: 'var(--yellow-2)', borderLeft: '4px solid var(--yellow-9)' }}>
          <TextArea
            value={block.content}
            onChange={(e) => onContentChange(e.target.value)}
            rows={6}
            placeholder="Comments..."
            disabled={!isEditing}
            style={{ backgroundColor: 'transparent' }}
          />
        </Card>
      );
      
    case 'student-project-comment':
      return (
        <Card style={{ backgroundColor: 'var(--blue-2)', borderLeft: '4px solid var(--blue-9)' }}>
          <TextArea
            value={block.content}
            onChange={(e) => onContentChange(e.target.value)}
            rows={6}
            placeholder="Student's project work comment..."
            disabled={!isEditing}
            style={{ backgroundColor: 'transparent' }}
          />
        </Card>
      );

    case 'table':
      return (
        <>
          <TableBlock block={block} isEditing={isEditing} />
          {block.helpText && <HelpAccordion helpText={block.helpText} />}
        </>
      );

    case 'pie-chart':
      return (
        <>
          <PieChartBlock block={block} />
          {block.helpText && <HelpAccordion helpText={block.helpText} />}
        </>
      );

    case 'line-chart':
      return (
        <>
          <LineChartBlock block={block} />
          {block.helpText && <HelpAccordion helpText={block.helpText} />}
        </>
      );

    case 'bar-chart':
      return (
        <>
          <BarChartBlock block={block} />
          {block.helpText && <HelpAccordion helpText={block.helpText} />}
        </>
      );

    default:
      return <Text color="red">Unknown block type: {block.type}</Text>;
  }
}

function TableBlock({ block, isEditing }: { block: ReportBlock; isEditing: boolean }) {
  if (!block.data || !Array.isArray(block.data)) {
    return <Text color="gray">No table data</Text>;
  }

  const columns = block.config?.columns || Object.keys(block.data[0] || {});

  // Helper function to get badge color for segments or patterns
  const getBadgeColor = (value: string): any => {
    if (!value) return 'gray';
    const valueLower = value.toLowerCase();
    
    // Easing patterns
    if (valueLower.includes('ease-out')) return 'green';
    if (valueLower.includes('ease-in-out')) return 'purple';
    if (valueLower.includes('ease-in')) return 'orange';
    if (valueLower === 'ease') return 'blue';
    if (valueLower.includes('linear')) return 'gray';
    if (valueLower.includes('no-activity')) return 'red';
    
    // Segments
    if (valueLower.includes('leader')) return 'green';
    if (valueLower.includes('low engagement')) return 'red';
    if (valueLower.includes('hardworking')) return 'orange';
    if (valueLower.includes('engaged')) return 'blue';
    
    return 'gray';
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
                
                // Add colored badge for segment column
                if (col === 'segment' && cellValue) {
                  return (
                    <Table.Cell key={col}>
                      <Badge color={getBadgeColor(cellValue)} size="1">
                        {cellValue}
                      </Badge>
                    </Table.Cell>
                  );
                }
                
                // Add colored badge for pattern column (easing types)
                if (col === 'pattern' && cellValue) {
                  return (
                    <Table.Cell key={col}>
                      <Badge color={getBadgeColor(cellValue)} size="1">
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
      {isEditing && (
        <Text size="1" color="gray" mt="2" as="div">
          Note: Table data cannot be edited directly. It's sourced from the original report.
        </Text>
      )}
    </Box>
  );
}

function PieChartBlock({ block }: { block: ReportBlock }) {
  if (!block.data) {
    return <Text color="gray">No chart data</Text>;
  }

  const labels = Object.keys(block.data);
  const values = Object.values(block.data) as number[];

  // Helper function to get color for segments or easing patterns
  const getChartColor = (label: string): string => {
    if (!label) return 'rgba(156, 163, 175, 0.8)'; // gray
    const labelLower = label.toLowerCase();
    
    // Check if this is an easing pattern (activity pattern)
    if (labelLower.includes('ease-out')) {
      return 'rgba(34, 197, 94, 0.8)'; // green-500 - early start
    }
    if (labelLower.includes('ease-in-out')) {
      return 'rgba(168, 85, 247, 0.8)'; // purple-500 - S-curve
    }
    if (labelLower.includes('ease-in')) {
      return 'rgba(249, 115, 22, 0.8)'; // orange-500 - late start
    }
    if (labelLower === 'ease') {
      return 'rgba(59, 130, 246, 0.8)'; // blue-500 - moderate
    }
    if (labelLower.includes('linear')) {
      return 'rgba(156, 163, 175, 0.8)'; // gray-400 - steady
    }
    if (labelLower.includes('no-activity')) {
      return 'rgba(220, 38, 38, 0.8)'; // red-600 - no activity
    }
    
    // Segment colors (for segmentation charts)
    if (labelLower.includes('leader')) {
      return 'rgba(34, 197, 94, 0.8)'; // green-500
    }
    if (labelLower.includes('low engagement')) {
      return 'rgba(239, 68, 68, 0.8)'; // red-500
    }
    if (labelLower.includes('hardworking')) {
      return 'rgba(249, 115, 22, 0.8)'; // orange-500
    }
    if (labelLower.includes('engaged')) {
      return 'rgba(59, 130, 246, 0.8)'; // blue-500
    }
    if (labelLower.includes('balanced')) {
      return 'rgba(156, 163, 175, 0.8)'; // gray-400
    }
    
    return 'rgba(156, 163, 175, 0.8)'; // gray as fallback
  };

  // Generate colors based on labels
  const backgroundColors = labels.map(label => getChartColor(label));

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: backgroundColors,
        borderColor: 'rgba(255, 255, 255, 1)',
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
    <Box style={{ height: '300px', position: 'relative' }}>
      <Pie data={chartData} options={options} />
    </Box>
  );
}

function LineChartBlock({ block }: { block: ReportBlock }) {
  if (!block.data || !Array.isArray(block.data)) {
    return <Text color="gray">No chart data</Text>;
  }

  const xField = block.config?.xField || 'x';
  const yField = block.config?.yField || 'y';

  const chartData = {
    labels: block.data.map((d: any) => d[xField]),
    datasets: [
      {
        label: block.title,
        data: block.data.map((d: any) => d[yField]),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
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
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Box style={{ height: '300px', position: 'relative' }}>
      <Line data={chartData} options={options} />
    </Box>
  );
}

function BarChartBlock({ block }: { block: ReportBlock }) {
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
      <Box style={{ height: '350px', position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </Box>
    );
  }
  
  // Weekly activity chart (legacy)
  if (groupBy === 'week') {
    // Group by ISO week (same logic as BlockViewer)
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
      <Box style={{ height: '350px', position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </Box>
    );
  }

  return <Text color="gray">Bar chart configuration not supported</Text>;
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
