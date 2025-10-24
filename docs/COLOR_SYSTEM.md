# Color Management System

This document describes the centralized color management system used throughout the application.

## Overview

All colors for charts and badges are managed through a single source of truth: `lib/utils/segment-colors.ts`

This ensures:
- ✅ **Consistency** - Charts and badges use exact matching RGB colors
- ✅ **Maintainability** - Update colors in one place
- ✅ **Type Safety** - TypeScript types for all functions
- ✅ **Backward Compatibility** - Supports old and new segment names
- ✅ **Perfect Color Matching** - Badges use exact RGB colors from charts via inline styles

## Usage

### For Performance Segments

```typescript
import { 
  getPerformanceSegmentChartColor,
  getPerformanceSegmentBadgeStyle 
} from '@/lib/utils/segment-colors';

// For charts (returns rgba color string)
const chartColor = getPerformanceSegmentChartColor('Leader efficient');
// Returns: 'rgba(34, 197, 94, 0.8)'

// For badges (returns inline styles with exact RGB colors)
<Badge style={getPerformanceSegmentBadgeStyle('Leader efficient')}>
  Leader efficient
</Badge>
```

### For Easing Patterns

```typescript
import { 
  getEasingPatternChartColor,
  getEasingPatternBadgeStyle 
} from '@/lib/utils/segment-colors';

// For charts
const chartColor = getEasingPatternChartColor('ease-out');
// Returns: 'rgba(34, 197, 94, 0.8)'

// For badges
<Badge style={getEasingPatternBadgeStyle('ease-out')}>
  ease-out
</Badge>
```

### For Module Activity

```typescript
import { MODULE_COLORS, toSolidColor } from '@/lib/utils/segment-colors';

// Chart configuration
const chartData = {
  datasets: [
    {
      label: 'Completed Steps',
      backgroundColor: MODULE_COLORS.COMPLETED_STEPS,
      borderColor: toSolidColor(MODULE_COLORS.COMPLETED_STEPS),
    },
    {
      label: 'Meetings Attended',
      backgroundColor: MODULE_COLORS.MEETINGS_ATTENDED,
      borderColor: toSolidColor(MODULE_COLORS.MEETINGS_ATTENDED),
    }
  ]
};
```

## Color Scheme

### Performance Segments

| Segment | Chart Color | Badge Style | Visual | Description |
|---------|-------------|-------------|--------|-------------|
| Highly efficient | `rgba(34, 197, 94, 0.8)` | green (dark) | 🟢 (dark) | Consistently productive, delivers strong results |
| Highly engaged | `rgba(34, 197, 94, 0.8)` | green (dark) | 🟢 (dark) | Actively participates, contributes with enthusiasm |
| Highly committed | `rgba(74, 222, 128, 0.8)` | grass (medium) | 🟢 (medium) | Puts in strong effort, motivated but still finding consistency |
| Moderately engaged | `rgba(134, 239, 172, 0.8)` | lime (light) | 🟢 (light) | Participates occasionally, shows average involvement |
| Less engaged | `rgba(239, 68, 68, 0.8)` | red | 🔴 | Limited participation or motivation |

### Easing Patterns

| Pattern | Chart Color | Badge Style | Visual | Meaning |
|---------|-------------|-------------|--------|---------|
| ease-out | `rgba(34, 197, 94, 0.8)` | Dark green RGB | 🟢 (dark) | Frontloaded |
| ease-in | `rgba(249, 115, 22, 0.8)` | Orange RGB | 🟠 | Backloaded |
| ease-in-out | `rgba(168, 85, 247, 0.8)` | Purple RGB | 🟣 | S-curve |
| ease | `rgba(59, 130, 246, 0.8)` | Blue RGB | 🔵 | Balanced |
| linear | `rgba(134, 239, 172, 0.8)` | Light green RGB | 🟢 (very light) | Steady |
| no-activity | `rgba(220, 38, 38, 0.8)` | Red RGB | 🔴 | No activity |

