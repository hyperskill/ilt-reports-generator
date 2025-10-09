# 📦 Block Types Guide

## Overview

Shared reports support 5 types of content blocks that can be reordered and customized. This guide explains each block type and how they work.

---

## Block Types

### 1. 📝 Section Blocks

**Type:** `section`  
**Editable:** ✅ Yes  
**Use case:** Text content, explanations, summaries

Text blocks with full editing capabilities. Contains LLM-generated content or custom text.

**Features:**
- Multi-line text editing
- Fully customizable content
- Markdown-style formatting in display

**Example:**
```json
{
  "id": "executive-summary",
  "type": "section",
  "title": "Executive Summary",
  "content": "The cohort showed strong progress...",
  "order": 0
}
```

---

### 2. 💬 Comments Blocks

**Type:** `comments`  
**Editable:** ✅ Yes  
**Use case:** Instructor feedback, team observations

Special formatted blocks for instructor comments with visual distinction (yellow highlighting).

**Features:**
- Same editing capabilities as sections
- Styled with yellow background
- Border accent for visibility
- Separate blocks for each role:
  - **Program Expert Feedback** - Comments from program expert
  - **Teaching Assistants Feedback** - Comments from teaching assistants
  - **Learning Support Feedback** - Comments from learning support
- Each block only appears if the corresponding comment field is filled
- Can be independently reordered in the report constructor

**Examples:**
```json
{
  "id": "program-expert-comments",
  "type": "comments",
  "title": "Program Expert Feedback",
  "content": "Student showed great initiative and problem-solving skills...",
  "order": 0
}
```

```json
{
  "id": "teaching-assistants-comments",
  "type": "comments",
  "title": "Teaching Assistants Feedback",
  "content": "Active participation in discussions and peer collaboration...",
  "order": 1
}
```

```json
{
  "id": "learning-support-comments",
  "type": "comments",
  "title": "Learning Support Feedback",
  "content": "Regularly attended office hours and sought help when needed...",
  "order": 2
}
```

---

### 3. 📊 Table Blocks

**Type:** `table`  
**Editable:** ❌ Read-only  
**Use case:** Performance data, metrics, rankings

Data tables displaying structured information from reports.

**Features:**
- Automatically formatted columns
- Header names auto-capitalized
- Responsive scrolling for wide tables
- Data sourced from original report

**Manager Report Tables:**
- Top 10 Performers: name, completion %, success rate, segment

**Student Report Tables:**
- Performance Metrics: metric name, value
- Performance by Topic: topic, attempts, success rate, steps completed

**Example:**
```json
{
  "id": "top-performers",
  "type": "table",
  "title": "Top 10 Performers",
  "content": "",
  "data": [
    {
      "name": "John Smith",
      "total_pct": "95.2%",
      "success_rate": "87.5%",
      "segment": "Leader engaged"
    }
  ],
  "config": {
    "columns": ["name", "total_pct", "success_rate", "segment"]
  },
  "order": 4
}
```

---

### 4. 📈 Pie Chart Blocks

**Type:** `pie-chart`  
**Editable:** ❌ Read-only  
**Use case:** Distribution visualization, segment breakdown

Interactive pie charts showing categorical distributions.

**Features:**
- Color-coded segments
- Interactive tooltips with percentages
- Legend display
- Automatic percentage calculation

**Manager Report Charts:**
- Student Segmentation Distribution

**Example:**
```json
{
  "id": "segment-distribution",
  "type": "pie-chart",
  "title": "Student Segmentation Distribution",
  "content": "",
  "data": {
    "Leader engaged": 8,
    "Balanced middle": 10,
    "Hardworking but struggling": 3,
    "Low engagement": 2
  },
  "config": {
    "chartType": "pie",
    "showLegend": true
  },
  "order": 3
}
```

**Rendering:**
- Uses Chart.js Pie component
- 7 predefined colors for segments
- Tooltips show value and percentage

---

### 5. 📉 Line Chart Blocks

**Type:** `line-chart`  
**Editable:** ❌ Read-only  
**Use case:** Time-series data, activity patterns

Line charts displaying temporal data or cumulative curves.

**Features:**
- Smooth curves with tension
- Filled area under line
- X and Y axis labels
- Interactive tooltips

**Student Report Charts:**
- Activity Pattern Over Time (cumulative activity curve)

**Example:**
```json
{
  "id": "activity-curve",
  "type": "line-chart",
  "title": "Your Activity Pattern Over Time",
  "content": "",
  "data": [
    { "x_norm": 0.0, "y_norm": 0.0 },
    { "x_norm": 0.25, "y_norm": 0.15 },
    { "x_norm": 0.50, "y_norm": 0.45 },
    { "x_norm": 0.75, "y_norm": 0.72 },
    { "x_norm": 1.0, "y_norm": 1.0 }
  ],
  "config": {
    "chartType": "line",
    "xField": "x_norm",
    "yField": "y_norm",
    "showLegend": false
  },
  "order": 4
}
```

