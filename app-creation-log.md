# App Creation Log

## 2025-10-08: Reports Sharing Feature

### Major Feature: Shareable Reports with Block Constructor
**Purpose**: Enable admins to create shareable versions of LLM-generated reports with customizable block order and granular access control.

### Overview
This feature allows admins to:
1. Convert any Manager or Student report into a shareable version
2. Use a visual constructor to reorder and edit content blocks
3. Grant access to specific users or make reports public
4. Manage who can view each shared report

### Database Schema (`supabase/add-shared-reports.sql`)

**`shared_reports` table**:
- Stores shareable report versions with editable blocks
- Fields:
  - `report_type`: 'manager' or 'student'
  - `source_report_id`: Reference to original report
  - `user_id`: For student reports, identifies which student
  - `title`, `description`: Metadata
  - `blocks`: JSONB array of content blocks with order
  - `is_public`: Public/private toggle
  - `access_code`: Optional link-based sharing code
  - Audit fields: `created_by`, `created_at`, `updated_at`

**`report_access` table**:
- Many-to-many relationship for access control
- Fields:
  - `shared_report_id`, `user_id`: Access relationship
  - `granted_by`, `granted_at`: Audit trail
  - `expires_at`: Optional expiration

**Key Features**:
- RLS policies for secure access control
- Helper functions: `grant_report_access()`, `revoke_report_access()`
- View: `shared_reports_with_access` for aggregated access info
- Automatic `updated_at` trigger

### API Endpoints

**Report Management**:
- `POST /api/reports/shared/create` - Create shared report from LLM report
- `GET /api/reports/shared/[id]` - Fetch shared report with permissions
- `PATCH /api/reports/shared/[id]` - Update blocks, title, or public status
- `DELETE /api/reports/shared/[id]` - Delete shared report
- `GET /api/reports/shared/list` - List all accessible shared reports

**Access Control**:
- `POST /api/reports/shared/[id]/access` - Grant access to users
- `DELETE /api/reports/shared/[id]/access` - Revoke access
- `GET /api/reports/shared/[id]/access` - List users with access

**User Search**:
- `GET /api/users/search?email={email}` - Find users by email (admin only)

### UI Components & Pages

**Report Builder** (`/reports/shared/[id]/edit`):
- Visual constructor with drag-and-drop block reordering
- Editable block titles and content
- Up/down arrow buttons for precise ordering
- Metadata editing (title, description)
- Public/private toggle
- Native HTML5 drag-and-drop (no external libraries)
- **Multi-type block support**: sections, tables, charts, comments
- Type-specific rendering and editing
- Components:
  - `ReportBuilder.tsx` - Main builder component
  - `BlockRenderer.tsx` - Renders different block types (edit mode)
  - `ReportBuilder.module.css` - Styling with animations

**View Page** (`/reports/shared/[id]/view`):
- Clean, reader-friendly layout
- Blocks displayed in configured order
- Access status badges (public/private)
- Edit button for authorized users
- Responsive design with fade-in animations
- **Rich content rendering**: tables, charts, and formatted comments
- Components:
  - `BlockViewer.tsx` - Renders different block types (view mode)
  - Interactive charts with Chart.js
  - Styled tables with proper formatting

**Access Management** (`/reports/shared/[id]/access`):
- Grant access by email address
- Table view of users with access
- Revoke access functionality
- Role badges and grant dates
- User search integration

**List Page** (`/reports/shared/`):
- Overview of all shared reports
- Sortable table with type, status, and access count
- Quick access to view/edit actions
- Type and status badges

**Share Button** (`ShareReportButton.tsx`):
- Dialog-based creation flow
- Added to both Manager and Student report pages
- Pre-fills title based on report type
- Auto-navigates to editor after creation

### Data Flow

1. **Creation**:
   - Admin views LLM-generated report (manager or student)
   - Clicks "📤 Share Report" button
   - Enters title and description
   - System converts LLM content sections into blocks
   - Navigates to Report Builder

2. **Editing**:
   - Drag blocks to reorder
   - Click block title to rename
   - Edit block content in text areas
   - Save changes (updates `blocks` JSONB)
   - Toggle public/private status

