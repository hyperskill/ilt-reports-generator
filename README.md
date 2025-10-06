# Performance Segmentation - Report Builder

A comprehensive web application for analyzing student performance and dynamic activity patterns. Built with Next.js, Radix UI, and Chart.js.

## Features

### Two Analysis Modes

1. **Performance Segmentation**
   - Static performance profiles based on grades, attempts, persistence, and meeting attendance
   - Activity-derived metrics (effort, consistency, struggle) computed from submissions
   - Segments learners into categories like "Leader efficient", "Balanced middle", etc.
   - Based on the algorithm in `docs/student-segment.md`

2. **Dynamic/Easing Segmentation**
   - Temporal activity analysis with CSS-like easing patterns
   - Activity derived from submissions (correct=1.0, incorrect=0.25) + meetings
   - Classifies cumulative behavior curves (linear, ease, ease-in, ease-out, ease-in-out)
   - Calculates frontload index, Bezier control points, consistency, and burstiness
   - Based on the algorithm in `docs/easing_activity_algorithm_node.md`

### Application Flow

1. **Upload** - Upload 3-5 CSV files:
   - `grade_book.csv` (Required): user_id, total
   - `learners.csv` (Required): user_id, first_name, last_name
   - `submissions.csv` (Required): user_id, step_id, status, timestamp
   - `meetings.csv` (Optional): user_id, name, [dd.mm.yyyy] columns
   - `structure.csv` (Optional): course_id, module_id, lesson_id, step_id - enables clickable topic links to Cogniterra

2. **Review** - Verify column recognition and preview data

3. **Exclusions** - Optionally exclude specific user IDs

4. **Settings** - Configure:
   - Time bucketing (Daily/Weekly)
   - Smoothing (Off/Light/Strong)
   - Meetings usage toggles
   - Alpha/Beta weights (for activity blending)

5. **Processing** - Automated data processing with progress tracking

6. **Results** - View results in two modes:
   - Performance Segmentation: tables, filters, segment distribution
   - Dynamic/Easing: curves, charts, easing patterns
   - **NEW**: Click any student name to view personalized report

### Personalized Student Reports

**New Feature**: Individual student detail pages with comprehensive, actionable insights.

**Access**: Click on any student's name in the results tables (both Performance and Dynamic tabs).

**What's Included**:
- 📋 **Progress Highlights**: 3-5 key wins and focus areas in plain English
- 🔥 **Overall Engagement**: Program-wide engagement level (High/Medium/Low) with description
- 📊 **Activity Curve**: Visual timeline with frontload index, consistency, burstiness
- ✨ **Going Well Topics**: Areas where student excels
- 🎯 **Focus Areas**: Topics needing attention with specific reasons
- 🚀 **Next Steps**: 2-3 prioritized, actionable suggestions
- 📚 **Topic Analysis Table**: Detailed breakdown with deltas from course average
  - **NEW**: Clickable topic links to Cogniterra (when structure.csv is uploaded)
- 📊 **Full Statistics**: All performance metrics in one view

**Algorithm**: Based on Personal Student Report Algorithm v1 (see `docs/personal_student_report_algorithm.md`)

**Language**: Student-friendly, supportive, actionable - no heavy statistics or rankings

**Learn More**: See `docs/student-report-feature-guide.md` for complete documentation

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: Radix UI Themes + Radix Primitives
- **Charts**: Chart.js + React Chart.js 2
- **Styling**: CSS Modules (no Tailwind)
- **Language**: TypeScript
- **Data Processing**: CSV Parse/Stringify, Day.js

## Project Structure

```
/app
  /upload          - File upload screen
  /review          - Data review screen
  /exclusions      - User exclusion screen
  /settings        - Display settings
  /processing      - Data processing
  /results         - Results display (dual mode)
  /components      - Reusable components
  layout.tsx       - Root layout with theme provider
  page.tsx         - Home (redirects to upload)

/lib
  /context         - React Context for state management
  /processors      - Data processing algorithms
  /utils           - Helper functions
  types.ts         - TypeScript type definitions

/docs              - Algorithm documentation
```

## Data Processing

### Performance Segmentation Algorithm (v3)

Implements the logic from `docs/student-segment.md`:

1. **Data normalization** - Standardizes column names
2. **Core metrics** - Calculates total, submissions, unique_steps, correct_submissions
3. **Derived metrics** - success_rate, persistence, efficiency
4. **Temporal metrics** - active_days, active_days_ratio (from submission timestamps)
5. **Activity-derived signals** - effort_index, consistency_index, struggle_index
   - Effort: z-score normalized (submissions + active_days)
   - Consistency: active_days / span_days
   - Struggle: based on high persistence + low success rate
