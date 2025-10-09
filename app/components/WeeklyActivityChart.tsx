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

interface ActivityData {
  label: string;
  platformActivity: number;
  meetingsActivity: number;
}

export function WeeklyActivityChart({ series, studentName }: Props) {
  const activityData = useMemo(() => {
    if (!series || series.length === 0) {
      return [];
    }

    // Beta coefficient used in dynamic processor (meetings weight)
    const BETA = 1.5;
    
    // Calculate totals
    let totalPlatform = 0;
    let totalMeetings = 0;
    let daysWithActivity = 0;
    
    series.forEach(row => {
      const platform = row.activity_platform || 0;
      const meetings = row.activity_meetings || 0;
      
      if (platform > 0 || meetings > 0) {
        totalPlatform += platform;
        totalMeetings += meetings / BETA;
        daysWithActivity++;
      }
    });
    
    // If no activity, return empty
    if (daysWithActivity === 0) {
      return [];
    }
    
    // Return simple summary
    return [{
      label: 'Course Period',
      platformActivity: Math.round(totalPlatform),
      meetingsActivity: Math.round(totalMeetings),
    }];
  }, [series]);

  const chartData = useMemo(() => {
    return {
      labels: activityData.map(d => d.label),
      datasets: [
        {
          label: 'Platform Activity (submissions)',
          data: activityData.map(d => d.platformActivity),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Meetings Attended',
          data: activityData.map(d => d.meetingsActivity),
          backgroundColor: 'rgba(153, 102, 255, 0.8)',
          borderColor: 'rgb(153, 102, 255)',
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };
  }, [activityData]);

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
          ? `${studentName}'s Course Activity Summary` 
          : 'Course Activity Summary',
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
          display: false,
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
        max: Math.max(...activityData.map(d => d.meetingsActivity)) + 1 || 5,
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

  if (activityData.length === 0) {
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
          <strong style={{ color: 'rgb(75, 192, 192)' }}>● Platform Activity</strong> (left axis, teal bar)
          <br />
          <span style={{ color: '#666', fontSize: '13px' }}>
            Total number of exercises and tasks submitted during the entire course period.
          </span>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong style={{ color: 'rgb(153, 102, 255)' }}>● Meetings Attended</strong> (right axis, purple bar)
          <br />
          <span style={{ color: '#666', fontSize: '13px' }}>
            Total number of live sessions attended during the course.
          </span>
        </div>
        
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #d0d0d0' }}>
          <strong>💡 Summary:</strong>
          <span style={{ color: '#666', fontSize: '13px', marginLeft: '8px' }}>
            This chart shows your overall engagement with the course - both through platform exercises and live meetings.
          </span>
        </div>
      </div>
    </div>
  );
}

