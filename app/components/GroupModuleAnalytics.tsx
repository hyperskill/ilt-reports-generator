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
import { Card, Flex, Spinner, Text, Heading, Table, Badge, Box } from '@radix-ui/themes';
import { processModuleAnalytics } from '@/lib/processors/module-analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface GroupModuleAnalyticsProps {
  students: any[];
  submissions: any[];
  structure: any[];
  courseId: number;
  meetings?: any[];
}

export function GroupModuleAnalytics({ 
  students, 
  submissions, 
  structure, 
  courseId, 
  meetings 
}: GroupModuleAnalyticsProps) {
  const [moduleStats, setModuleStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroupModuleData();
  }, [students, submissions, structure, courseId, meetings]);

  const loadGroupModuleData = async () => {
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
      
      // Process module analytics for each student
      const allStudentStats: any[][] = [];
      
      for (const student of students) {
        const userId = student.user_id || student.userid;
        if (!userId) continue;
        
        const stats = processModuleAnalytics(
          String(userId), 
          submissions, 
          structure, 
          moduleNamesMap, 
          meetings
        );
        allStudentStats.push(stats);
      }
      
      // Calculate averages for each module
      const moduleAverages = new Map<number, {
        module_id: number;
        module_name: string;
        module_position: number;
        avg_completion_rate: number;
        avg_success_rate: number;
        avg_attempts_per_step: number;
        total_students: number;
        avg_completed_steps: number;
        avg_meetings_attended: number;
      }>();
      
      for (const studentStats of allStudentStats) {
        for (const stat of studentStats) {
          if (!moduleAverages.has(stat.module_id)) {
            moduleAverages.set(stat.module_id, {
              module_id: stat.module_id,
              module_name: stat.module_name,
              module_position: stat.module_position,
              avg_completion_rate: 0,
              avg_success_rate: 0,
              avg_attempts_per_step: 0,
              total_students: 0,
              avg_completed_steps: 0,
              avg_meetings_attended: 0,
            });
          }
          
          const avg = moduleAverages.get(stat.module_id)!;
          avg.avg_completion_rate += stat.completion_rate;
          avg.avg_success_rate += stat.success_rate;
          avg.avg_attempts_per_step += stat.avg_attempts_per_step;
          avg.avg_completed_steps += stat.completed_steps;
          avg.avg_meetings_attended += stat.meetings_attended;
          avg.total_students += 1;
        }
      }
      
      // Calculate final averages
      const finalStats = Array.from(moduleAverages.values()).map(avg => ({
        ...avg,
        avg_completion_rate: avg.avg_completion_rate / avg.total_students,
        avg_success_rate: avg.avg_success_rate / avg.total_students,
        avg_attempts_per_step: avg.avg_attempts_per_step / avg.total_students,
        avg_completed_steps: avg.avg_completed_steps / avg.total_students,
        avg_meetings_attended: avg.avg_meetings_attended / avg.total_students,
      })).sort((a, b) => a.module_position - b.module_position);
      
      setModuleStats(finalStats);
    } catch (err: any) {
      console.error('Error loading group module data:', err);
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
          label: 'Avg Completed Steps',
          data: moduleStats.map(m => m.avg_completed_steps),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Avg Meetings Attended',
          data: moduleStats.map(m => m.avg_meetings_attended),
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
        text: 'Group Average Activity by Module',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y.toFixed(1);
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
          text: 'Avg Completed Steps',
          color: 'rgb(75, 192, 192)',
        },
        ticks: {
          callback: function(value: any) {
            return value.toFixed(1);
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        max: Math.max(...(moduleStats.map(m => m.avg_meetings_attended) || [0])) + 1 || 5,
        title: {
          display: true,
          text: 'Avg Meetings Attended',
          color: 'rgb(153, 102, 255)',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          stepSize: 0.5,
          callback: function(value: any) {
            return value.toFixed(1);
          }
        }
      },
    },
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'green';
    if (rate >= 50) return 'orange';
    return 'red';
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 70) return 'green';
    if (rate >= 50) return 'orange';
    return 'red';
  };

  if (loading) {
    return (
      <Card>
        <Flex align="center" gap="3" p="4">
          <Spinner />
          <Text>Loading group module analytics...</Text>
        </Flex>
      </Card>
    );
  }

  if (!chartData || moduleStats.length === 0) {
    return (
      <Card>
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No module data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Heading size="5" mb="3">📚 Group Performance by Module</Heading>
      <Text size="2" color="gray" mb="4">
        Average performance and engagement across all students in each module.
      </Text>

      {/* Chart */}
      <Box mb="4">
        <div style={{ height: '400px', position: 'relative' }}>
          <Bar data={chartData} options={options} />
        </div>
      </Box>

      {/* Table */}
      <Box style={{ overflowX: 'auto' }}>
        <Table.Root size="2" variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Module</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Avg Progress</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Avg Success Rate</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Avg Attempts/Step</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Avg Meetings</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Students</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {moduleStats.map((module) => (
              <Table.Row key={module.module_id}>
                <Table.Cell>
                  <Text size="2" weight="bold">{module.module_name}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={getCompletionColor(module.avg_completion_rate)} size="2">
                    {module.avg_completion_rate.toFixed(1)}%
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={getSuccessColor(module.avg_success_rate)} size="2">
                    {module.avg_success_rate.toFixed(1)}%
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2">{module.avg_attempts_per_step.toFixed(1)}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={module.avg_meetings_attended > 0 ? 'purple' : 'gray'} size="2">
                    {module.avg_meetings_attended.toFixed(1)}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" color="gray">{module.total_students}</Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Summary */}
      <Box mt="4" p="3" style={{ backgroundColor: 'var(--gray-a2)', borderRadius: 'var(--radius-2)' }}>
        <Flex gap="4" wrap="wrap">
          <Box>
            <Text size="1" color="gray" as="div">Total Modules</Text>
            <Text size="3" weight="bold">{moduleStats.length}</Text>
          </Box>
          <Box>
            <Text size="1" color="gray" as="div">Avg Completion</Text>
            <Text size="3" weight="bold">
              {(moduleStats.reduce((sum, m) => sum + m.avg_completion_rate, 0) / moduleStats.length).toFixed(1)}%
            </Text>
          </Box>
          <Box>
            <Text size="1" color="gray" as="div">Avg Success Rate</Text>
            <Text size="3" weight="bold">
              {(moduleStats.reduce((sum, m) => sum + m.avg_success_rate, 0) / moduleStats.length).toFixed(1)}%
            </Text>
          </Box>
          <Box>
            <Text size="1" color="gray" as="div">Total Students</Text>
            <Text size="3" weight="bold">
              {students.length}
            </Text>
          </Box>
        </Flex>
      </Box>
    </Card>
  );
}

