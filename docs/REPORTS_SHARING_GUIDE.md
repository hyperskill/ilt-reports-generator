# 📤 Reports Sharing Feature - User Guide

## Overview

The Reports Sharing feature allows admins to create customizable, shareable versions of LLM-generated reports with:
- **Block reordering**: Drag-and-drop to customize content order
- **Content editing**: Edit block titles and content
- **Access control**: Grant specific users access or make reports public
- **Multiple versions**: Create multiple shared reports from one source

---

## Quick Start

### 1. Access Shared Reports Management

1. Navigate to any saved report (e.g., `http://localhost:3000/reports/[report-id]`)
2. Click the **"📤 Manage Shared Reports"** button (admin only)
3. You'll see the Shared Reports management page

### 2. Prerequisites Check

The interface is now split into two clear sections:

#### 📊 Manager Report Prerequisites
- **Expert Comments**: Add comments from Program Expert, Teaching Assistants, and Learning Support
  - Click "Add Comments" to open a popup with three comment fields
- **Manager LLM Report**: Generate AI-powered manager report
  - Click "Generate Report" to create the LLM report

#### 👤 Student Report Prerequisites  
- **Student Expert Comments**: Add individual comments for each student
  - Expand "👥 View Individual Student Reports" accordion
  - Click individual student buttons to go to their personal report page
  - Add/edit expert comments on the student's personal report page
- **Student LLM Reports**: Generate AI-powered reports for students
  - Click "Generate Reports" to go to student reports page

### 3. Create a Shared Report

1. Click **"➕ Create New Shared Report"**
2. Select report type (Manager or Student)
3. For student reports, select the specific student
4. Enter title and optional description
5. Click **"Create & Edit"**

You'll be taken to the Report Builder.

### 4. Edit Blocks in Report Builder

**Reorder blocks:**
- Drag any block by the `⋮⋮` handle
- Or use the ↑ ↓ buttons for precise positioning

**Edit content:**
- Click block title to rename it
- Edit text in the content area
- Changes save when you click **"Save Changes"**

**Manage visibility:**
- Click **"Make Public"** to allow anyone with the link to view
- Click **"Make Private"** to restrict access to specific users only

### 3. Grant Access to Users

1. From the Report Builder, click **"Manage Access"**
2. Enter a user's email address
3. Click **"Grant Access"**

The user will now be able to view the report.

**To revoke access:**
- Go to the Access Management page
- Click **"Revoke"** next to any user

### 4. View the Report

- Click **"Preview"** to see how the report looks
- Share the URL: `/reports/shared/[report-id]/view`
- Recipients can read the report with blocks in your custom order

---

## Pages Overview

### Report Builder (`/reports/shared/[id]/edit`)

The visual constructor for editing reports:

**Block Management:**
- **Add Existing Blocks**: Click "➕ Add Block" to open a dialog where you can:
  - Select from a dropdown list of blocks **not yet on the page**
  - See block titles with their type icons (📝 📊 📈 📉 💬)
  - See count of available blocks (e.g., "Available Blocks (5)")
  - Add the selected block to the **top** of your report
  - **Edits are preserved**: If you edit and save a block, then delete and re-add it, your edits will be kept
  - Changes are **saved automatically** after adding (no popups)
  - Button is disabled when all blocks are already added
- **Delete Blocks**: Click 🗑️ button on any block
  - Confirmation dialog appears before deletion
  - Changes are **saved automatically** after deleting
- **Drag-and-drop**: Reorder blocks by dragging
- **Move Up/Down**: Use ↑ ↓ buttons for precise positioning
- **Note**: Reordering blocks requires manual save using "Save All Changes"

**Editing:**
- **Inline editing**: Click titles to rename, edit content in text areas
- **Individual Save**: Click 💾 button to save a single block's changes
- **Save All**: Click "Save All Changes" to save entire report
- **Unsaved Indicator**: "Unsaved" badge shows on edited blocks
- **Change Counter**: Footer shows total number of unsaved changes

