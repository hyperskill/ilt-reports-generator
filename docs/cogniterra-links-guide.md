# Cogniterra Links Integration Guide

## Overview

This feature adds clickable links to the Cogniterra platform for each topic in the student's Topic Analysis table. When a student or instructor views a personalized report, they can click on any topic name to navigate directly to that topic on Cogniterra.

## How It Works

### 1. Upload Structure Data (Optional)

Upload a `structure.csv` file during the upload phase. This file contains the mapping between steps and their location in the Cogniterra course structure.

**Required Columns:**
- `course_id` - The course identifier
- `module_id` - The module/unit identifier
- `lesson_id` - The lesson identifier
- `step_id` - The step identifier

**Example:**
```csv
course_id,module_id,lesson_id,step_id
678,6609,54109,203489
678,6609,54109,203490
678,6609,54111,203491
```

### 2. How Links Are Generated

1. During data processing, the system builds a map: `step_id` → `{lesson_id, unit_id, course_id}`
2. When generating topics, each topic stores structure data from its first step
3. In the UI, topics with complete structure data become clickable links
4. URL format: `https://cogniterra.org/lesson/{lesson_id}/step/{first_step_id}?unit={module_id}`

### 3. User Experience

**With structure.csv:**
- Topic names appear as blue underlined links
- Hovering shows opacity change
- Clicking opens the topic on Cogniterra in a new tab

**Without structure.csv:**
- Topic names display as regular bold text
- All other functionality works normally
- No error messages or missing features

## Example Usage

### Before (without structure.csv):
```
Topic 1    [Comfortable]
Topic 2    [Watch]
```

### After (with structure.csv):
```
Topic 1    [Comfortable]  ← clickable link to https://cogniterra.org/lesson/54109/step/203489?unit=6609
Topic 2    [Watch]        ← clickable link to https://cogniterra.org/lesson/54111/step/203491?unit=6609
```

## Technical Details

### File Validation
- `structure.csv` is **optional** - the app works without it
- Required columns: `step_id`, `lesson_id`
- Optional columns: `module_id`, `course_id`
- Column name aliases supported (e.g., `stepid`, `lessonid`)

### Data Flow
1. Upload phase: User uploads structure.csv (optional)
2. Processing phase: System creates `step_id` → URL components map
3. Report generation: Topics inherit structure from their first step
4. Rendering: UI conditionally renders links based on data availability

### Fallback Behavior
- Missing structure file: Topics display as plain text
- Incomplete structure data: Only topics with full data become links
- Invalid structure data: Ignored, no errors shown

## Benefits

- **Direct Navigation**: Students can click to review challenging topics immediately
- **Time Saving**: No need to search for topics manually on Cogniterra
- **Context Preservation**: Opens in new tab, keeping the report accessible
- **Optional Feature**: Works seamlessly with or without structure data

## Notes

- Links use `rel="noopener noreferrer"` for security
- New tabs prevent losing report progress
- Hover effects indicate interactive elements
- Structure data is loaded once and reused throughout the session

