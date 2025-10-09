'use client';

import { useMemo, useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, Flex, Spinner, Text } from '@radix-ui/themes';
import { processModuleAnalytics } from '@/lib/processors/module-analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ModuleActivityChartProps {
  userId: string;
  submissions: any[];
  structure: any[];
  courseId: number;
  meetings?: any[];
  studentName?: string;
}

export function ModuleActivityChart({ 
  userId, 
  submissions, 
  structure, 
  courseId, 
  meetings,
  studentName 
}: ModuleActivityChartProps) {
  const [moduleStats, setModuleStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModuleData();
  }, [userId, submissions, structure, courseId, meetings]);

  const loadModuleData = async () => {
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
        setModuleStats([]);
        return;
      }

      // Fetch module names from Cogniterra API
      const response = await fetch(`/api/cogniterra/modules?moduleIds=${moduleIds.join(',')}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch module names');
      }

      const data = await response.json();
      const moduleNamesMap = data.modules;
      
      // Process module analytics
      const stats = processModuleAnalytics(userId, submissions, structure, moduleNamesMap, meetings);
      setModuleStats(stats);
    } catch (err: any) {
      console.error('Error loading module data:', err);
      setModuleStats([]);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (moduleStats.length === 0) {
      return null;
    }

    return {
      labels: moduleStats.map(m => m.module_name),
      datasets: [
        {
          label: 'Completed Steps',
          data: moduleStats.map(m => m.completed_steps),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Meetings Attended',
          data: moduleStats.map(m => m.meetings_attended),
          backgroundColor: 'rgba(153, 102, 255, 0.8)',
          borderColor: 'rgb(153, 102, 255)',
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };
  }, [moduleStats]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: studentName 
          ? `${studentName}'s Activity by Module` 
          : 'Activity by Module',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: false,
        title: {
          display: true,
          text: 'Module',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Completed Steps',
          color: 'rgb(75, 192, 192)',
        },
        ticks: {
          callback: function(value: any) {
            return value.toFixed(0);
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        max: Math.max(...(moduleStats.map(m => m.meetings_attended) || [0])) + 1 || 5,
        title: {
          display: true,
          text: 'Meetings Attended',
          color: 'rgb(153, 102, 255)',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          stepSize: 1,
          callback: function(value: any) {
            return value.toFixed(0);
          }
        }
      },
    },
  };

  if (loading) {
    return (
      <Card>
        <Flex align="center" gap="3" p="4">
          <Spinner />
          <Text>Loading module activity chart...</Text>
        </Flex>
      </Card>
    );
  }

  if (!chartData || moduleStats.length === 0) {
    return (
      <Card>
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No module activity data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ height: '400px', position: 'relative', marginBottom: '20px' }}>
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Legend */}
      <div style={{
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        fontSize: '14px',
        lineHeight: '1.6',
      }}>
        <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '15px' }}>
          📖 How to Read This Chart
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong style={{ color: 'rgb(75, 192, 192)' }}>● Completed Steps</strong> (left axis, teal bars)
          <br />
          <span style={{ color: '#666', fontSize: '13px' }}>
            Number of successfully completed exercises in each module.
          </span>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong style={{ color: 'rgb(153, 102, 255)' }}>● Meetings Attended</strong> (right axis, purple bars)
          <br />
          <span style={{ color: '#666', fontSize: '13px' }}>
            Number of live sessions attended during each module's activity period.
          </span>
        </div>
        
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #d0d0d0' }}>
          <strong>💡 What to Look For:</strong>
          <span style={{ color: '#666', fontSize: '13px', marginLeft: '8px' }}>
            Compare your progress across modules and see how meeting attendance correlates with learning activity.
          </span>
        </div>
      </div>
    </Card>
  );
}

