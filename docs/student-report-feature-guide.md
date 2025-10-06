# Student Personal Report Feature Guide

## Overview
The Student Personal Report feature provides comprehensive, actionable insights for individual learners. Each report is automatically generated from existing course data and presents information in student-friendly language.

## Accessing Student Reports

### From Results Tables
1. Navigate to **Results** page after processing your data
2. Click on any **student's name** (underlined, highlighted on hover) in either:
   - **Performance Analysis** tab
   - **Activity Analysis** tab
3. You will be redirected to the student's personal report page at `/student/[userId]`

## Report Structure

### 1. Header Section
- **Student Name** and User ID
- **Segment Badge**: Performance category (Leader, Balanced, etc.)
- **Activity Pattern Badge**: Easing label (linear, ease-in, ease-out, etc.)
- **Key Metrics**: Score percentage and success rate

### 2. Progress Highlights (3-5 items)
- **Green boxes (✅)**: Wins and strengths
  - High scores, consistency, steady work patterns
  - Comfortable topics with good first-pass rates
- **Orange boxes (🎯)**: Focus areas
  - Topics needing attention
  - Consistency or momentum concerns
  - Specific areas for improvement

**Note**: Highlights always start with wins before showing focus areas.

### 3. Recent Activity Momentum
- **Trend indicator**: 📈 Up, 📉 Down, or ➡️ Flat
- **Explanation**: Compares last 7 days vs previous 7 days
- **Only shown** if student has ≥14 days of data

### 4. Activity Over Time Curve
- **Frontload Index**: Positive = early effort, Negative = late effort
- **Consistency**: Percentage of active days over total period
- **Burstiness**: How variable the work pattern is (low = steady, high = sporadic)
- **Progress Points**: When 25%, 50%, and 75% of work was completed
- **Interactive Chart**: Visual representation of cumulative activity
- **Plain-English Explanation**: What the pattern means and suggestions

### 5. Topics Grid

#### Going Well (Green)
- Topics where student performed above average
- Characteristics:
  - High first-pass success rate (≥70%)
  - Low attempts per step
  - Labeled as "Comfortable"

#### Focus Areas (Orange)
- Topics needing review or additional practice
- Includes reason tags:
  - "extra attempts needed"
  - "first-pass rate below average"
  - "extra attempts + low first-pass rate"
- May include "low evidence" note if < 2 steps attempted

### 6. Suggested Next Steps (2-3 items)
Prioritized, actionable suggestions:
1. **Topic-specific**: Review focus topic, starting with difficult steps
2. **Momentum-building**: Plan short sessions if activity decreased
3. **Engagement**: Join webinars if attendance is low
4. **Maintenance**: Keep steady rhythm (if already doing well)

**Language**: Supportive and actionable ("review", "plan", "try"), never blaming.

### 7. Detailed Statistics

#### Performance Metrics
- Submissions count
- Unique steps attempted
- Persistence (attempts per step)
- Efficiency (correct per step)
- Active days and ratio
- Effort Index (vs. course average)

#### Meeting Attendance (if available)
- Number of meetings attended
- Attendance rate percentage

### 8. Topic Analysis Table
Comprehensive breakdown of all topics:

**Columns**:
- **Topic**: Synthesized topic name (e.g., "Topic 1", "Topic 2")
- **Label**: Badge showing Comfortable / Watch / Attention
- **Steps**: Number of steps attempted
- **Attempts/Step**: Average with delta from course average in parentheses
- **First-Pass Rate**: Percentage with delta in parentheses
- **Score**: Internal metric (higher = more attention needed)

**Color Coding**:
- 🟢 **Green (Comfortable)**: Handling well
- 🟠 **Orange (Watch)**: Needs some attention
- 🔴 **Red (Attention)**: Requires focused review

**Delta Indicators**:
- `(+2.1)` means 2.1 above course average
- `(-15%)` means 15% below course average

## How Topics Are Generated

Since course structure may not always be available, topics are **synthesized** from step-level data:
- Every 10 steps = 1 topic (e.g., steps 0-9 = Topic 1, steps 10-19 = Topic 2)
- Metrics calculated per-topic and compared to course averages
- Labels assigned based on performance relative to peers

## Signal Extraction Logic

### Wins (Positive Signals)
Automatically detected when:
- Score ≥ 80% OR success rate ≥ 85%
- Consistency index ≥ 0.5
- Burstiness ≤ 0.6 (steady work)
- Frontload index ≥ 0.10 (early progress)
- Topics with first-pass rate ≥ 70%

### Focus (Attention Signals)
Automatically detected when:
- Topics labeled Watch or Attention
- Struggle index ≥ 0.6
- Active days ratio < 30%
- Momentum down ≥ 15%
- Easing patterns suggest risk:
  - ease-in with t25 > 0.4 (late start)
  - ease-out with t75 < 0.6 and momentum down (dropoff)

## Edge Cases & Graceful Degradation

### Missing Meetings Data
- Meeting-related sections hidden
- No meeting-based suggestions generated
- Segmentation still works without meetings

### Sparse Submission Data
- Curve and momentum hidden if < 14 days
- Generic encouragement message shown
- Focus on available signals

### No Topic Structure
- Synthetic topics still generated from steps
- Fallback to "Topic X" naming
- All logic remains functional

### Short Time Span (≤7 days)
- Momentum calculation skipped
- "Getting started" nudge used instead
- Focus on immediate next steps

## Best Practices

### For Instructors
1. **Use as conversation starters**: Reports highlight areas for 1-on-1 discussions
2. **Group similar patterns**: Identify students with similar focus areas for group interventions
3. **Monitor momentum**: Check students with downward trends regularly
4. **Celebrate wins**: Acknowledge students with strong patterns

### For Students
1. **Start with wins**: Recognize your strengths first
2. **Pick one focus area**: Don't try to fix everything at once
3. **Follow suggested steps**: They're prioritized by impact
4. **Check regularly**: Monitor your momentum and adjust pace
5. **Ask for help**: Use focus topics as specific questions for instructors

## Privacy & Messaging

- **No precise ranks**: Uses "compared with the course" phrasing
- **No percentiles**: Avoids competitive framing
- **Supportive tone**: Always pairs focus with actionable steps
- **Transparent**: Every conclusion tied to specific metrics
- **Student-first**: Minimal numbers, maximum clarity

## Technical Notes

### Data Requirements
- **Required**: grade_book.csv, learners.csv, submissions.csv
- **Optional**: meetings.csv
- All activity derived from submissions (no separate activity file needed)

### Performance
- Reports generated on-demand (not cached)
- Fast generation (~50-100ms per student)
- Scales to hundreds of students

### Accessibility
- Color-blind friendly badges and indicators
- Plain English explanations
- Structured headings for screen readers
- High contrast text

## Troubleshooting

### "Student not found"
- Ensure student has submissions data
- Check that user_id matches across files
- Verify data was processed successfully

### No Topics Shown
- Student may have < 2 steps attempted on any topic
- Check submissions.csv for that user_id
- Ensure step_id column is present

### Momentum Shows "Unknown"
- Requires ≥14 days of submission data
- Check date range in submissions
- Verify timestamps are valid

### No Meetings Section
- meetings.csv was not uploaded or is empty
- This is normal and expected if meetings data unavailable

## Algorithm Reference
Based on: **Personal Student Report Algorithm v1**
- Signal extraction: §3 (Wins & Focus candidates)
- Momentum: §4 (Last 7 vs previous 7)
- Topic selection: §5 (Top 3 per list)
- Next steps: §6 (Priority order)
- Curve explanation: §7 (Easing patterns)
- Copy guidelines: §12 (Tone & structure)

