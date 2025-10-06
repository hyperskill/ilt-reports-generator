# AI Reports - User Guide

## What are AI-Generated Reports?

AI-Generated Reports use artificial intelligence (OpenAI GPT-4) to automatically create comprehensive, easy-to-read summaries of student and team performance. Instead of manually writing reports from raw data, admins can generate professional reports in seconds.

## Two Types of Reports

### 1. Manager Reports
**For**: Program managers, stakeholders, leadership  
**Purpose**: High-level overview of team performance

**Sections**:
1. **Executive Summary**: Quick snapshot of overall performance
2. **Group Dynamics & Engagement**: How the team worked together
3. **Learning Outcomes & Projects**: Quality of work and skills developed
4. **Expert Observations**: What instructors and support team noticed
5. **Opportunities & Recommendations**: What to improve for next time

**Best for**: End-of-program reviews, stakeholder updates, program evaluation

---

### 2. Student Reports
**For**: Individual students  
**Purpose**: Personalized feedback and encouragement

**Sections**:
1. **Your Learning Journey**: Your unique approach and engagement
2. **Your Strengths & Achievements**: What you did well
3. **Your Skills Development**: Technical progress you made
4. **Feedback from Your Instructors**: What your teachers observed
5. **Opportunities for Growth**: Areas to improve (constructive)
6. **Next Steps & Recommendations**: What to do next

**Best for**: Student portfolios, course completion certificates, one-on-one meetings

---

## How to Use

### Step 1: Generate Reports

#### Manager Report
1. Open a saved report (e.g., `/reports/abc-123`)
2. Scroll to "AI-Generated Reports" section
3. Click **"🤖 Generate Manager Report"**
4. Wait 10-30 seconds (AI is working!)
5. You'll be redirected to the edit page

#### Student Reports
1. Open a saved report
2. Scroll to "AI-Generated Reports" section
3. Click **"📝 Generate Student Reports"**
4. You'll see a list of all students
5. Choose one of these options:
   - **Generate All**: Create reports for all students at once
   - **Generate** (individual): Create one report at a time

---

### Step 2: Review & Edit

1. AI generates a draft based on your data
2. Review each section carefully
3. Edit any section to:
   - Add specific examples
   - Adjust tone
   - Include context AI doesn't know
   - Fix any inaccuracies
4. Click **"💾 Save"** to save your edits

💡 **Tip**: AI is smart but not perfect. Always review before publishing!

---

### Step 3: Publish

1. After reviewing and editing
2. Click **"📤 Publish"**
3. Confirm you want to publish
4. Report becomes visible to intended audience:
   - **Manager reports**: Visible to managers
   - **Student reports**: Visible to that specific student

⚠️ **Important**: Once published, the report is live. Make sure you're happy with it first!

---

## What Data Does AI Use?

### For Manager Reports:
- Team performance metrics (grades, submissions, engagement)
- Team activity patterns (consistency, effort, collaboration)
- Comments from Program Expert
- Comments from Teaching Assistants
- Comments from Learning Support
- Individual student feedback (if available)

### For Student Reports:
- Individual performance metrics
- Activity timeline and patterns
- Topic-level progress
- Instructor comments about that student
- Comparison to course averages (not shown to student)

---

## Tips for Best Results

### ✅ DO:
- **Fill out team comments** before generating manager reports
- **Add student feedback** before generating student reports
- **Review carefully** - AI can miss context
- **Edit for accuracy** - Add specific examples
- **Use regenerate** if you update comments significantly

### ❌ DON'T:
- Publish without reviewing
- Regenerate unnecessarily (costs API credits)
- Share draft links (only published reports are meant for sharing)
- Expect AI to know context outside the data

---

## Understanding Report Status

### Draft (Yellow Badge)
- Report is generated but not published
- Only visible to admins
- Can be edited freely
- Students/managers cannot see it

### Published (Green Badge)
- Report is live and visible to audience
- Students/managers can see it
- Can still be edited by admins
- Changes save immediately

### Edited (Blue Badge)
- Admin has made changes after AI generation
- Helps you track which reports you've reviewed

---

## Common Questions

### Q: Can I edit a published report?
**A**: Yes! Admins can always edit. Changes save immediately.

### Q: How long does generation take?
**A**: Usually 10-30 seconds per report. Batch generation (all students) can take 5-10 minutes for 20 students.

### Q: What if the AI gets something wrong?
**A**: Just edit that section! You have full control over the final content.

### Q: Can I regenerate a report?
**A**: Yes! Click "🔄 Regenerate" on the edit page. This creates a new draft from current data.

### Q: Will students see all the metrics?
**A**: No. Student reports are written in encouraging, plain language. Technical metrics are translated into friendly feedback.

### Q: How much does this cost?
**A**: ~$0.01-$0.05 per report. A batch of 20 students costs about $0.20-$1.00.

---

## Workflow Example

### Manager Report Workflow
1. Finish creating a base report with team comments
2. Generate manager report
3. Review Executive Summary - looks good!
4. Edit "Expert Observations" to add specific project example
5. Edit "Opportunities" to mention specific tool to try next time
6. Save changes
7. Publish report
8. Share link with program manager

### Student Report Workflow
1. Finish creating base report
2. Add individual comments for 3 students who stood out
3. Generate all student reports (batch)
4. Open first student's report
5. Review "Learning Journey" - perfect!
6. Edit "Strengths" to mention their excellent final project
7. Edit "Next Steps" to recommend specific resource
8. Save and publish
9. Repeat for remaining students
10. Share links with students via email

---

## Troubleshooting

### "Unauthorized" error
→ Make sure you're logged in as an admin

### Generation takes very long
→ Normal for batch jobs. Don't refresh the page!

### Report seems generic
→ Add more team/student comments before generating. AI needs rich data.

### Want different tone/style
→ Just edit the sections! You have full control.

### Need to unpublish
→ Currently not supported. Edit the published report instead.

---

## Need Help?

- See technical docs: `docs/llm-reports-feature.md`
- See setup guide: `docs/LLM_SETUP.md`
- Check your admin status: `/profile`
- Contact support if issues persist