6. **Meeting processing** - Attendance percentages
7. **Segmentation** - Rule-based classification with activity-driven rules

### Dynamic/Easing Algorithm (v3)

Implements the logic from `docs/easing_activity_algorithm_node.md`:

1. **Daily activity from submissions** - Weighted by status (correct=1.0, incorrect=0.25)
2. **Composite activity** - `α * platform_events + β * meetings` (α=1.0, β=1.5)
3. **Cumulative curve normalization** - Maps to [0,1] × [0,1]
4. **Bezier proxy estimation** - Via quartiles (t25, t50, t75)
5. **Frontload index** - FI = 0.5 - t50
6. **Easing classification** - Matches to CSS easing patterns
7. **Auxiliary metrics** - consistency, burstiness from daily activity

## CSV File Requirements

### grade_book.csv
```csv
user_id,total
123,85
456,72
```

### learners.csv
```csv
user_id,first_name,last_name
123,John,Doe
456,Jane,Smith
```

### submissions.csv (CRITICAL - drives all activity metrics)
```csv
user_id,step_id,status,timestamp
123,step_1,correct,2024-01-15T10:30:00Z
123,step_2,incorrect,2024-01-16T14:20:00Z
```
**Note**: Timestamps can be Unix epoch (seconds or milliseconds) or ISO strings.

### meetings.csv (optional)
```csv
user_id,name,[15.01.2024] Webinar,[22.01.2024] Workshop
123,John Doe,TRUE,FALSE
456,Jane Smith,TRUE,TRUE
```

## Features Implemented

✅ Multi-step file upload with validation  
✅ CSV parsing with flexible column names  
✅ User ID exclusion system  
✅ Display settings configuration  
✅ Performance segmentation with activity signals  
✅ Dynamic/easing segmentation from submissions  
✅ Dual-mode results display  
✅ Interactive filtering and search  
✅ Data visualization with Chart.js  
✅ Responsive tables with scrolling  

## Key Algorithm Changes (v3)

### What Changed
- ❌ **NO activity.csv required** - Everything built from submissions
- ✅ **Activity from submissions**: Uses weighted attempts (correct=1.0, incorrect=0.25)
- ✅ **Two-source blending**: platform_events + meetings (no separate activity file)
- ✅ **New metrics**: consistency, burstiness in Dynamic mode
- ✅ **Enhanced Performance**: effort/consistency/struggle indices from submissions

### Activity Derivation
```
Platform Activity per Day = Σ(correct: 1.0, incorrect: 0.25)
Composite Activity = α * Platform + β * Meetings
  where α=1.0 (platform weight), β=1.5 (meetings weight)
```

## Design Decisions

- **No Tailwind CSS**: Uses CSS Modules as specified in requirements
- **Radix UI**: Provides accessible, unstyled primitives and themed components
- **Client-side processing**: All data processing happens in the browser
- **React Context**: Simple state management without external libraries
- **TypeScript**: Full type safety throughout the application
- **No external activity files**: All metrics derived from existing data

## Key Components

- `AppContext` - Global state management
- `FileUploadTile` - Drag-and-drop CSV upload
- `PerformanceResults` - Performance segmentation display
- `DynamicResults` - Dynamic segmentation display
- `EasingChart` - Line chart for cumulative curves

## Contributing

This project follows the specifications in:
- `docs/unified_app_ui_userflow.md` - UX flow
- `docs/student-segment.md` - Performance algorithm (v3)
- `docs/easing_activity_algorithm_node.md` - Dynamic algorithm (v3)
- `docs/RADIX_UI_DOCUMENTATION.md` - UI components
- `docs/REACT_CHARTJS_DOCUMENTATION.md` - Charts

## License

Private project - All rights reserved

## Development Notes

- The app uses Next.js App Router (not Pages Router)
- All pages are client components (`'use client'`)
- Data processing is synchronous (could be moved to Web Workers)
- Tables show first 100 rows for performance
- CSV files are parsed entirely into memory
- Activity metrics are computed on-the-fly from submissions

## Troubleshooting

### Files not uploading
- Ensure files are valid CSV format
- Check that required columns exist
- File size should be reasonable (< 10MB recommended)
- Comments (lines starting with #) are automatically filtered

### Processing fails
- Verify all required files are uploaded (grade_book, learners, submissions)
- Check CSV format and column names
- Look at browser console for detailed errors
- Ensure submissions.csv has valid timestamps

### Charts not showing
- Ensure submissions.csv has timestamp column
- Check that data was successfully processed
- Try refreshing the page

## Support

For issues or questions, refer to:
- `app-creation-log.md` - Detailed implementation notes
- Documentation files in `/docs`
- Component source code with inline comments