### Module Activity

| Metric | Color | Visual |
|--------|-------|--------|
| Completed Steps | `rgba(59, 130, 246, 0.8)` | 🔵 |
| Meetings Attended | `rgba(168, 85, 247, 0.8)` | 🟣 |

## Badge Style System

Instead of using Radix UI's predefined color names, we apply exact RGB colors from charts via inline styles:

```typescript
// The badge style function extracts RGB from chart color
// and creates custom styles for perfect matching
const style = getPerformanceSegmentBadgeStyle('Leader efficient');
// Returns:
// {
//   backgroundColor: 'rgba(34, 197, 94, 0.15)',  // 15% opacity for background
//   color: 'rgb(10, 59, 28)',                     // Dark text (30% brightness) for readability
//   borderColor: 'rgba(34, 197, 94, 0.3)',        // 30% opacity for border
// }
```

This approach ensures:
- ✅ Badges and charts use identical RGB values
- ✅ Dark text for excellent readability on all backgrounds
- ✅ Visual distinction is clear (e.g., dark green vs light green)
- ✅ No reliance on Radix UI's predefined palette limitations

## Available Functions

### Chart Color Functions

```typescript
// Returns rgba color string for charts
getPerformanceSegmentChartColor(segment: string): string
getEasingPatternChartColor(easing: string): string
```

### Badge Style Functions

```typescript
// Returns React.CSSProperties with exact RGB colors matching charts
getPerformanceSegmentBadgeStyle(segment: string): React.CSSProperties
getEasingPatternBadgeStyle(easing: string): React.CSSProperties

// Low-level function to convert any chart color to badge styles
getBadgeStyleFromChartColor(chartColor: string): React.CSSProperties
```

### Helper Functions

```typescript
// Convert rgba(r,g,b,0.8) to rgba(r,g,b,1) for borders
toSolidColor(rgbaColor: string): string

// Get color map for multiple segments
getSegmentColorMap(segments: string[]): Map<string, string>
getEasingColorMap(easings: string[]): Map<string, string>
```

## Constants

### Color Constants

```typescript
SEGMENT_COLORS = {
  LEADER_GREEN: 'rgba(34, 197, 94, 0.8)',
  MODERATE_BLUE: 'rgba(59, 130, 246, 0.8)',
  BALANCED_LIGHT_GREEN: 'rgba(134, 239, 172, 0.8)',
  EFFORTFUL_ORANGE: 'rgba(249, 115, 22, 0.8)',
  LOW_RED: 'rgba(239, 68, 68, 0.8)',
  LINEAR_LIGHT_GREEN: 'rgba(134, 239, 172, 0.8)',
  // ... more colors
}

MODULE_COLORS = {
  COMPLETED_STEPS: 'rgba(59, 130, 246, 0.8)',
  MEETINGS_ATTENDED: 'rgba(168, 85, 247, 0.8)',
}
```

## Backward Compatibility

The system supports both old and new segment naming conventions:

| Old Name (v1) | Mid Name (v2) | Current Name (v3) | Color (v3) |
|---------------|---------------|-------------------|------------|
| Leader efficient | Highly efficient | Highly efficient | 🟢 Dark green |
| Leader engaged | Highly engaged | Highly engaged | 🟢 Dark green |
| Balanced + engaged | Moderately engaged | Moderately engaged | 🟢 Light green |
| Balanced middle | Moderately performing | Moderately engaged | 🟢 Light green |
| Hardworking but struggling | Highly effortful | Highly committed | 🟢 Medium green |
| Low engagement | Low participation | Less engaged | 🔴 Red |

## Examples

### Complete Chart Example

