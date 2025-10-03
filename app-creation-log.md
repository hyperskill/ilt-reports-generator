# App Creation Log

## 2025-10-03: Initial Project Setup

### Project Structure Created
- Set up Next.js 14 project with TypeScript
- Configured Radix UI Themes for component library
- Integrated React Chart.js for data visualizations
- Set up CSS Modules (no Tailwind as per requirements)

### Dependencies Installed
- `@radix-ui/themes` - Pre-styled component library
- `radix-ui` - Unstyled primitives
- `chart.js` and `react-chartjs-2` - Charting library
- `csv-parse` and `csv-stringify` - CSV file handling
- `dayjs` - Date manipulation
- Next.js 14, React 18, TypeScript

### Application Structure

#### Core Flow (7 screens)
1. **Upload** (`/upload`) - File upload for 4 CSV files
   - grade_book.csv (Required)
   - learners.csv (Required)
   - submissions.csv (Required)
   - meetings.csv (Optional)

2. **Review** (`/review`) - Column validation and data preview
   - Shows recognized columns
   - Previews first 10 rows of each file
   - Validates required fields

3. **Exclusions** (`/exclusions`) - User ID filtering
   - Chip-based UI for excluded user IDs
   - Supports comma/space/newline separated input

4. **Settings** (`/settings`) - Display configuration
   - Time bucketing: Daily/Weekly
   - Smoothing: Off/Light/Strong
   - Meetings usage toggles

5. **Processing** (`/processing`) - Data processing
   - Shows progress steps
   - Displays processing log
   - Runs both algorithms

6. **Results** (`/results`) - Dual-mode results display
   - Performance Segmentation tab
   - Dynamic/Easing Segmentation tab

7. **Performance Results** - Static segmentation
   - Summary cards (total learners, avg metrics)
   - Segment distribution with filtering
   - Sortable/filterable table

8. **Dynamic Results** - Temporal segmentation
   - Easing label distribution
   - Frontload index statistics
   - Interactive curve visualization
   - Detailed user charts

### Data Processing Algorithms

#### Performance Segmentation (`lib/processors/performance-processor.ts`)
Implements algorithm from `student-segment.md`:
- Calculates core metrics: total_pct, submissions, unique_steps
- Computes derived metrics: success_rate, persistence, efficiency
- Processes meeting attendance data
- Classifies into segments:
  - Leader engaged
  - Leader efficient
  - Balanced + engaged
  - Low engagement but socially active
  - Hardworking but struggling
  - Low engagement
  - Balanced middle

#### Dynamic/Easing Segmentation (`lib/processors/dynamic-processor.ts`)
Implements algorithm from `easing_activity_algorithm_node.md`:
- Aggregates daily activity from platform and meetings
- Builds normalized cumulative curves (0→1, 0→1)
- Estimates cubic Bezier proxy via quartiles (t25, t50, t75)
- Calculates frontload index: FI = 0.5 - t50
- Classifies into CSS-like easings:
  - linear
  - ease
  - ease-in
  - ease-out
  - ease-in-out

### Key Components

#### Context/State Management
- `AppContext` - Global app state with React Context
- Stores: files, excludedUserIds, settings, results, currentMode
- Provides reset and update functions

#### Reusable Components
- `AppLayout` - Main layout wrapper with header
- `FileUploadTile` - Drag-and-drop CSV upload tile
- `PerformanceResults` - Performance segmentation display
- `DynamicResults` - Dynamic segmentation display
- `EasingChart` - Line chart for cumulative curves

#### Utilities
- `csv-parser.ts` - CSV parsing and validation helpers
- `performance-processor.ts` - Performance algorithm
- `dynamic-processor.ts` - Dynamic/easing algorithm

### Design System
- Using Radix UI Themes with blue accent color
- CSS Modules for component-specific styling
- Responsive layouts with Radix Flex and Grid
- Consistent spacing and typography scales

### Features Implemented
✅ Multi-step file upload with validation
✅ CSV parsing with column name normalization
✅ User ID exclusion system
✅ Display settings configuration
✅ Performance segmentation algorithm
✅ Dynamic/easing segmentation algorithm
✅ Dual-mode results display with tabs
✅ Interactive filtering and search
✅ Data visualization with Chart.js
✅ Responsive table views with scrolling

### Next Steps (Not Yet Implemented)
- Explorer view for comparison
- Export functionality (CSV/PNG)
- Student detail drawer/modal
- Advanced filtering controls
- Meeting timeline visualization
- Small multiples for comparison
- Undo/redo functionality
- Session persistence (localStorage)

### Technical Notes
- Using Next.js App Router (not Pages Router)
- Client-side data processing (no API routes yet)
- All state managed via React Context
- TypeScript for type safety
- CSS Modules for styling (no Tailwind)
- Radix UI for accessible components
- Chart.js for data visualization

### Performance Considerations
- Table limited to 100 rows for initial display
- Memoized calculations for stats and filtering
- Efficient CSV parsing with streaming
- Normalized data structures for fast lookups

### Accessibility
- Radix UI components are WCAG compliant
- Semantic HTML structure
- Keyboard navigation support
- ARIA labels where needed
- Color-blind friendly segment colors