**Report Settings:**
- **Metadata**: Update report title and description
- **Public toggle**: Make report public or private
- **Navigation**: Links to preview and access management

### View Page (`/reports/shared/[id]/view`)

Clean reading experience:

- Displays blocks in configured order
- Shows access status badges
- Edit button for authorized users
- Responsive and distraction-free

### Access Management (`/reports/shared/[id]/access`)

Control who can view the report:

- **Grant access**: Add users by email
- **View access list**: See all users with access
- **Revoke access**: Remove users
- **Access details**: See role, grant date

### Reports List (`/reports/shared/`)

Overview of all shared reports:

- Table with title, type, status, and access count
- Quick links to view and edit
- Filter by type (Manager/Student)
- Status badges (Public/Private)

---

## Block Structure

### Block Types

Shared reports support multiple types of content blocks:

#### 📝 Section Blocks
Standard text content blocks with LLM-generated or custom text. Fully editable.

#### 💬 Comments Blocks
Special formatted blocks for team/instructor feedback. Displayed with yellow highlighting.

#### 📊 Table Blocks
Data tables showing:
- **Manager Reports**: Top performers, performance metrics
- **Student Reports**: Performance metrics, topic performance

Tables are read-only and sourced from the original report data.

#### 📈 Pie Chart Blocks
Visual representations of distributions:
- **Manager Reports**: Student segmentation distribution
- Shows percentages and counts with interactive tooltips

#### 📉 Line Chart Blocks
Time-series visualizations:
- **Student Reports**: Activity patterns over time
- Displays cumulative activity curves

### Manager Report Blocks

When created, manager reports include comprehensive analytics:

1. **Executive Summary** (`section`) - High-level overview from LLM

**Segmentation Analysis:**
2. **Student Segmentation Distribution** (`pie-chart`) - Visual breakdown by segment
3. **Segmentation Statistics** (`table`) - Detailed stats per segment (count, %, avg completion)

4. **Group Dynamics & Engagement** (`section`) - Team patterns from LLM

**Activity Pattern Analysis:**
5. **Activity Pattern Distribution** (`pie-chart`) - Distribution of easing types (ease-in, ease-out, etc.)
6. **Activity Pattern Statistics** (`table`) - Stats per pattern (count, %, avg frontload index)

7. **Student Performance Overview** (`table`) - All students with complete metrics (name, completion, success rate, active days, meetings, segment)
8. **Learning Outcomes & Projects** (`section`) - Achievements from LLM
9. **Expert Observations** (`section`) - Instructor insights from LLM

**Team Feedback (shown only if filled):**
10. **Program Expert Feedback** (`comments`) - Feedback from program expert
11. **Teaching Assistants Feedback** (`comments`) - Feedback from teaching assistants
12. **Learning Support Feedback** (`comments`) - Feedback from learning support

13. **Opportunities & Recommendations** (`section`) - Next steps from LLM

### Student Report Blocks

When created, student reports include comprehensive personal analytics:

1. **Your Learning Journey** (`section`) - Overview of participation from LLM
2. **Your Strengths & Achievements** (`section`) - Success areas from LLM

**Performance Data (Single Row):**
3. **Your Performance Overview** (`table`) - One row with all key metrics:
   - Completion rate, success rate, submissions, correct submissions
   - Active days, active days ratio, meetings attended, segment

**Activity Pattern Data (Single Row):**
4. **Your Activity Pattern Metrics** (`table`) - One row with dynamic metrics:
   - Easing pattern, frontload index, quartiles (t25/t50/t75)
   - Consistency, burstiness

5. **Your Activity Pattern Over Time** (`line-chart`) - Cumulative activity curve visualization
6. **Your Skills Development** (`section`) - Technical progress from LLM
7. **Feedback from Your Instructors** (`section`) - Personal feedback from LLM

