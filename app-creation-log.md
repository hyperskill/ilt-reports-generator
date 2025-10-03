# App Creation Log

## 2025-10-03: Algorithm v3 - No External Activity File Required

### Major Rewrite: Removed activity.csv Requirement
- **REMOVED activity.csv** - No longer required or supported
- All activity metrics now derived from `submissions.csv` only
- Upload flow simplified back to 3 required files (grade_book, learners, submissions) + optional meetings
- Algorithm v3 spec: builds everything from existing data sources

### Type System Updates
- Removed `activity?: CSVFile` from `UploadedFiles`
- Removed `gamma` from `DisplaySettings` (only alpha, beta remain)
- Updated `PerformanceRow`:
  - Removed: `active_minutes_total`, `sessions_count`
  - Added: `active_days`, `correct_submissions` (explicit field)
  - Kept: `active_days_ratio`, `effort_index`, `consistency_index`, `struggle_index`
- Updated `DynamicSummaryRow`:
  - Added: `consistency`, `burstiness`
  - Kept: all Bezier parameters, frontload_index, easing_label
- Updated `DynamicSeriesRow`:
  - Removed: `activity_minutes` (third source)
  - Kept: `activity_platform`, `activity_meetings` (two sources only)

### Processing Logic - Complete Rewrite

#### Dynamic Processor (v3)
**Activity Derivation from Submissions**:
```
Platform Activity = Σ(correct: 1.0, incorrect: 0.25) per day
Composite Activity = α * Platform + β * Meetings
```
- Weights submissions by status: correct=1.0, incorrect=0.25
- Two-source blending only: platform + meetings (no third source)
- Default weights: α=1.0, β=1.5
- **New metrics**:
  - `consistency`: #days with activity / span_days
  - `burstiness`: std(activity) / mean(activity)

#### Performance Processor (v3)
**Activity Signals from Submissions**:
- `active_days`: n_distinct(date from timestamps)
- `active_days_ratio`: active_days / span_days
- `effort_index`: z-score(submissions) ⊕ z-score(active_days)
- `consistency_index`: same as active_days_ratio
- `struggle_index`: computed from persistence + success_rate signals

**Updated Segmentation Rules** (v3 spec):
1. Leader engaged: total_pct ≥ 80 AND meetings ≥ 70%
2. Leader efficient: total_pct ≥ 80 AND persistence ≤ 3 AND consistency ≥ 0.5
3. Balanced + engaged: 30-80% AND meetings ≥ 60% AND consistency ≥ 0.4
4. Hardworking but struggling: effort ≥ 0.5 AND struggle ≥ 0.6
5. Low engagement: (total < 30 AND submissions < 20) OR (effort ≤ -0.5 AND consistency < 0.3)
6. Balanced middle: else

### UI Updates
- Upload page: removed Activity tile (back to 4 tiles: 3 required + 1 optional)
- Processing page: updated logs ("Building activity curves from submissions...")
- Removed validation for activity.csv
- Updated context: removed gamma from initialSettings

### Algorithm Alignment
- Full v3 implementation per updated specs
- `docs/easing_activity_algorithm_node.md` (v3): No external files, submissions-only
- `docs/student-segment.md` (v3): Activity signals from submissions
- Zero external dependencies beyond core 3 files

### Documentation Updates
- README.md: Complete rewrite explaining v3 changes
- Emphasized: "NO activity.csv required"
- Added activity derivation formulas
- Updated CSV requirements section

## 2025-10-03: Activity.csv Integration Update (DEPRECATED - See v3 above)

### Major Update: Added activity.csv as Required Input
- **New required file**: `activity.csv` with fields: `user_id`, `timestamp`, `active_minutes`, `sessions` (optional)
- Updated upload flow to include 5 files (was 4)
- Activity data now drives both performance and dynamic segmentation algorithms

### Type System Updates
- Added `activity?: CSVFile` to `UploadedFiles` interface
- Extended `PerformanceRow` with activity-derived metrics:
  - `active_minutes_total`: Sum of all active minutes
  - `sessions_count`: Total sessions count
  - `active_days_ratio`: Consistency metric (active days / total days)
  - `effort_index`: Z-score normalized effort (combines minutes + sessions)
  - `consistency_index`: Same as active_days_ratio
  - `struggle_index`: Derived from low success rate + high persistence
- Extended `DynamicSeriesRow` with `activity_minutes` field (separate from platform/meetings)
- Added scaling parameters to `DisplaySettings`: `alpha`, `beta`, `gamma`

### Processing Logic Enhancements

#### Dynamic Processor (`lib/processors/dynamic-processor.ts`)
- Integrated activity.csv data into daily activity aggregation
- Implemented three-source blending: `α * platform + β * meetings + γ * activity`
- Default weights: α=1.0, β=1.5, γ=0.02 (≈1 point per 50 minutes)
- Activity minutes scaled with gamma factor: `gamma * minutes + 0.2 * gamma * sessions`
- Series now exports separate components: `activity_platform`, `activity_meetings`, `activity_minutes`

#### Performance Processor (`lib/processors/performance-processor.ts`)
- Added comprehensive activity data processing
- Implemented z-score normalization for effort indices
- Calculate per-user stats: total minutes, sessions, active days, date spans
- Compute activity-derived indices:
  - **Effort index**: Normalized combination of minutes + sessions
  - **Consistency index**: Active days ratio
  - **Struggle index**: Heuristic based on success rate and persistence
- Updated segmentation rules to include activity signals:
  - High effort + struggle → "Hardworking but struggling"
  - Low effort + low consistency → "Low engagement"
  - Consistent leaders → "Leader efficient" (requires active_days_ratio >= 0.5)

### CSV Parser Updates
- Added validation for `activity.csv` file
- Required columns: `user_id` (aliases: userid, uid, user) and `timestamp` (aliases: time, date)
- Optional but recommended: `active_minutes`, `sessions`

### UI Updates
- Upload page now shows 5 tiles (added Activity tile)
- File description: "Student activity data (user_id, timestamp, active_minutes)"
- Processing page validates activity.csv presence
- Settings context includes alpha, beta, gamma with defaults

### Algorithm Alignment
- Now fully implements v2 specifications from updated docs:
  - `docs/easing_activity_algorithm_node.md` (v2 with activity.csv)
  - `docs/student-segment.md` (v2 with activity-derived signals)
- Maintains backward compatibility with meetings.csv (optional)
- All three data sources (platform, meetings, activity) properly weighted and combined

### Documentation Updates
- Updated README.md with activity.csv requirements and examples
- Added weighting factors documentation (α, β, γ)
- Updated CSV file requirements section with activity.csv format
- Documented new performance metrics in algorithm description

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
1. **Upload** (`/upload`) - File upload for 5 CSV files
   - grade_book.csv (Required)
   - learners.csv (Required)
   - submissions.csv (Required)
   - activity.csv (Required)
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

