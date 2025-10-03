# Performance Segmentation - Report Builder

A comprehensive web application for analyzing student performance and dynamic activity patterns. Built with Next.js, Radix UI, and Chart.js.

## Features

### Two Analysis Modes

1. **Performance Segmentation**
   - Static performance profiles based on grades, attempts, persistence, and meeting attendance
   - Segments learners into categories like "Leader efficient", "Balanced middle", etc.
   - Based on the algorithm in `docs/student-segment.md`

2. **Dynamic/Easing Segmentation**
   - Temporal activity analysis with CSS-like easing patterns
   - Classifies cumulative behavior curves (linear, ease, ease-in, ease-out, ease-in-out)
   - Calculates frontload index and Bezier control points
   - Based on the algorithm in `docs/easing_activity_algorithm_node.md`

### Application Flow

1. **Upload** - Upload 5 CSV files:
   - `grade_book.csv` (Required): user_id, total
   - `learners.csv` (Required): user_id, first_name, last_name
   - `submissions.csv` (Required): user_id, step_id, status, timestamp
   - `activity.csv` (Required): user_id, timestamp, active_minutes, sessions (optional)
   - `meetings.csv` (Optional): user_id, name, [dd.mm.yyyy] columns

2. **Review** - Verify column recognition and preview data

3. **Exclusions** - Optionally exclude specific user IDs

4. **Settings** - Configure:
   - Time bucketing (Daily/Weekly)
   - Smoothing (Off/Light/Strong)
   - Meetings usage toggles

5. **Processing** - Automated data processing with progress tracking

6. **Results** - View results in two modes:
   - Performance Segmentation: tables, filters, segment distribution
   - Dynamic/Easing: curves, charts, easing patterns

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

### Performance Segmentation Algorithm

Implements the logic from `docs/student-segment.md`:

1. **Data normalization** - Standardizes column names
2. **Core metrics** - Calculates total, submissions, unique_steps
3. **Derived metrics** - success_rate, persistence, efficiency
4. **Activity signals** - effort_index, consistency_index, struggle_index (from activity.csv)
5. **Meeting processing** - Attendance percentages
6. **Segmentation** - Rule-based classification with activity-driven rules

### Dynamic/Easing Algorithm

Implements the logic from `docs/easing_activity_algorithm_node.md`:

1. **Daily activity aggregation** - Combines platform + meetings + activity (with α, β, γ scaling)
2. **Cumulative curve normalization** - Maps to [0,1] × [0,1]
3. **Bezier proxy estimation** - Via quartiles (t25, t50, t75)
4. **Frontload index** - FI = 0.5 - t50
5. **Easing classification** - Matches to CSS easing patterns

**Weighting factors**:
- `α = 1.0` (platform events)
- `β = 1.5` (meetings)
- `γ = 0.02` (activity minutes, ≈1 point per 50 minutes)

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

### submissions.csv
```csv
user_id,step_id,status,timestamp
123,step_1,correct,2024-01-15T10:30:00Z
123,step_2,incorrect,2024-01-16T14:20:00Z
```

### activity.csv (required)
```csv
user_id,timestamp,active_minutes,sessions
123,2024-01-15T10:00:00Z,45,2
123,2024-01-16T09:30:00Z,60,3
456,2024-01-15T14:00:00Z,30,1
```
**Note**: `active_minutes` (preferred) or `sessions` can be used to measure activity intensity. The algorithm scales these into daily activity points.

**If you don't have activity data**: Use the provided script to generate it from submissions:
```bash
node scripts/generate-activity-csv.js path/to/submissions.csv path/to/output-activity.csv
```
See [scripts/README.md](scripts/README.md) for details.

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
✅ Performance segmentation algorithm  
✅ Dynamic/easing segmentation algorithm  
✅ Dual-mode results display  
✅ Interactive filtering and search  
✅ Data visualization with Chart.js  
✅ Responsive tables with scrolling  

## Future Enhancements

🔲 Explorer view for learner comparison  
🔲 Export functionality (CSV/PNG)  
🔲 Student detail drawer/modal  
🔲 Advanced filtering controls  
🔲 Meeting timeline visualization  
🔲 Small multiples for comparison  
🔲 Undo/redo functionality  
🔲 Session persistence (localStorage)  

## Design Decisions

- **No Tailwind CSS**: Uses CSS Modules as specified in requirements
- **Radix UI**: Provides accessible, unstyled primitives and themed components
- **Client-side processing**: All data processing happens in the browser
- **React Context**: Simple state management without external libraries
- **TypeScript**: Full type safety throughout the application

## Key Components

- `AppContext` - Global state management
- `FileUploadTile` - Drag-and-drop CSV upload
- `PerformanceResults` - Performance segmentation display
- `DynamicResults` - Dynamic segmentation display
- `EasingChart` - Line chart for cumulative curves

## Contributing

This project follows the specifications in:
- `docs/unified_app_ui_userflow.md` - UX flow
- `docs/student-segment.md` - Performance algorithm
- `docs/easing_activity_algorithm_node.md` - Dynamic algorithm
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

## Troubleshooting

### Files not uploading
- Ensure files are valid CSV format
- Check that required columns exist
- File size should be reasonable (< 10MB recommended)

### Processing fails
- Verify all required files are uploaded
- Check CSV format and column names
- Look at browser console for detailed errors

### Charts not showing
- Ensure submissions.csv has timestamp column for dynamic mode
- Check that data was successfully processed
- Try refreshing the page

## Support

For issues or questions, refer to:
- `app-creation-log.md` - Detailed implementation notes
- Documentation files in `/docs`
- Component source code with inline comments