**Instructor Feedback (shown only if filled):**
8. **Program Expert Feedback** (`comments`) - Feedback from program expert
9. **Teaching Assistants Feedback** (`comments`) - Feedback from teaching assistants
10. **Learning Support Feedback** (`comments`) - Feedback from learning support

11. **Opportunities for Growth** (`section`) - Areas to improve from LLM
12. **Next Steps & Recommendations** (`section`) - Action items from LLM
13. **Performance by Topic** (`table`) - Topic-level breakdown (if available)

You can reorder all blocks to match your audience's priorities.

---

## Common Workflows

### Creating a Report for Managers

1. Generate Manager Report via LLM
2. Click "Share Report"
3. Reorder: Executive Summary first, Opportunities last
4. Make public or grant access to manager team
5. Share link

### Creating a Student Progress Report

1. Generate Student Report via LLM
2. Click "Share Report"
3. Reorder: Strengths first, Growth areas middle, Next Steps last
4. Grant access to student
5. Student views their personalized report

### Creating Multiple Versions

From one LLM report, you can create:
- Public summary (short, high-level blocks)
- Detailed manager version (all blocks)
- Student-facing version (reordered for motivation)

Each shared report is independent with its own access control.

---

## Permissions

### Admin Users Can:
- ✅ Create shared reports
- ✅ Edit any shared report
- ✅ Manage access for any report
- ✅ Delete shared reports
- ✅ View all shared reports

### Regular Users Can:
- ✅ View public reports
- ✅ View reports they have access to
- ❌ Cannot create or edit shared reports
- ❌ Cannot manage access

### Students Can:
- ✅ View reports shared with them
- ✅ View their own published LLM reports

---

## API Reference

For developers integrating with the system:

### Create Shared Report
```bash
POST /api/reports/shared/create
{
  "reportType": "manager" | "student",
  "sourceReportId": "uuid",
  "userId": "string" (for student reports),
  "title": "string",
  "description": "string"
}
```

### Update Report
```bash
PATCH /api/reports/shared/[id]
{
  "title": "string",
  "description": "string",
  "blocks": [{ id, type, title, content, order }],
  "is_public": boolean
}
```

### Grant Access
```bash
POST /api/reports/shared/[id]/access
{
  "userIds": ["uuid"],
  "expiresAt": "ISO date" (optional)
}
```

### Revoke Access
```bash
DELETE /api/reports/shared/[id]/access
{
  "userIds": ["uuid"]
}
```

---

## Database Schema

### `shared_reports` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `report_type` | TEXT | 'manager' or 'student' |
| `source_report_id` | UUID | Reference to original report |
| `user_id` | TEXT | For student reports |
| `title` | TEXT | Report title |
| `description` | TEXT | Optional description |
| `blocks` | JSONB | Array of content blocks |
| `is_public` | BOOLEAN | Public/private flag |
| `access_code` | TEXT | Optional sharing code |
| `created_by` | UUID | Creator user ID |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `report_access` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `shared_report_id` | UUID | Report reference |
| `user_id` | UUID | User with access |
| `granted_by` | UUID | Who granted access |
| `granted_at` | TIMESTAMPTZ | Grant timestamp |
| `expires_at` | TIMESTAMPTZ | Optional expiration |

---

## Tips & Best Practices

### 1. Order Matters
Put the most important information first. Consider your audience:
- **For managers**: Executive Summary → Opportunities
- **For students**: Strengths → Journey → Next Steps

### 2. Edit After Ordering
1. First, drag blocks into the right order
2. Then, edit content to flow naturally
3. Save frequently

### 3. Use Descriptive Titles
Rename blocks to match your context:
- "Executive Summary" → "Q1 2024 Results"
- "Next Steps" → "Action Plan for Next Sprint"

### 4. Public vs. Private
- **Public**: Good for general announcements, course summaries
- **Private**: Use for sensitive feedback, individual performance

### 5. Access Expiration
Set expiration dates for temporary access:
- Student reviewing grades before meeting
- Manager reviewing team report for presentation

---

## Troubleshooting