**Rendering:**
- Uses Chart.js Line component
- Turquoise color scheme
- Axis labels: "Progress (%)" and "Cumulative Activity"

---

## Block Configuration

### Common Fields

All blocks have these fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier |
| `type` | BlockType | ✅ | One of 5 block types |
| `title` | string | ✅ | Block heading |
| `content` | string | ✅ | Text content (for section/comments) |
| `data` | any | ❌ | Data payload (for tables/charts) |
| `config` | object | ❌ | Type-specific configuration |
| `order` | number | ✅ | Display order (0-based) |

### Config Options

#### For Tables
```typescript
config: {
  columns: string[] // Column names to display
}
```

#### For Pie Charts
```typescript
config: {
  chartType: 'pie',
  showLegend: boolean // Default: true
}
```

#### For Line Charts
```typescript
config: {
  chartType: 'line',
  xField: string, // Data field for X axis
  yField: string, // Data field for Y axis
  showLegend: boolean // Default: false
}
```

---

## Editing Blocks

### In Report Builder

**Section & Comments Blocks:**
- Click title to rename
- Edit content in textarea
- Full control over text

**Table Blocks:**
- Title editable
- Data is read-only
- Note displayed: "Table data cannot be edited directly"

**Chart Blocks:**
- Title editable
- Data and visualization read-only
- Sourced from original report

### Reordering

All block types can be reordered:
1. **Drag-and-drop**: Grab the `⋮⋮` handle
2. **Arrow buttons**: Use ↑ ↓ for precise positioning

Block badges show type for easy identification.

---

## Data Sources

### Manager Reports

| Block Type | Data Source |
|------------|-------------|
| Team Comments | `reports.comment_*` fields |
| Segment Chart | `performance_data.simple_segment` aggregation |
| Top Performers Table | `performance_data` sorted by `total_pct` |

### Student Reports

| Block Type | Data Source |
|------------|-------------|
| Instructor Comments | `student_comments` table |
| Performance Metrics Table | Student's `performance_data` record |
| Activity Curve Chart | `dynamic_series` filtered by user_id |
| Topic Performance Table | `submissions_data` aggregated by topic |

---

## Technical Details

### Type Definitions

```typescript
export type BlockType = 'section' | 'table' | 'pie-chart' | 'line-chart' | 'comments';

export interface ReportBlock {
  id: string;
  type: BlockType;
  title: string;
  content: string;
  data?: any;
  config?: {
    columns?: string[];
    chartType?: 'pie' | 'line';
    xField?: string;
    yField?: string;
    showLegend?: boolean;
    [key: string]: any;
  };
  order: number;
}
```

### Rendering Components

**Edit Mode:** `BlockRenderer.tsx`
- Handles all 5 block types
- Provides editing interface for editable blocks
- Shows read-only message for data blocks

**View Mode:** `BlockViewer.tsx`
- Optimized for reading experience
- Interactive charts and tables
- Formatted comments with bold labels

### Chart Integration

Uses Chart.js with react-chartjs-2:
```typescript
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);
```

---

## Best Practices

### 1. Block Ordering

**Recommended order for Manager Reports:**
1. Comments (context first)
2. Executive Summary
3. Charts (visual overview)
4. Tables (detailed data)
5. Sections (analysis and recommendations)

**Recommended order for Student Reports:**
1. Journey & Strengths (positive start)
2. Charts & Tables (data visualization)
3. Feedback & Growth (constructive feedback)
4. Next Steps (action items)

### 2. Editing Tips

- Edit text blocks to add context or clarification
- Rename blocks to match your audience
- Remove blocks that aren't relevant
- Keep charts and tables near related text

### 3. Performance

- Charts render client-side with Canvas
- Large tables may cause scrolling on mobile
- Recommend max 10-15 blocks per report

---

## Limitations

### Current Limitations

1. **Table data is immutable**: Cannot edit cell values
2. **Chart data is immutable**: Cannot modify data points
3. **No custom chart types**: Limited to pie and line
4. **No block deletion**: Can only reorder existing blocks
5. **No block addition**: Cannot add new data blocks

### Workarounds

- Create multiple shared reports from one source
- Edit titles and surrounding text for context
- Hide blocks by moving them to the end
- Use description field for additional notes

---

## Future Enhancements

Potential additions:
- ✨ Custom block creation
- 📊 Bar charts and scatter plots
- 🎨 Chart color customization
- ✏️ Inline table editing
- 🗑️ Block deletion
- ➕ Add new blocks from library
- 🖼️ Image and media blocks
- 📝 Rich text editor for sections

---

**Last Updated:** 2025-10-08  
**Version:** 2.0