3. **Access Control**:
   - Admin enters user email
   - System finds user in profiles
   - Grants access record in `report_access`
   - User can view report at `/reports/shared/[id]/view`

4. **Viewing**:
   - User navigates to shared report
   - System checks: is_public OR has access record OR is admin
   - Displays blocks in order
   - Shows edit button if user has permission

### Block Structure

**Block Types:**
- `section` - Text content blocks (editable)
- `comments` - Instructor feedback blocks (editable, styled)
- `table` - Data tables (read-only)
- `pie-chart` - Pie charts for distributions (read-only)
- `line-chart` - Line charts for time-series (read-only)

**Manager Report Blocks** (up to 13 blocks):
1. Executive Summary (`section`)
2. **Student Segmentation Distribution** (`pie-chart`) - segment counts + helpText
3. **Segmentation Statistics** (`table`) - segment analysis with avg completion + helpText
4. Group Dynamics & Engagement (`section`)
5. **Activity Pattern Distribution** (`pie-chart`) - easing types distribution + helpText
6. **Activity Pattern Statistics** (`table`) - pattern analysis with avg frontload + helpText
7. **Student Performance Overview** (`table`) - ALL students (not just top 10) with meetings column + helpText
8. Learning Outcomes & Projects (`section`)
9. Expert Observations (`section`)
10. Program Expert Feedback (`comments`) - if filled
11. Teaching Assistants Feedback (`comments`) - if filled
12. Learning Support Feedback (`comments`) - if filled
13. Opportunities & Recommendations (`section`)

**Student Report Blocks** (up to 13 blocks):
1. Your Learning Journey (`section`)
2. Your Strengths & Achievements (`section`)
3. **Your Performance Overview** (`table`) - single row with 8 key metrics + helpText
4. **Your Activity Pattern Metrics** (`table`) - single row with 7 dynamic metrics + helpText
5. **Your Activity Pattern Over Time** (`line-chart`) - cumulative curve + helpText
6. Your Skills Development (`section`)
7. Feedback from Your Instructors (`section`)
8. Program Expert Feedback (`comments`) - if filled
9. Teaching Assistants Feedback (`comments`) - if filled
10. Learning Support Feedback (`comments`) - if filled
11. Opportunities for Growth (`section`)
12. Next Steps & Recommendations (`section`)
13. **Performance by Topic** (`table`, if available) - topic breakdown + helpText

Each block:
```typescript
{
  id: string,
  type: 'section' | 'table' | 'pie-chart' | 'line-chart' | 'comments',
  title: string,
  content: string, // For section and comments
  data?: any, // For tables and charts
  config?: {
    columns?: string[], // For tables
    chartType?: 'pie' | 'line', // For charts
    xField?: string, yField?: string, // For line charts
    showLegend?: boolean,
  },
  helpText?: string, // Optional help text shown in accordion
  order: number
}
```

**Data Sources:**
- **Tables**: Sourced from `performance_data`, `dynamic_data`, and `submissions_data`
- **Charts**: Calculated from performance segments and activity timelines
- **Comments**: Aggregated from instructor feedback fields

### Security & Permissions

**Admin-only actions**:
- Create shared reports
- Edit any shared report
- Manage access for any report
- Delete shared reports

**User actions**:
- View public reports
- View reports they have access to
- View their own created reports (if admin created it)

**RLS Policies**:
- Separate policies for admins, creators, and viewers
- Access records checked with expiration support
- Cascading deletes when reports removed

### Type System Updates (`lib/types.ts`)

Added interfaces:
- `ReportBlock` - Individual content block structure
- `SharedReport` - Main shared report data
- `ReportAccess` - Access control record
- `SharedReportWithAccess` - Report with enriched access list

### Integration Points

**Existing Pages Updated**:
1. `/reports/[id]/manager-report/page.tsx`:
   - Added `ShareReportButton` import
   - Button appears when report exists

2. `/reports/[id]/student-reports/[userId]/page.tsx`:
   - Added `ShareReportButton` import
   - Button passes student name and ID

### User Experience

