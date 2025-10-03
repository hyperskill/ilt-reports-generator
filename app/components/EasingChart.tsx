'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DynamicSummaryRow, DynamicSeriesRow } from '@/lib/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  series: DynamicSeriesRow[];
  userData: DynamicSummaryRow;
}

export function EasingChart({ series, userData }: Props) {
  const chartData = useMemo(() => {
    // Sort by x_norm
    const sorted = [...series].sort((a, b) => a.x_norm - b.x_norm);

    return {
      labels: sorted.map(row => row.x_norm.toFixed(2)),
      datasets: [
        {
          label: 'Cumulative Activity',
          data: sorted.map(row => ({ x: row.x_norm, y: row.y_norm })),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [series]);

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
        text: 'Normalized Cumulative Activity Curve',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const point = series[context.dataIndex];
            return [
              `Progress: ${(point.x_norm * 100).toFixed(1)}%`,
              `Activity: ${(point.y_norm * 100).toFixed(1)}%`,
              `Date: ${point.date_iso}`,
            ];
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'Normalized Time (0 → 1)',
        },
        min: 0,
        max: 1,
      },
      y: {
        title: {
          display: true,
          text: 'Cumulative Activity (0 → 1)',
        },
        min: 0,
        max: 1,
      },
    },
  };

  return (
    <div style={{ height: '400px', position: 'relative' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

