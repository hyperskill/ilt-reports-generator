'use client';

import { useMemo } from 'react';
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
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DynamicSeriesRow {
  user_id: string;
  date_iso: string;
  day_index: number;
  x_norm: number;
  activity_platform: number;
  activity_meetings: number;
  activity_total: number;
  cum_activity: number;
  y_norm: number;
}

interface Props {
  series: DynamicSeriesRow[];
  studentName?: string;
}

interface WeekData {
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  platformActivity: number;
  meetingsActivity: number;
  totalActivity: number;
}

export function WeeklyActivityChart({ series, studentName }: Props) {
  const weeklyData = useMemo(() => {
    if (!series || series.length === 0) {
      return [];
    }

    // Group by ISO week
    const weekMap = new Map<string, WeekData>();

    series.forEach(row => {
      const date = dayjs(row.date_iso);
      if (!date.isValid()) return;

      // Get ISO week number and year
      const weekKey = `${date.isoWeekYear()}-W${String(date.isoWeek()).padStart(2, '0')}`;
      
      if (!weekMap.has(weekKey)) {
        const weekStart = date.startOf('isoWeek');
        const weekEnd = date.endOf('isoWeek');
        
        weekMap.set(weekKey, {
          weekLabel: `Week ${date.isoWeek()} (${weekStart.format('MMM D')} - ${weekEnd.format('MMM D')})`,
          weekStart: weekStart.format('YYYY-MM-DD'),
          weekEnd: weekEnd.format('YYYY-MM-DD'),
          platformActivity: 0,
          meetingsActivity: 0,
          totalActivity: 0,
        });
      }

      const weekData = weekMap.get(weekKey)!;
      weekData.platformActivity += row.activity_platform || 0;
      weekData.meetingsActivity += row.activity_meetings || 0;
      weekData.totalActivity += row.activity_total || 0;
    });

    // Sort by week start date
    return Array.from(weekMap.values()).sort((a, b) => 
      a.weekStart.localeCompare(b.weekStart)
    );
  }, [series]);

  const chartData = useMemo(() => {
    return {
      labels: weeklyData.map(w => w.weekLabel),
      datasets: [
        {
          label: 'Platform Activity (submissions)',
          data: weeklyData.map(w => w.platformActivity),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Meetings Attended',
          data: weeklyData.map(w => w.meetingsActivity),
          backgroundColor: 'rgba(153, 102, 255, 0.8)',
          borderColor: 'rgb(153, 102, 255)',
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };
  }, [weeklyData]);

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
          ? `${studentName}'s Weekly Activity` 
          : 'Weekly Activity Overview',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          footer: function(tooltipItems: any[]) {
            if (tooltipItems.length === 0) return '';
            const index = tooltipItems[0].dataIndex;
            const week = weeklyData[index];
            return `Total: ${week.totalActivity.toFixed(1)} activity points`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: false,
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
          text: 'Platform Activity (submissions)',
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
        max: Math.max(...weeklyData.map(w => w.meetingsActivity)) + 1 || 5,
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

  if (weeklyData.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        No activity data available
      </div>
    );
  }

  return (
    <div>
      <div style={{ height: '400px', position: 'relative', marginBottom: '20px' }}>
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Legend / How to Read */}
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
          <strong style={{ color: 'rgb(75, 192, 192)' }}>● Platform Activity</strong> (left axis, teal bars)
          <br />
          <span style={{ color: '#666', fontSize: '13px' }}>
            Shows how many exercises and tasks were submitted each week. Higher bars = more active learning.
          </span>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong style={{ color: 'rgb(153, 102, 255)' }}>● Meetings Attended</strong> (right axis, purple bars)
          <br />
          <span style={{ color: '#666', fontSize: '13px' }}>
            Shows how many live sessions were attended each week. Each bar represents the number of meetings.
          </span>
        </div>
        
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #d0d0d0' }}>
          <strong>💡 What to Look For:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#666', fontSize: '13px' }}>
            <li><strong>Consistent weeks</strong> - Regular activity shows steady learning progress</li>
            <li><strong>Quiet periods</strong> - Low bars might indicate vacations, busy work weeks, or breaks</li>
            <li><strong>Busy weeks</strong> - High teal bars show intensive learning periods</li>
            <li><strong>Meeting participation</strong> - Purple bars show engagement with live instruction</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