**Admin Workflow**:
1. Generate LLM report (manager or student)
2. Click "Share Report" → enters title
3. Edit blocks in visual constructor
4. Drag to reorder, click to edit content
5. Save changes
6. Manage access: add users by email
7. Toggle public if needed

**Viewer Workflow**:
1. Receives access to shared report
2. Navigates to `/reports/shared/[id]/view`
3. Reads content in customized block order
4. Clean, distraction-free reading experience

### Benefits

1. **Flexibility**: Reorder blocks to match audience needs
2. **Customization**: Edit content without regenerating AI
3. **Control**: Precise access management per report
4. **Reusability**: One LLM report → multiple shared versions
5. **Audit Trail**: Track who granted access and when
6. **Expiration**: Optional time-limited access

### Technical Decisions

**Why HTML5 Drag-and-Drop?**:
- No external dependencies
- Native browser support
- Lightweight and performant
- Up/down buttons as fallback

**Why JSONB for blocks?**:
- Flexible structure for future block types
- Efficient storage and querying
- Easy to serialize/deserialize
- PostgreSQL JSON operators available

**Why separate tables?**:
- LLM reports remain immutable
- Shared versions are independent
- Multiple shared reports from one source
- Clear separation of concerns

### Key Features Added in v2 (2025-10-08)

**Multi-Type Block Support:**
- Expanded from text-only blocks to 5 block types
- Automatic data extraction from reports
- Visual components (charts, tables) integrated
- Instructor comments highlighted with special styling

**Manager Report Analytics:**
- **Segmentation Analysis**: Pie chart + statistics table per segment
- **Activity Pattern Analysis**: Pie chart + statistics table for easing types
- **All Students Table**: Complete roster (not just top 10) with meetings column
- Comprehensive group dynamics visualization
- **Help Accordions**: Each data block has contextual help text

**Student Report Analytics:**
- **Performance Overview**: Single-row table with 8 key metrics
- **Activity Pattern Metrics**: Single-row table with 7 dynamic metrics
- Line chart for cumulative activity curve
- Topic performance breakdown (if available)
- Comprehensive personal analytics in compact format
- **Help Accordions**: Each data block explains how to interpret the data

**Help System (v2.1):**
- Added `helpText` field to ReportBlock interface
- Collapsible accordions under tables and charts
- "ℹ️ How to read this data" label
- Contextual explanations for:
  - What each metric means
  - How to interpret values
  - What patterns to look for
  - Ideal vs. concerning values

**Enhanced Help System with User-Friendly Content (v2.2):**
- Converted all help text from Markdown to HTML format for proper rendering
- Updated `HelpAccordion` component to use `dangerouslySetInnerHTML` for rich HTML content
- Added scoped CSS styling for paragraphs, lists, bold text, and emphasis
- Completely rewrote all help texts to be accessible for non-technical audiences:
  - **Simplified language**: Replaced technical jargon with conversational explanations
  - **Practical interpretations**: E.g., "Students doing great" instead of "High performers"
  - **Encouraging tone**: Positive, supportive language for student-facing content
  - **Clear structure**: Organized with headings, bullet points, and nested lists
  - **Contextual guidance**: Each block explains "what to look for" in plain terms
  - **Removed tip callouts**: Streamlined content without separate "Quick tip" sections
- Applied to all data blocks in both manager and student reports
- Improved typography and spacing in accordion content for better readability

**Separate Comment Blocks by Role (v2.3):**
- Split combined team/instructor comments into separate blocks for each role
- **Manager Reports**: Now show up to 3 separate comment blocks at the beginning:
  - Program Expert Feedback
  - Teaching Assistants Feedback
  - Learning Support Feedback
- **Student Reports**: Same structure with 3 separate comment blocks
- Each comment block only appears if the corresponding field is filled
- Allows for better organization and independent reordering of feedback from different team members
- Each role's feedback is clearly labeled and styled as a `comments` type block

