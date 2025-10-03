// Core data types
export interface CSVFile {
  name: string;
  data: any[];
  size: number;
  uploadedAt: Date;
}

export interface UploadedFiles {
  grade_book?: CSVFile;
  learners?: CSVFile;
  submissions?: CSVFile;
  meetings?: CSVFile;
}

export interface DisplaySettings {
  timeBucketing: 'daily' | 'weekly';
  smoothing: 'off' | 'light' | 'strong';
  includeMeetingsInActivity: boolean;
  useMeetingsInSegmentation: boolean;
}

export interface ProcessingResult {
  performanceData: PerformanceRow[];
  dynamicData: DynamicSummaryRow[];
  dynamicSeries: DynamicSeriesRow[];
}

// Performance Segmentation
export interface PerformanceRow {
  user_id: string;
  name: string;
  total: number;
  total_pct: number;
  submissions: number;
  unique_steps: number;
  success_rate: number;
  persistence: number;
  efficiency: number;
  simple_segment: string;
  meetings_attended: number;
  meetings_attended_pct: number;
}

// Dynamic/Easing Segmentation
export interface DynamicSummaryRow {
  user_id: string;
  name: string;
  bezier_p1x: number;
  bezier_p1y: number;
  bezier_p2x: number;
  bezier_p2y: number;
  t25: number;
  t50: number;
  t75: number;
  frontload_index: number;
  easing_label: string;
  total: number;
  total_pct: number;
}

export interface DynamicSeriesRow {
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

// App State
export interface AppState {
  files: UploadedFiles;
  excludedUserIds: string[];
  settings: DisplaySettings;
  results?: ProcessingResult;
  currentMode: 'performance' | 'dynamic';
}

