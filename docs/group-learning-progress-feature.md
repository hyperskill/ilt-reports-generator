# Group Learning Outcomes & Tools Progress Feature

## Overview

The **Group Learning Outcomes & Tools Progress** feature provides a visual overview of how the entire student group is progressing toward mastering the learning outcomes and tools defined for each course module. This feature bridges educational goals with actual student performance data.

## Location

- **Page**: Dynamic/Easing Segmentation Preview
- **URL**: `/reports/{report-id}/preview/dynamic?tab=preview`
- **Position**: Between "Group Performance by Module" and "Dynamic Results" sections

## What It Shows

### Table Structure

The feature displays data in a compact 4-column table:

| Column | Width | Content |
|--------|-------|---------|
| **Module** | 20% | Module name and position number |
| **Progress** | 15% | Color-coded completion badge, success rate %, student count |
| **📚 Learning Outcomes** | 40% | All learning outcomes as bulleted list (no truncation) |
| **🔧 Tools** | 25% | All tools as purple badge chips |

### For Each Module Row
- **Module name and position** in the course
- **Group progress metrics**:
  - Average completion rate (color-coded badge)
  - Average success rate (percentage)
  - Number of students
- **Learning Outcomes** (if defined):
  - **Collapsible display**: Shows ~1.5 outcomes by default
  - **"▼ See all" button**: Expands to show all outcomes
  - **"▲ Show less" button**: Collapses back to compact view
  - Each module can be independently expanded/collapsed
- **Tools & Technologies** (if defined):
  - All tools as badge chips
  - Wrapped if multiple tools

### Visual Indicators

The feature uses color-coded badges in the Progress column:

| Badge Color | Criteria | Meaning |
|-------------|----------|---------|
| 🟢 **Green** | Completion ≥75% | Excellent - Group is mastering this module well |
| 🟠 **Orange** | Completion 50-74% | Moderate - Group is progressing but may need support |
| 🔴 **Red** | Completion <50% | Needs Attention - Module requires intervention |

## Summary Statistics

At the bottom of the component:
- **Total Modules**: Count of all modules in the course
- **With Outcomes**: How many modules have learning outcomes defined
- **With Tools**: How many modules have tools defined
- **Avg Group Progress**: Overall average completion rate

## How It Works

### Data Sources

1. **Module Structure**: From uploaded `structure.csv` file
2. **Student Performance**: From `performance_data` (completion rates, success rates)
3. **Learning Outcomes**: From `learning_outcomes` database table
4. **Module Tools**: From `module_tools` database table
5. **Module Names**: From Cogniterra API

### Calculation Logic

For each module:
1. Fetches all students' performance data for that module
2. Calculates average completion and success rates
3. Retrieves associated learning outcomes (if any)
4. Retrieves associated tools (if any)
5. Determines progress level based on thresholds
6. Displays in a color-coded card

### Empty State

If no learning outcomes or tools are defined:
- Shows a helpful message
- Provides a link to the Settings page
- Encourages defining outcomes and tools

## User Benefits

### For Instructors
- **Quick overview** of which modules students are mastering
- **Identify gaps** where outcomes/tools aren't defined
- **Prioritize attention** to modules with low progress
- **Connect pedagogy** (outcomes) with practice (tools)

### For Program Managers
- **Track curriculum effectiveness** at the module level
- **Verify coverage** of learning outcomes across course
- **Assess tool integration** in student learning
- **Data-driven decisions** about course improvements

## Technical Details

### Component

**File**: `app/components/GroupLearningProgress.tsx`

**Props**:
```typescript
interface GroupLearningProgressProps {
  reportId: string;        // For fetching outcomes/tools
  students: any[];          // Performance data
  submissions: any[];       // Submission records
  structure: any[];         // Course structure
  courseId: number;         // Cogniterra course ID
  meetings?: any[];         // Optional meetings data
}
```

### Color Management

The component uses the centralized color system from `lib/utils/segment-colors.ts`:

**Functions used**:
- `getCompletionRateBadgeColor(rate)` - Returns Radix color ('green', 'orange', 'red') based on completion rate
- `BADGE_COLORS.TOOLS` - Purple color constant for tools badges

**Color thresholds**:
- `≥75%` → Green (PROGRESS_EXCELLENT)
- `50-74%` → Orange (PROGRESS_MODERATE)
- `<50%` → Red (PROGRESS_LOW)