**Enhanced Block Management (v2.4):**
- **Default Comment Positioning**: Comment blocks now appear after "Expert Observations" (manager) and "Feedback from Your Instructors" (student) sections by default
- **Individual Block Save**: Added save button (💾) for each text/comment block to save changes individually
- **Unsaved Changes Indicator**: Added "Unsaved" badge on edited blocks and counter in footer
- **Add Existing Blocks**: Added "➕ Add Block" button with dialog to select from existing blocks:
  - Shows dropdown list of all available blocks from the original report
  - **Only shows blocks that are not yet on the page** (prevents duplicates)
  - Each block displays its icon (📝 📊 📈 📉 💬) and title
  - Shows count of available blocks (e.g., "Available Blocks (5)")
  - **Adds block to the top** of the report (not the bottom)
  - **Preserves latest saved version** - if you edit and save a block, then delete it, re-adding it will use the edited version
  - Preserves all data, config, and helpText from the block
  - **Auto-saves** immediately after adding a block
  - Button becomes disabled when all blocks are already added
  - Dialog shows message when no blocks are available
  - **Silent operation** - no alert popups, smooth UX
- **Delete Blocks**: Added delete button (🗑️) for each block with confirmation dialog
  - **Auto-saves** immediately after deleting a block
- **Block Management Features**:
  - Track edited blocks individually
  - Save single block without affecting others
  - Add unlimited copies of existing blocks (auto-saved)
  - Delete any block with confirmation (auto-saved)
  - Visual indicators for unsaved changes
  - Counter showing total unsaved blocks
  - Dialog-based block selection from available blocks
  - Automatic save on add/delete operations
  - Revert on save failure

**Technical Implementation:**
- `BlockRenderer.tsx` for edit mode
- `BlockViewer.tsx` for view mode
- Chart.js integration for visualizations
- Type-safe block definitions with TypeScript
- Preserved editability for text content while keeping data blocks read-only

### Future Enhancements (Not Implemented)

- Block templates and presets
- Rich text editor for section content
- Custom block types (video embeds, images)
- Version history for blocks
- Bulk access management
- Email notifications on access grant
- Public link with access code
- Export shared reports as PDF
- Analytics: view counts, engagement
- Chart customization options

---

## 2025-10-06: Documentation Translation

### LLM Data Documentation Translation to English
**Action**: Translated `docs/LLM_DATA_SENT.md` from Russian to English
**Rationale**: Ensure documentation consistency and accessibility for international team members

### Translation Details
- Maintained all structure, formatting, and technical accuracy
- Preserved all tables, JSON examples, and code blocks
- Kept all emoji indicators and visual elements
- Updated metadata section at the bottom

---

## 2025-10-06: LLM-Generated Reports Feature

### New Feature: AI-Powered Manager and Student Reports
**Purpose**: Enable admins to generate comprehensive, AI-summarized reports for managers and individual students using LiteLLM (GPT-4 via Hyperskill internal proxy).

### Changes

**Database Schema** (`supabase/add-llm-reports.sql`):
- Created `manager_reports` table:
  - Links to base `reports` table (one-to-one)
  - Stores `generated_content` (original AI output) and `edited_content` (admin edits)
  - `is_published` flag for visibility control
  - Unique constraint: one manager report per base report
- Created `student_reports` table:
  - Links to base `reports` table (one-to-many)
  - Stores per-student AI-generated content and edits
  - `is_published` flag for student visibility
  - Unique constraint: one student report per (report_id, user_id)
- RLS policies:
  - Students can view their own published reports
  - Managers can view all published reports
  - Admins can manage all reports (CRUD)

**API Routes**:
- `POST /api/llm/generate-manager-report`:
  - Accepts `reportId`
  - Fetches team data (performance, dynamics, comments)
  - Sends to GPT-4 with comprehensive system prompt
  - Stores result in `manager_reports` table
  - Returns generated content
- `POST /api/llm/generate-student-report`:
  - Accepts `reportId` and `userId`
  - Fetches student-specific data (performance, dynamics, feedback)
  - Sends to GPT-4 with personalized system prompt
  - Stores result in `student_reports` table
  - Returns generated content

**UI Components**:
- `LLMReportButtons.tsx`:
  - Displays on report detail page (`/reports/[id]`)
  - Two buttons: "Generate Manager Report" and "Generate Student Reports"
  - Admin-only visibility
  - Provides navigation to edit pages
