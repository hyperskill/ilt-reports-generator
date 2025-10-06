# AI-Generated Reports Feature

## Overview

The LLM Reports feature enables admins to generate comprehensive, AI-powered summaries of team and individual student performance. These reports use OpenAI's GPT-4 to analyze student data and create human-friendly narratives suitable for managers and students.

## Features

### 1. Manager Reports
**Purpose**: Provide program managers with a high-level overview of team performance, dynamics, and outcomes.

**Sections**:
- **Executive Summary**: High-level overview of cohort performance and key achievements
- **Group Dynamics & Engagement**: Analysis of team collaboration and activity patterns
- **Learning Outcomes & Projects**: Evaluation of student work and skill development
- **Expert Observations**: Synthesis of feedback from instructors and support staff
- **Opportunities & Recommendations**: Actionable suggestions for future cohorts

**Access**: 
- Admin generates from the report detail page (`/reports/[id]`)
- Click "🤖 Generate Manager Report" button
- Edit and publish at `/reports/[id]/manager-report`

### 2. Student Reports
**Purpose**: Provide individual students with personalized, encouraging feedback about their learning journey.

**Sections**:
- **Your Learning Journey**: Personal approach to learning and engagement patterns
- **Your Strengths & Achievements**: Specific areas of excellence and successful projects
- **Your Skills Development**: Technical progress and problem-solving growth
- **Feedback from Your Instructors**: Insights from teaching team (if available)
- **Opportunities for Growth**: Constructive areas for improvement
- **Next Steps & Recommendations**: Actionable suggestions for continued learning

**Access**:
- Admin generates from the report detail page
- Click "📝 Generate Student Reports" button
- Batch generate for all students or individually
- Edit and publish at `/reports/[id]/student-reports/[userId]`

## Workflow

### Manager Report Workflow
1. Navigate to a saved report (`/reports/[id]`)
2. Click "🤖 Generate Manager Report" button
3. System fetches all report data (performance, dynamics, comments)
4. OpenAI generates structured report content
5. Admin reviews and edits content at `/reports/[id]/manager-report`
6. Admin saves changes
7. Admin publishes report (makes it visible to managers)

### Student Report Workflow
1. Navigate to a saved report (`/reports/[id]`)
2. Click "📝 Generate Student Reports" button
3. View list of all students at `/reports/[id]/student-reports`
4. Generate for individual student or all students
5. System fetches student-specific data (performance, activity, feedback)
6. OpenAI generates personalized report
7. Admin reviews and edits at `/reports/[id]/student-reports/[userId]`
8. Admin saves changes
9. Admin publishes report (makes it visible to the student)

## Database Schema

### `manager_reports` Table
```sql
- id: uuid (primary key)
- report_id: uuid (foreign key to reports, unique)
- generated_content: jsonb (original AI-generated content)
- edited_content: jsonb (admin-edited version)
- is_published: boolean (visibility flag)
- created_at: timestamp
- updated_at: timestamp
- created_by: uuid (admin who generated)
```

### `student_reports` Table
```sql
- id: uuid (primary key)
- report_id: uuid (foreign key to reports)
- user_id: text (student identifier)
- generated_content: jsonb (original AI-generated content)
- edited_content: jsonb (admin-edited version)
- is_published: boolean (visibility flag)
- created_at: timestamp
- updated_at: timestamp
- created_by: uuid (admin who generated)
- unique(report_id, user_id)
```

## API Endpoints

### POST `/api/llm/generate-manager-report`
Generates a manager report for a given report ID.

**Request Body**:
```json
{
  "reportId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "report": { /* manager_report record */ },
  "content": { /* generated sections */ }
}
```

### POST `/api/llm/generate-student-report`
Generates a student report for a specific student in a report.

**Request Body**:
```json
{
  "reportId": "uuid",
  "userId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "report": { /* student_report record */ },
  "content": { /* generated sections */ }
}
```

## Environment Variables

Add to your `.env.local`:

```bash
LITELLM_API_KEY=sk-T7_jQMSloCTpbpv2F3mc_Q
LITELLM_BASE_URL=https://litellm.aks-hs-prod.int.hyperskill.org
```

The application uses Hyperskill's internal LiteLLM proxy instead of direct OpenAI access.

## Prompts

### Manager Report System Prompt
The manager report uses a comprehensive system prompt that instructs GPT-4 to:
- Act as an expert Learning Experience Designer
- Use friendly but professional tone
- Explain technical metrics in simple terms
- Structure output in 5 specific sections
- Return JSON-formatted content

### Student Report System Prompt
The student report uses a supportive system prompt that instructs GPT-4 to:
- Act as an expert Learning Coach
- Use warm, encouraging tone
- Speak directly to the student using their name
- Celebrate achievements while being constructive about growth areas
- Structure output in 6 specific sections
- Return JSON-formatted content

## Security & Permissions

### Admin-Only Generation
- Only users with `role = 'admin'` can generate reports
- API routes verify admin status before processing
- Non-admins cannot access edit pages

### Publishing Control
- Reports are **not published** by default (draft state)
- Admin must explicitly publish to make visible
- Published manager reports: visible to managers
- Published student reports: visible to the specific student and managers

### RLS Policies
Row-Level Security policies ensure:
- Students can only see their own published reports
- Managers can see all published reports
- Admins can see and manage all reports (published or draft)

## Integration with Existing Features

### Student Detail Page
When viewing a student report from a saved report, admins see a link to "📝 Edit AI Report" at the top of the page. This provides quick access to the AI-generated summary.

### Report Detail Page
Two new buttons appear in the "AI-Generated Reports" section:
- "🤖 Generate Manager Report"
- "📝 Generate Student Reports"

## Cost Considerations

- Each manager report: ~1 API call using GPT-4
- Each student report: ~1 API call per student using GPT-4
- Average cost per call: $0.01 - $0.05 (varies by data size)
- Batch generation for 20 students: ~$0.20 - $1.00
- Content is cached in database (regeneration optional)

## Tips for Best Results

1. **Complete Team Comments**: Fill out all three comment fields (Program Expert, Teaching Assistants, Learning Support) before generating manager reports
2. **Add Student Feedback**: Include individual student comments for richer personalized reports
3. **Review Before Publishing**: Always review AI-generated content for accuracy
4. **Edit for Context**: Add specific examples or context that AI might not capture
5. **Regenerate When Needed**: If you update comments, regenerate to incorporate new information

## Future Enhancements

Potential improvements:
- Email delivery of published reports
- PDF export functionality
- Customizable report templates
- Multi-language support
- Historical report comparison
- Student self-reflection integration