**Benefits**:
- Consistent with other components (segments, charts)
- Single source of truth for color logic
- Easy to update globally
- Colors match application-wide palette

### API Endpoints Used

1. `GET /api/cogniterra/modules?moduleIds={ids}` - Fetch module names
2. `GET /api/reports/learning-outcomes?reportId={id}` - Fetch outcomes
3. `GET /api/reports/module-tools?reportId={id}` - Fetch tools

### Data Flow

```
1. Load component
   ↓
2. Extract module IDs from structure
   ↓
3. Parallel fetch: [module names, outcomes, tools]
   ↓
4. Process each student's module analytics
   ↓
5. Calculate group averages per module
   ↓
6. Combine with outcomes and tools
   ↓
7. Render cards with progress indicators
```

## Generating Outcomes and Tools

To populate this feature with data:

1. Navigate to **Settings** page:
   - From report page → "Preview and Setup" tab
   - Click "⚙️ General Report Settings"
   - Click "Manage Settings"

2. For each module:
   - Click **"✨ Generate Learning Outcomes"** for AI-generated outcomes
   - Click **"🔧 Generate Tools"** for AI-identified tools
   - Or manually enter/edit the content

3. Return to Dynamic page to see the progress visualization

## Help Section

The component includes a collapsible help accordion explaining:
- What the progress indicators mean
- How to interpret completion vs success rates
- What learning outcomes and tools represent
- What patterns to look for (e.g., high completion + low success)
- How to take action on the insights

## Design Principles

### Visual Hierarchy
1. **Table Format**: Clean, scannable layout with fixed column widths
2. **Color-Coded Badges**: Immediate visual indicator of module progress (green/orange/red)
3. **Metrics First**: Completion rate badge is most prominent
4. **Outcomes**: Largest column (40%) for complete educational goals
5. **Tools**: Badge format for quick technology identification

### Compactness
- **Table vs Cards**: Table format reduces vertical space by ~60% compared to card-based layout
- **Collapsible outcomes**: Default view shows ~1.5 outcomes per module (~50% height reduction)
- **Shows ALL outcomes on expand**: Click "See all" for complete visibility
- **Efficient space usage**: 
  - Module column: 20% (name + position)
  - Progress column: 15% (badge + 2 metrics)
  - Outcomes column: 40% (collapsible bulleted list)
  - Tools column: 25% (badge chips)
- Collapsible help section
- Only shows modules with content (outcomes or tools)
- Horizontal scroll for wide tables on narrow viewports

### Actionability
- Clear progress thresholds with color coding
- Link to Settings for missing data
- Summary stats to track coverage
- Help text with interpretation guidance
- "Not defined" indicators for empty cells

## Interaction Features

### Expand/Collapse Outcomes

Each module row with multiple learning outcomes includes collapse functionality:

1. **Default State**: Shows approximately 1.5 learning outcomes (3em height)
2. **Expand Button**: "▼ See all" appears below outcomes if more than 1 outcome exists
3. **Expanded State**: Shows all outcomes with full text
4. **Collapse Button**: "▲ Show less" appears when expanded
5. **Independent Control**: Each module can be expanded/collapsed separately
6. **State Persistence**: Expansion state persists during the session

**Benefits**:
- Drastically reduces table height in default view
- Users focus on modules of interest
- No information loss - all data accessible
- Clear visual affordance (arrow icons + underlined text)

## Future Enhancements

Potential improvements:
- **Outcome mastery tracking**: Individual outcome-level progress
- **Tool usage analytics**: Which tools students actually use
- **Comparative view**: Compare current cohort with previous ones
- **Export functionality**: Download outcomes/tools progress report
- **Filtering**: Show only modules needing attention
- **Sorting**: By progress level, completion rate, etc.
- **Drill-down**: Click module to see student-level details

## Related Features

- **[Learning Outcomes Feature](learning-outcomes-feature.md)**: How to generate and manage outcomes
- **[Module Tools Feature](module-tools-feature.md)**: How to define tools per module
- **[Group Module Analytics](../app/components/GroupModuleAnalytics.tsx)**: Detailed performance metrics

## Support

For issues or questions:
1. Check this guide first
2. Review `app-creation-log.md` entry for 2025-10-24
3. Check browser console for API errors
4. Verify structure data includes module IDs
5. Ensure outcomes/tools are defined in Settings

---

**Last Updated**: 2025-10-24  
**Version**: 1.0  
**Component**: `GroupLearningProgress.tsx`