```typescript
import { 
  getPerformanceSegmentChartColor,
  CHART_BORDERS 
} from '@/lib/utils/segment-colors';

const pieChartData = useMemo(() => {
  return Object.entries(stats.segments).map(([segment, count]) => ({
    label: segment,
    count,
    color: getPerformanceSegmentChartColor(segment),
  }));
}, [stats.segments]);

const chartConfig = {
  labels: pieChartData.map(d => d.label),
  datasets: [{
    data: pieChartData.map(d => d.count),
    backgroundColor: pieChartData.map(d => d.color),
    borderColor: CHART_BORDERS.PIE_WHITE,
    borderWidth: 2,
  }]
};
```

### Complete Badge Example

```typescript
import { getPerformanceSegmentBadgeStyle } from '@/lib/utils/segment-colors';

// Badge with exact RGB colors matching chart
<Badge 
  size="1"
  style={getPerformanceSegmentBadgeStyle(segment)}
>
  {segment}
</Badge>

// Table with segments
<Table.Cell>
  <Badge style={getPerformanceSegmentBadgeStyle(row.simple_segment)}>
    {row.simple_segment}
  </Badge>
</Table.Cell>
```

### Combining Multiple Styles

```typescript
// When you need to merge badge style with other custom styles
<Badge 
  size="2"
  style={{
    cursor: 'pointer',
    ...getPerformanceSegmentBadgeStyle(segment),
  }}
  onClick={() => handleClick(segment)}
>
  {segment}
</Badge>
```

## Adding New Colors

To add new colors:

1. Add color constant to `SEGMENT_COLORS` in `segment-colors.ts`
2. Update the color function logic to handle the new segment/pattern
3. The badge styles will automatically match using `getBadgeStyleFromChartColor()`
4. Update this documentation

## Files Using the System

- `app/components/PerformanceResults.tsx`
- `app/components/DynamicResults.tsx`
- `app/components/ModuleActivityChart.tsx`
- `app/components/GroupModuleAnalytics.tsx`
- `app/components/EasingChart.tsx`
- `app/reports/shared/[id]/view/BlockViewer.tsx`
- `app/reports/shared/[id]/edit/BlockRenderer.tsx`

## Best Practices

1. ✅ **Always use the color system** - Never hardcode colors in components
2. ✅ **Use chart colors for charts** - Use `get*ChartColor()` functions
3. ✅ **Use badge styles for badges** - Use `get*BadgeStyle()` functions
4. ✅ **Use MODULE_COLORS for module charts** - Use constants for consistency
5. ✅ **Use toSolidColor() for borders** - Convert rgba(r,g,b,0.8) to rgba(r,g,b,1)
6. ✅ **Merge styles when needed** - Use spread operator to combine badge styles with other styles

## Migration Guide

If you need to update an existing component:

### Before (Radix color names)
```typescript
import { Badge } from '@radix-ui/themes';

<Badge color="green" size="1">
  Leader efficient
</Badge>
```

### After (Exact RGB matching)
```typescript
import { Badge } from '@radix-ui/themes';
import { getPerformanceSegmentBadgeStyle } from '@/lib/utils/segment-colors';

<Badge 
  size="1"
  style={getPerformanceSegmentBadgeStyle('Leader efficient')}
>
  Leader efficient
</Badge>
```

## Technical Details

### Badge Style Generation

The `getBadgeStyleFromChartColor()` function works as follows:

1. **Extract RGB**: Parse rgba string to get R, G, B values
2. **Create dark text**: Multiply RGB by 0.3 to create dark variant (30% brightness)
3. **Create variations**:
   - Background: 15% opacity for subtle fill
   - Text: Dark variant for excellent readability
   - Border: 30% opacity for subtle outline
4. **Return**: CSS properties object for inline styling

**Example transformation:**
- Chart color: `rgba(134, 239, 172, 0.8)` (light green)
- Text color: `rgb(40, 71, 51)` (dark green - 30% brightness)
- Background: `rgba(134, 239, 172, 0.15)` (very light green)

This ensures perfect color matching between charts and badges with excellent text readability across the entire application.
