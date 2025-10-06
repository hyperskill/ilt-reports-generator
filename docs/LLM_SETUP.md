# LLM Reports Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install the `openai` package (v4.77.0) and other dependencies.

### 2. Get LiteLLM API Key

The application uses Hyperskill's internal LiteLLM proxy instead of direct OpenAI access.

You should already have:
- API Key (starts with `sk-`)
- Base URL: `https://litellm.aks-hs-prod.int.hyperskill.org`

### 3. Configure Environment Variables

Create or update your `.env.local` file:

```bash
# Copy from example
cp env.example .env.local

# Edit .env.local and add your keys
LITELLM_API_KEY=sk-your-actual-key-here
LITELLM_BASE_URL=https://litellm.aks-hs-prod.int.hyperskill.org
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Run Database Migration

Execute the SQL migration in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open `supabase/add-llm-reports.sql`
4. Copy and paste the entire content
5. Click "Run"

This creates:
- `manager_reports` table
- `student_reports` table
- RLS policies
- Indexes and triggers

### 5. Verify Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Login as an admin user

3. Create or open a saved report

4. You should see an "AI-Generated Reports" card with two buttons:
   - 🤖 Generate Manager Report
   - 📝 Generate Student Reports

## Usage

### Generate Manager Report

1. Navigate to any saved report (`/reports/[id]`)
2. Click "🤖 Generate Manager Report"
3. Wait for AI generation (10-30 seconds)
4. Review the generated content at `/reports/[id]/manager-report`
5. Edit sections as needed
6. Save your changes
7. Publish when ready

### Generate Student Reports

1. Navigate to any saved report (`/reports/[id]`)
2. Click "📝 Generate Student Reports"
3. View student list at `/reports/[id]/student-reports`
4. Option A: Click "Generate All" to process all students
5. Option B: Click "Generate" for individual students
6. Edit each report at `/reports/[id]/student-reports/[userId]`
7. Save and publish

## Troubleshooting

### "Unauthorized" Error
- Ensure you're logged in as an admin
- Check your admin status in `/profile`
- Verify RLS policies in Supabase

### "Failed to generate report"
- Check `LITELLM_API_KEY` in `.env.local`
- Verify `LITELLM_BASE_URL` is set correctly
- Check browser console for detailed error messages
- Check server logs (`npm run dev` terminal)
- Verify you have access to the internal Hyperskill network

### Reports not appearing
- Run the database migration (`supabase/add-llm-reports.sql`)
- Verify tables exist in Supabase dashboard
- Check RLS policies are enabled

### "Module not found: Can't resolve 'openai'"
- Run `npm install` to install dependencies
- Restart development server

## Cost Estimates

Using GPT-4o (default model):

| Action | Approximate Cost |
|--------|------------------|
| Generate Manager Report | $0.01 - $0.05 |
| Generate Student Report | $0.01 - $0.03 |
| Batch: 20 Students | $0.20 - $0.60 |
| Batch: 50 Students | $0.50 - $1.50 |

**Note**: Costs vary based on:
- Amount of data (comments, performance metrics)
- Response length
- Current OpenAI pricing

Reports are cached in the database, so regeneration is optional.

## Best Practices

1. **Fill Comments First**: Add team and student comments before generating for richer AI analysis
2. **Review Before Publishing**: Always review and edit AI content
3. **Use Regenerate Sparingly**: Each regeneration costs API credits
4. **Test with One Student**: Generate for one student first to verify prompts
5. **Save Regularly**: Save your edits to avoid losing work

## Security Notes

- API key is server-side only (not exposed to client)
- Only admins can generate reports
- Students can only view their own published reports
- Managers can view all published reports
- Draft reports are admin-only

## Support

For issues or questions:
- Check `docs/llm-reports-feature.md` for detailed documentation
- Contact Hyperskill DevOps for LiteLLM access issues
- Check Supabase RLS policies in dashboard