- Manager report edit page (`/reports/[id]/manager-report/page.tsx`):
  - 5 editable sections (Executive Summary, Group Dynamics, Learning Outcomes, Expert Observations, Opportunities)
  - Save and Publish controls
  - Regenerate option
- Student reports management page (`/reports/[id]/student-reports/page.tsx`):
  - Lists all students with generation status
  - Batch "Generate All" option
  - Individual generate/edit buttons
  - Shows published/draft/edited status
- Student report edit page (`/reports/[id]/student-reports/[userId]/page.tsx`):
  - 6 editable sections (Learning Journey, Strengths, Skills Development, Instructor Feedback, Growth Opportunities, Next Steps)
  - Save and Publish controls
  - Regenerate option

**Integration**:
- Updated `app/reports/[id]/page.tsx`:
  - Added `LLMReportButtons` component below tabs
  - Buttons appear for admins only
- Updated `app/student/[userId]/page.tsx`:
  - Added link to AI report editor for admins
  - Appears when viewing student from saved report
  - "📝 Edit AI Report" button at top of page

**Prompts**:
- Manager report prompt:
  - Act as Learning Experience Designer
  - Friendly, professional tone
  - 5 sections: Executive Summary, Group Dynamics, Learning Outcomes, Expert Observations, Opportunities
  - Explains technical metrics in simple terms
  - JSON output format
- Student report prompt:
  - Act as Learning Coach
  - Warm, encouraging tone
  - Speaks directly to student using their name
  - 6 sections: Learning Journey, Strengths, Skills Development, Instructor Feedback, Growth, Next Steps
  - Constructive and motivating
  - JSON output format

**Dependencies**:
- Added `openai` package (v4.77.0) to `package.json`
- Updated `env.example` with `LITELLM_API_KEY` and `LITELLM_BASE_URL`
- Configured to use Hyperskill internal LiteLLM proxy instead of direct OpenAI access

**Documentation**:
- Created `docs/llm-reports-feature.md`:
  - Feature overview
  - Workflow descriptions
  - Database schema details
  - API endpoints
  - Security & permissions
  - Cost considerations
  - Usage tips

### Benefits
1. **Saves Time**: Auto-generates comprehensive reports from raw data
2. **Consistency**: Standardized format across all reports
3. **Accessibility**: Translates technical metrics into plain language
4. **Personalization**: Tailored content for managers vs students
5. **Flexibility**: Admins can edit before publishing
6. **Control**: Draft/publish workflow prevents premature sharing

### Security
- Admin-only generation (enforced in API routes)
- RLS policies for published content visibility
- Separate tables for manager vs student reports
- Explicit publish action required

## 2025-10-06: Refactor - Overall Engagement vs Weekly Momentum

### Breaking Change: Removed Weekly Momentum Calculation
**Rationale**: Student reports are for evaluating overall course results, not recent trends. Weekly momentum (last 7 vs previous 7 days) is not relevant for summative assessment at course completion.

### Changes
**Type System**:
- Replaced `StudentMomentum` with `StudentEngagement`
- `StudentEngagement` includes: level (High/Medium/Low), description, active_days_ratio

**Processor Logic** (`student-report-processor.ts`):
- Removed `calculateMomentum()` function
- Added `calculateEngagement()` function based on entire course period
- Engagement = average of (active_days_ratio + consistency from dynamic analysis)
- High: ≥60%, Medium: 30-60%, Low: <30%

**Signal Extraction**:
- Removed momentum-based focus signals: `momentum_down`, `end_dropoff` (with momentum condition)
- Added overall pattern signals: `high_burstiness` (>0.8), `early_dropoff` (without momentum)
- Updated `extractFocus()` to remove `series` parameter (no longer needed)

**Highlights Generation**:
- Updated text to emphasize overall course patterns
- "Overall engagement" instead of "recent activity"
- "Throughout the course" instead of "this week"
- "Pattern shows" instead of "activity dipped"

