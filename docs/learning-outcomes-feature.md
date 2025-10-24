# Learning Outcomes Feature Guide

## Overview

The Learning Outcomes feature allows administrators to generate and manage AI-powered learning outcomes for each module in a course. This feature is integrated into the "Preview and Setup" section of the report management interface.

**Key Feature**: The course structure is built from `structure_data` (uploaded CSV) enhanced with real names from Cogniterra API. This matches the approach used in other parts of the application (module analytics, student reports).

## Features

### 1. Report Metadata Management
- Edit report title inline
- Edit report description inline
- Changes are reflected immediately in the UI

### 2. Automated Course Structure Retrieval
- Automatically fetches course structure from Cogniterra API
- Displays modules with their topics and step counts
- Hierarchical view: Course → Modules → Topics → Steps

### 3. AI-Powered Learning Outcomes Generation
- One-click generation per module
- Context-aware: LLM receives full course structure for better alignment
- Generates 3-5 learning outcomes per module
- Based on educational best practices (Bloom's taxonomy)
- Action-oriented and measurable outcomes

### 4. Outcomes Management
- View generated outcomes for each module
- Edit and refine outcomes inline
- Automatic saving to database
- Persistent storage linked to reports

## User Guide

### Accessing the Feature

1. Navigate to **Reports** → Select a report
2. Go to the **"Preview and Setup"** tab
3. Click on **"⚙️ General Report Settings"** card
4. Click **"Manage Settings"** button
5. You'll be taken to the dedicated settings page

### Generating Learning Outcomes

#### Automatic Structure Loading:
1. If you uploaded a structure CSV file when creating the report, the course structure loads automatically
2. Module IDs and Lesson IDs are extracted from the structure data
3. Real names are fetched from Cogniterra API
4. You'll see a list of modules with their topics and step counts

#### For each module:
1. You'll see:
   - Module title and position
   - List of topics covered (up to 5 displayed)
   - Number of steps per topic
2. Click **"✨ Generate Learning Outcomes"** button for a module
3. Wait for AI generation (usually 5-10 seconds)
4. Outcomes are displayed and automatically saved

### Editing Learning Outcomes

1. Click **"✏️ Edit"** button next to the outcomes
2. Modify the text in the editor
3. Click **"Save Changes"** to update the database
4. Click **"Cancel"** to discard changes

### Deleting Learning Outcomes

1. Click **"🗑️ Delete"** button next to the outcomes
2. Confirm deletion in the confirmation dialog
3. Outcomes are immediately removed from database and UI
4. To regenerate, click **"✨ Generate Learning Outcomes"** button again

## API Endpoints

### Build Course Structure
```
POST /api/cogniterra/course-structure
Body: { structureData: any[] }
```
Builds hierarchical course structure from structure_data with real module and topic names from Cogniterra API.

### Generate Learning Outcomes
```
POST /api/llm/generate-learning-outcomes
Body: { courseStructure, moduleId, moduleTitle, topics }
```
Uses LLM to generate learning outcomes for a specific module.

### Manage Learning Outcomes
```
GET /api/reports/learning-outcomes?reportId={id}
POST /api/reports/learning-outcomes
DELETE /api/reports/learning-outcomes?reportId={id}&moduleId={id}
```
CRUD operations for learning outcomes.

## Database Schema

### `learning_outcomes` table
- `id` (uuid) - Primary key
- `report_id` (uuid) - Foreign key to reports table
- `module_id` (integer) - Cogniterra module ID
- `module_title` (text) - Module name
- `outcomes` (text) - Generated learning outcomes (markdown)
- `created_by` (uuid) - User who created/modified
- `created_at` (timestamp)
- `updated_at` (timestamp)
- **Unique constraint**: (report_id, module_id)

## Security

- **Row Level Security (RLS)** enabled
- **Admins**: Full CRUD access
- **Managers**: Read-only access
- **Students**: No access
- All operations require authentication

## Technical Architecture

### Components
- `GeneralReportSettings.tsx` - Main UI component
- `GeneralReportSettings.module.css` - Component styling

### API Routes
- `api/cogniterra/course-structure/route.ts` - Cogniterra integration
- `api/llm/generate-learning-outcomes/route.ts` - LLM generation
- `api/reports/learning-outcomes/route.ts` - CRUD operations

### Types
- `CourseModule` - Module structure with topics
- `CourseTopic` - Topic details
- `LearningOutcome` - Outcome data model

## Configuration

Required environment variables in `.env.local`:

```bash
# Cogniterra API (for fetching module/lesson names)
COGNITERRA_API_URL=https://cogniterra.org
COGNITERRA_CLIENT_ID=your_client_id
COGNITERRA_CLIENT_SECRET=your_client_secret

# LiteLLM API (for AI generation)
LITELLM_BASE_URL=your_litellm_base_url_here
LITELLM_API_KEY=your_litellm_api_key_here
LITELLM_MODEL=gpt-4o-mini (optional, this is default)
```

**Important**: 
- Use `LITELLM_BASE_URL` (not `LITELLM_API_URL`)
- Restart dev server after changing environment variables

## Future Enhancements

Potential improvements:
- Bulk generation for all modules
- Export learning outcomes to PDF
- Template library for common outcome patterns
- Integration with student reports
- Version history for outcomes
- Multi-language support
- Outcome alignment visualization

## Troubleshooting

### Course structure not loading
- Verify Cogniterra API credentials are configured (`COGNITERRA_API_URL`, `COGNITERRA_CLIENT_ID`, `COGNITERRA_CLIENT_SECRET`)
- Check that structure CSV was uploaded when creating the report
- Verify structure_data contains valid `module_id` and `lesson_id` fields
- Check browser console for detailed API errors

### No modules showing
- Ensure you uploaded a structure CSV file with your report
- Check that the structure CSV contains `module_id` (or `moduleid`) columns
- Verify the structure data is not empty

### LLM generation fails
- Verify LiteLLM configuration is correct
- Check API key has sufficient quota
- Review LiteLLM logs for detailed errors
- Ensure `LITELLM_API_URL` and `LITELLM_API_KEY` are set

### Cannot save outcomes
- Ensure user has admin role
- Verify database connection
- Check that learning_outcomes table exists (run migration SQL)
- Review browser console for API errors

## Support

For issues or questions:
1. Check the `app-creation-log.md` for implementation details
2. Review API endpoint responses in browser DevTools
3. Contact the development team

