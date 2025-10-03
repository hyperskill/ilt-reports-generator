'use client';

import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Card, Heading, Text, Box } from '@radix-ui/themes';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface SegmentData {
  label: string;
  count: number;
  color: string;
}

interface SegmentPieChartProps {
  title: string;
  data: SegmentData[];
  total: number;
}

export function SegmentPieChart({ title, data, total }: SegmentPieChartProps) {
  const chartData = {
    labels: data.map(item => `${item.label} (${item.count})`),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <Card>
      <Box p="4">
        <Heading size="4" mb="3">{title}</Heading>
        <Box style={{ height: '300px', position: 'relative' }}>
          <Pie data={chartData} options={options} />
        </Box>
        <Box mt="3">
          <Text size="2" color="gray">
            Total: {total} learners
          </Text>
        </Box>
      </Box>
    </Card>
  );
}