**Next Steps Generation**:
- Removed momentum-based suggestions ("Plan two short sessions this week")
- Added engagement-based suggestions ("Establish regular study schedule")
- Added burstiness-based suggestions ("Create more regular study rhythm")
- Suggestions now focus on overall habits, not weekly fixes

**UI Changes** (`app/student/[userId]/page.tsx`):
- Replaced "Recent Activity" card with "Overall Engagement" card
- Emoji indicators: 🔥 High, 📊 Medium, 💤 Low (was 📈📉➡️)
- Description shows total active days across full period
- Removed `getMomentumColor()`, added `getEngagementColor()`

### Benefits
1. **More relevant**: Summative assessment vs formative feedback
2. **Clearer insights**: Overall learning patterns vs weekly fluctuations
3. **Better actionable advice**: Long-term habits vs short-term fixes
4. **Consistent purpose**: Report evaluates course completion, not ongoing progress

### Algorithm Alignment
Modified from Personal Student Report Algorithm v1:
- Kept: §3 (Wins & Focus), §5 (Topic selection), §6 (Next steps structure), §7 (Curve explanation)
- Removed: §4 (Momentum last 7 vs previous 7)
- Added: Overall engagement calculation (active days ratio + consistency)

---

## 2025-10-06: Personalized Student Report Feature

### Major Feature: Individual Student Detail Pages
- Implemented comprehensive student detail pages accessible via clickable names in results tables
- Based on **Personal Student Report Algorithm v1** specification
- Full integration with existing Performance v3 and Dynamic/Easing v3 pipelines

### New Type Definitions
Added to `lib/types.ts`:
- `StudentTopic`: Topic-level analysis with labels (Comfortable/Watch/Attention)
- `StudentMomentum`: Weekly momentum tracking (Up/Flat/Down/Unknown)
- `StudentHighlight`: Wins and focus areas for student
- `StudentReport`: Complete personal report structure with all signals

### New Processor: student-report-processor.ts
**Core Functions**:
1. `generateStudentReport()`: Main entry point, orchestrates all signal extraction
2. `generateTopicTable()`: Synthesizes topics from step-level submissions data
3. `extractWins()`: Identifies positive signals (achievement, consistency, steady work, early progress)
4. `extractFocus()`: Identifies attention areas (struggling topics, low consistency, momentum down, easing risks)
5. `calculateMomentum()`: Computes last 7 days vs previous 7 days trend
6. `generateHighlights()`: Creates 3-5 plain-English bullets (wins first, then focus)
7. `generateNextSteps()`: Produces 2-3 actionable suggestions prioritized by impact

**Topic Analysis**:
- Groups steps into synthetic topics (every 10 steps = 1 topic)
- Calculates per-topic metrics: attempts/step, first-pass rate, deltas from course average
- Assigns labels: Comfortable (doing well) / Watch (needs attention) / Attention (requires review)
- Computes topic_score for prioritization (higher = more attention needed)

**Signal Extraction Logic**:
- **Wins** (candidates):
  - High score (≥80%) or success rate (≥85%)
  - Strong consistency (≥0.5)
  - Low burstiness (≤0.6) - steady work pattern
  - Positive frontload index (≥0.10) - early progress
  - Comfortable topics with high first-pass rate (≥0.7)
  
- **Focus** (candidates):
  - Topics labeled Watch/Attention
  - High struggle index (≥0.6)
  - Low active days ratio (<0.3)
  - Momentum down (≥15% decrease)
  - Easing risks: ease-in with late start (t25 > 0.4), ease-out with dropoff (t75 < 0.6)

**Momentum Calculation**:
- Requires ≥14 days of data
- Compares last 7 days total activity vs previous 7 days
- Delta ≥ +15% = Up, ≤ -15% = Down, else Flat

**Next Steps Generator**:
Priority order:
1. Focus on #1 attention topic (if exists)
2. Plan short sessions if momentum down
3. Join webinar if attendance < 40%
4. Maintain rhythm / build consistency (fallback)

