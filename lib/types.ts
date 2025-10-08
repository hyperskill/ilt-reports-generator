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
  structure?: CSVFile;
}

export interface DisplaySettings {
  timeBucketing: 'daily' | 'weekly';
  smoothing: 'off' | 'light' | 'strong';
  includeMeetingsInActivity: boolean;
  useMeetingsInSegmentation: boolean;
  alpha: number;
  beta: number;
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
  correct_submissions: number;
  success_rate: number;
  persistence: number;
  efficiency: number;
  active_days: number;
  active_days_ratio: number;
  effort_index: number;
  consistency_index: number;
  struggle_index: number;
  meetings_attended: number;
  meetings_attended_pct: number;
  simple_segment: string;
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
  consistency: number;
  burstiness: number;
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

// Personal Student Report
export interface StudentTopic {
  topic_title: string;
  steps_attempted: number;
  attempts_per_step: number;
  student_first_pass_rate: number;
  mean_delta_attempts: number;
  mean_delta_first: number;
  topic_score: number;
  label_topic: 'Comfortable' | 'Watch' | 'Attention';
  lesson_id?: number;
  first_step_id?: number;
  unit_id?: number;
  course_id?: number;
}

export interface StudentEngagement {
  level: 'High' | 'Medium' | 'Low';
  description: string;
  active_days_ratio: number;
}

export interface StudentHighlight {
  type: 'win' | 'focus';
  text: string;
  reason?: string;
}

export interface StudentReport {
  student: {
    user_id: string;
    name: string;
    segment: string;
    easing: string;
  };
  highlights: StudentHighlight[];
  engagement: StudentEngagement;
  topics: {
    wins: Array<{ title: string; why: string }>;
    focus: Array<{ title: string; why: string; evidence?: string }>;
  };
  curve: {
    label: string;
    fi: number;
    explain: string;
    consistency: number;
    burstiness: number;
    t25: number;
    t50: number;
    t75: number;
  };
  next_steps: string[];
  performance: PerformanceRow;
  dynamic: DynamicSummaryRow;
  series: DynamicSeriesRow[];
  topicTable: StudentTopic[];
}

// App State
export interface StudentComment {
  userId: string;
  comment_program_expert?: string;
  comment_teaching_assistants?: string;
  comment_learning_support?: string;
}

export interface AppState {
  files: UploadedFiles;
  excludedUserIds: string[];
  settings: DisplaySettings;
  results?: ProcessingResult;
  currentMode: 'performance' | 'dynamic';
  currentReportId?: string | null;
  studentComments?: Record<string, StudentComment>;
}

// Shared Reports Feature
export type BlockType = 'section' | 'table' | 'pie-chart' | 'line-chart' | 'comments';

export interface ReportBlock {
  id: string;
  type: BlockType;
  title: string;
  content: string; // For 'section' and 'comments' types
  data?: any; // For 'table' and 'chart' types
  config?: {
    columns?: string[]; // For tables
    chartType?: 'pie' | 'line'; // For charts
    showLegend?: boolean;
    [key: string]: any;
  };
  helpText?: string; // Optional help text explaining how to read the data
  order: number;
}

export interface SharedReport {
  id: string;
  report_type: 'manager' | 'student';
  source_report_id: string;
  user_id?: string;
  title: string;
  description?: string;
  blocks: ReportBlock[];
  is_public: boolean;
  access_code?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ReportAccess {
  id: string;
  shared_report_id: string;
  user_id: string;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
}

export interface SharedReportWithAccess extends SharedReport {
  access_list: Array<{
    user_id: string;
    email: string;
    granted_at: string;
    expires_at?: string;
  }>;
  access_count: number;
}