### "User not found" when granting access
- Verify the email address is correct
- User must have an account in the system
- Check spelling and case sensitivity

### Drag-and-drop not working
- Try using the ↑ ↓ buttons instead
- Refresh the page
- Check browser console for errors

### Can't see "Share Report" button
- You must be an admin
- The LLM report must be generated first
- Check your role in profile settings

### Changes not saving
- Check internet connection
- Look for error messages
- Try refreshing and re-editing

---

## Security Notes

### Access Control
- Access is checked on every view request
- Users without access receive 403 Forbidden
- RLS policies enforce database-level security

### Data Privacy
- Shared reports are copies, not references
- Original LLM reports remain unchanged
- Deleting a shared report doesn't affect the source

### Audit Trail
- All access grants are logged
- `granted_by` and `granted_at` tracked
- Future: view access logs

---

## Help System for Data Interpretation

### Overview
Every table and chart in shared reports includes a collapsible help section to guide viewers in understanding the data.

### Features
- **Accordion UI**: "ℹ️ How to read this data" button under each data block
- **HTML Formatting**: Rich content with headings, lists, and emphasis
- **User-Friendly Language**: Written for non-technical audiences
- **Contextual Guidance**: Explains what to look for and how to interpret results

### Content Design Principles
1. **Plain Language**: No jargon, conversational tone
2. **Practical Examples**: Real-world interpretations (e.g., "Students doing great" vs "High performers")
3. **Encouraging Tone**: Positive, supportive language
4. **Clear Structure**: Organized with headings and nested bullet points
5. **Streamlined Content**: No separate tip callouts, information integrated naturally

### Example Help Texts

**For Managers:**
- "This chart shows how your students are grouped based on their performance and engagement."
- "Students are sorted by completion rate - scroll down to see who might need a check-in!"

**For Students:**
- "Here's a quick snapshot of how you did in the course!"
- "These numbers help you see your strengths and where you can improve!"

### Technical Implementation
- `helpText` field in `ReportBlock` interface stores HTML content
- `HelpAccordion` component renders HTML using `dangerouslySetInnerHTML`
- Scoped CSS styles ensure proper formatting within accordions
- Consistent styling across edit and view modes

---

## Topic Links to Learning Platform

### Overview
Student shared reports can include clickable links to topics on the Cogniterra learning platform. This feature requires the `structure.csv` file to be uploaded with the source report.

### How It Works
1. **Data Collection**: When creating a shared student report, the system checks if the source report has `structure_data`
2. **Link Generation**: For topics with structure data, the system creates links in the format:
   ```
   https://cogniterra.org/lesson/{lesson_id}/step/1
   ```
3. **Display**: Topic names in the "Performance by Topic" table become clickable links
4. **Fallback**: If no structure data is available, topics display as plain text

### User Experience
- **With structure data**: Topic names appear as blue, underlined links
- **Hover effect**: Links fade slightly when hovered over
- **Click behavior**: Links open in a new tab
- **Without structure data**: Topics appear as regular text (no broken links or errors)

### Visual Indicators
- 🔗 Topics with links: Styled as clickable links (blue, underlined)
- Regular topics: Display as plain text

### Technical Details
- Works automatically if source report has structure data
- No additional configuration needed
- No breaking changes to existing shared reports
- Links are visible in both edit and view modes
- Consistent with topic links in regular student reports

---

## Future Enhancements

Planned features (not yet implemented):
- 📧 Email notifications when access granted
- 📄 Export reports as PDF
- 📊 Analytics: view counts, time on page
- 🔗 Public links with access codes
- 📝 Rich text editor for content
- 🕒 Version history for blocks
- 👥 Bulk access management (CSV import)

---

## Support

For issues or questions:
1. Check this guide first
2. Review `app-creation-log.md` for technical details
3. Check browser console for errors
4. Contact admin team

---

**Last Updated:** 2025-10-08  
**Version:** 1.7 (Fixed student comments status logic + accordion interface)