### New Route: /student/[userId]/page.tsx
**Student Detail Page Components**:
1. **Header Card**: Name, user ID, segment badge, easing badge, key scores
2. **Highlights Section**: 3-5 actionable bullets with visual distinction (wins in green, focus in orange)
3. **Momentum Card**: Recent activity trend with emoji indicator and explanation
4. **Activity Curve Card**: 
   - Frontload index, consistency, burstiness metrics
   - Progress quartiles (t25/t50/t75)
   - Interactive EasingChart visualization
   - Plain-English curve explanation
5. **Topics Grid**: 
   - "Going Well" (green) - comfortable topics
   - "Focus Areas" (orange) - topics needing attention
6. **Next Steps Card**: Numbered action items (1-3 suggestions)
7. **Detailed Statistics**: Full performance metrics, meeting attendance
8. **Topic Analysis Table**: Complete breakdown with labels, deltas from average, evidence quality

**UI/UX Features**:
- All terms include hover tooltips and legend explanations
- Color-coded badges for quick visual scanning
- Delta indicators show +/- from course average
- Evidence quality warnings for low-data topics
- Responsive grid layouts
- Smooth animations on load

### Updated Result Tables
**PerformanceResults.tsx**:
- Added clickable student names (underline on hover)
- Names link to `/student/[userId]` detail page
- Row hover effect for better UX

**DynamicResults.tsx**:
- Added clickable student names (underline on hover)
- Names link to `/student/[userId]` detail page
- Retained "View curve" button for inline expansion

### Styling
**New CSS Module**: `app/student/[userId]/student.module.css`
- Fade-in animations for cards
- Responsive container with max-width
- Smooth transitions

**Updated**: `PerformanceResults.module.css`, `DynamicResults.module.css`
- `.clickableRow`: hover effect on table rows
- `.clickableName`: styled clickable names with accent color and underline animation

### Algorithm Alignment
Fully implements **Personal Student Report Algorithm v1**:
- ✅ Student-first language (plain English, no heavy statistics)
- ✅ Personal signal selection (top wins + focus items)
- ✅ Graceful degradation (handles missing meetings, short data spans)
- ✅ Transparent conclusions (all signals tied to specific metrics)
- ✅ Tone guidelines: supportive, actionable, wins before focus
- ✅ Edge cases: sparse data, no titles, conflicting signals

### Copy & Messaging
All student-facing text follows algorithm guidelines:
- Sentences limited to ~12-16 words
- One idea per bullet
- Supportive verbs ("review", "plan", "try") instead of negatives
- "Compared with the course" phrasing (no precise ranks)
- Wins presented first, focus paired with next steps

### Integration
- Seamlessly integrates with existing v3 pipelines
- No changes to data processing or upload flow
- Reuses existing chart components (EasingChart)
- Leverages AppContext for data access
- Zero impact on existing functionality

### English-Only Interface
- All UI text, legends, tooltips in English
- Metric names use standard terminology
- Explanations accessible to non-technical users
- Consistent with overall app localization

---

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

---

## 2025-10-06: Cogniterra Links Integration

### Overview
Added support for clickable topic links to the Cogniterra platform in student reports.

### Changes Made

#### 1. Type System Updates
- **lib/types.ts**: Added `structure?: CSVFile` to `UploadedFiles`
- **lib/types.ts**: Added URL components to `StudentTopic`:
  - `lesson_id?: number`
  - `first_step_id?: number`
  - `unit_id?: number`
  - `course_id?: number`

#### 2. Upload System
- **app/upload/page.tsx**: Added `structure` as optional file type
- **lib/utils/csv-parser.ts**: Added validation for structure.csv (requires `step_id`, `lesson_id`)

#### 3. Processor Updates
- **lib/processors/student-report-processor.ts**:
  - Added `structure?: any[]` to `ProcessorInput`
  - Created `structureMap` to map `step_id` → `{lesson_id, unit_id, course_id}`
  - Extended topic aggregation to include URL components
  - Each topic now stores first step's structure data

#### 4. UI Updates
- **app/student/[userId]/page.tsx**:
  - Passed `structure` data to `generateStudentReport()`
  - Made topic names in Topic Analysis table clickable links
  - URL format: `https://cogniterra.org/lesson/{lesson_id}/step/{first_step_id}?unit={unit_id}`
  - Added hover effect for better UX
  - Links open in new tab with `rel="noopener noreferrer"`

#### 5. Data Flow
1. User uploads `structure.csv` (optional) with columns: `course_id`, `module_id`, `lesson_id`, `step_id`
2. System builds map: `step_id` → URL components
3. During topic generation, each topic stores structure data from its first step
4. UI renders clickable links when structure data is available
5. Fallback: plain text when structure not provided

### User Experience
- **With structure.csv**: Topic names become clickable links to Cogniterra
- **Without structure.csv**: Topic names display as plain text
- Hover effect indicates clickable links
- External links open in new tabs

### Technical Details
- Optional file: app works without structure.csv
- No breaking changes to existing functionality
- Graceful fallback for missing data
- Structure data loaded once, used throughout student reports

---

## 2025-10-08: Shared Reports - Topic Links Integration

### Overview
Added support for clickable topic links to Cogniterra in student shared reports. This feature applies the same topic linking functionality from regular student reports to shared student reports.

### Changes Made

#### 1. API Updates - Shared Report Creation
- **app/api/reports/shared/create/route.ts**:
  - Added structure map building from `baseReport.structure_data`
  - Extended topic statistics to include `lesson_id`, `unit_id`, `course_id`
  - Topics now store first step's structure data for linking
  - Topic performance data includes `lesson_id` when available

#### 2. UI Updates - Block Rendering
- **app/reports/shared/[id]/view/BlockViewer.tsx**:
  - Updated `TableBlockViewer` to detect topic columns with `lesson_id`
  - Added clickable links to Cogniterra for topics with structure data
  - URL format: `https://cogniterra.org/lesson/{lesson_id}/step/1`
  - Applied hover effect for better UX
  - Links open in new tab with `rel="noopener noreferrer"`

- **app/reports/shared/[id]/edit/BlockRenderer.tsx**:
  - Updated `TableBlock` with same topic link logic
  - Links are displayed in both edit and view modes
  - Maintains consistent styling with regular student reports

### Technical Implementation
1. **Data Flow**:
   - Shared report creation fetches `structure_data` from base report
   - Structure map is built: `step_id` → `{lesson_id, unit_id, course_id}`
   - Topic aggregation includes structure data from first step
   - `lesson_id` is stored in topic performance data

2. **Rendering Logic**:
   - Table renderer checks if column is `topic` AND row has `lesson_id`
   - If both conditions met, renders clickable link
   - Otherwise, renders plain text
   - Graceful fallback when structure data not available

### User Experience
- **With structure.csv uploaded**: Topic names in student shared reports become clickable links
- **Without structure.csv**: Topics display as plain text (no errors)
- Consistent behavior with regular student reports
- Works in both edit and view modes

### Compatibility
- All existing shared reports continue to work without changes
- No breaking changes to shared report schema
- Feature works automatically if source report has structure data
- No changes needed to manager reports (they don't use topic tables)

---

## 2025-10-08: Shared Reports - Database Constraint Fix

### Issue
Users encountered a database error when trying to create multiple shared reports for the same student from the same source report:
```
duplicate key value violates unique constraint "shared_reports_source_report_id_user_id_report_type_key"
```

### Root Cause
The database schema had an overly restrictive unique constraint that prevented creating multiple shared reports for the same student from the same source report. This constraint was:
```sql
UNIQUE(source_report_id, user_id, report_type)
```

### Solution
**Database Schema Update:**
- **supabase/add-shared-reports.sql**: Removed the unique constraint
- **supabase/fix-shared-reports-constraint.sql**: Created migration script to drop existing constraint

**Migration Required:**
```sql
ALTER TABLE shared_reports 
DROP CONSTRAINT IF EXISTS shared_reports_source_report_id_user_id_report_type_key;
```

### Impact
- ✅ Admins can now create multiple shared reports for the same student
- ✅ Different block configurations can be shared with the same student
- ✅ No breaking changes to existing functionality
- ✅ Better flexibility for report customization

### User Experience
- No more "duplicate key" errors when sharing reports
- Multiple shared report versions per student are now supported
- Each shared report can have different block configurations

