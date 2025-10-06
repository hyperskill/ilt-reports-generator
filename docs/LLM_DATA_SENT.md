# 📤 Data Sent to LiteLLM

## General Information

When generating AI reports, the application sends processed data to the Hyperskill LiteLLM proxy. This document describes the exact composition of the data being sent.

---

## 🏢 Manager Report (Team Report)

### Data Structure

```json
{
  "reportTitle": "string",
  "reportDescription": "string", 
  "totalStudents": number,
  "teamComments": { ... },
  "performanceData": [ ... ],
  "dynamicData": [ ... ],
  "studentFeedback": [ ... ]
}
```

### 1. Report Metadata

| Field | Type | Description | Example |
|------|-----|----------|--------|
| `reportTitle` | string | Report name | "Python Course 2024-Q1" |
| `reportDescription` | string | Report description | "Final cohort results" |
| `totalStudents` | number | Number of students | 23 |

**Source:** `reports` table

---

### 2. Team Comments

| Field | Type | Description |
|------|-----|----------|
| `teamComments.programExpert` | string | Program expert comment |
| `teamComments.teachingAssistants` | string | Teaching assistants comment |
| `teamComments.learningSupport` | string | Learning support comment |

**Source:** `reports` table (`comment_*` fields)

**⚠️ Privacy:** May contain personal observations

---

### 3. Student Performance Data

Array of objects, one per student:

| Field | Type | Description | Confidentiality |
|------|-----|----------|-------------------|
| `user_id` | string | Student ID | 🟠 Medium |
| `name` | string | Student name | 🟠 Medium |
| `total` | number | Total score | 🟢 Low |
| `total_pct` | number | Completion percentage (0-100) | 🟢 Low |
| `submissions` | number | Total attempts | 🟢 Low |
| `unique_steps` | number | Unique steps | 🟢 Low |
| `correct_submissions` | number | Correct attempts | 🟢 Low |
| `success_rate` | number | Success rate (0-1) | 🟢 Low |
| `persistence` | number | Attempts per step | 🟢 Low |
| `efficiency` | number | Correct per step | 🟢 Low |
| `active_days` | number | Active days | 🟢 Low |
| `active_days_ratio` | number | Active days ratio (0-1) | 🟢 Low |
| `effort_index` | number | Effort index (z-score) | 🟢 Low |
| `consistency_index` | number | Consistency index | 🟢 Low |
| `struggle_index` | number | Struggle index | 🟢 Low |
| `meetings_attended` | number | Meetings attended | 🟢 Low |
| `meetings_attended_pct` | number | Meetings attended percentage | 🟢 Low |
| `simple_segment` | string | Segment ("Leader engaged", etc.) | 🟢 Low |

**Source:** Processed data from `performance-processor.ts`

**⚠️ Personal Data:** `user_id`, `name`

---

### 4. Dynamic Data (Activity Patterns)

Array of objects with activity patterns for each student:

| Field | Type | Description |
|------|-----|----------|
| `user_id` | string | Student ID |
| `name` | string | Student name |
| `bezier_p1x` | number | Bezier curve control point 1 (x) |
| `bezier_p1y` | number | Bezier curve control point 1 (y) |
| `bezier_p2x` | number | Bezier curve control point 2 (x) |
| `bezier_p2y` | number | Bezier curve control point 2 (y) |
| `t25` | number | Time to reach 25% activity |
| `t50` | number | Time to reach 50% activity |
| `t75` | number | Time to reach 75% activity |
| `frontload_index` | number | Frontload index (0-1) |
| `easing_label` | string | Curve type ("linear", "ease-in", etc.) |
| `consistency` | number | Activity consistency |
| `burstiness` | number | Activity burstiness |
| `activity_platform` | number | Platform activity |
| `activity_meetings` | number | Meetings activity |
| `activity_total` | number | Total activity |

**Source:** Processed data from `dynamic-processor.ts`

---

### 5. Individual Student Comments

Array of objects with personal comments:

| Field | Type | Description | Confidentiality |
|------|-----|----------|-------------------|
| `user_id` | string | Student ID | 🟠 Medium |
| `comment_program_expert` | string | Program expert comment | 🟠 Medium |
| `comment_teaching_assistants` | string | Teaching assistants comment | 🟠 Medium |
| `comment_learning_support` | string | Learning support comment | 🟠 Medium |

**Source:** `student_comments` table

**⚠️ Privacy:** Contains personal observations from instructors

---

### 6. Submissions Statistics (Aggregated) **NEW**

Aggregated data for in-depth analysis:

| Field | Type | Description |
|------|-----|----------|
| `submissionsStats.totalSubmissions` | number | Total attempts in course |
| `submissionsStats.sampleSize` | number | Sample size (max 100) |
| `submissionsStats.topicDistribution` | object | Distribution of attempts by topic |

**Source:** Aggregated from `submissions_data`

**📝 Note:** Only statistical data is sent, not raw submissions

---

### 7. Course Structure (Aggregated) **NEW**

General information about course structure:

| Field | Type | Description |
|------|-----|----------|
| `courseStructure.totalTopics` | number | Number of unique topics |
| `courseStructure.totalSteps` | number | Number of unique steps |

**Source:** Aggregated from `structure_data`

---

## 👤 Student Report (Personal Report)

### Data Structure

```json
{
  "studentName": "string",
  "performance": { ... },
  "dynamics": { ... },
  "activityTimeline": [ ... ],
  "feedback": { ... }
}
```

### 1. Basic Information

| Field | Type | Description | Confidentiality |
|------|-----|----------|-------------------|
| `studentName` | string | Student name | 🟠 Medium |

---

### 2. Performance Data

Object with performance metrics for **one** student (same fields as `performanceData` above).

---

### 3. Dynamic Data

Object with activity patterns for **one** student (same fields as `dynamicData` above).

---

### 4. Activity Timeline

Array of activity points by day:

| Field | Type | Description |
|------|-----|----------|
| `user_id` | string | Student ID |
| `date` | string | Date |
| `x_norm` | number | Normalized time (0-1) |
| `y_norm` | number | Normalized activity (0-1) |
| `platform` | number | Platform activity |
| `meetings` | number | Meetings activity |

**Source:** Processed data from `dynamic_series`

**📝 Note:** Data is normalized, exact timestamps are not transmitted

---

### 5. Instructor Comments

Object with personal comments for **one** student:

| Field | Type | Description |
|------|-----|----------|
| `user_id` | string | Student ID |
| `comment_program_expert` | string | Program expert comment |
| `comment_teaching_assistants` | string | Teaching assistants comment |
| `comment_learning_support` | string | Learning support comment |

**Source:** `student_comments` table

---

### 6. Student Submissions Analysis (Aggregated) **NEW**

Detailed statistics by topic for a specific student:

| Field | Type | Description |
|------|-----|----------|
| `submissionsAnalysis.totalSubmissions` | number | Total student attempts |
| `submissionsAnalysis.correctSubmissions` | number | Correct attempts |
| `submissionsAnalysis.successRate` | number | Overall success rate (0-1) |
| `submissionsAnalysis.topicPerformance` | array | Performance by topic |

**topicPerformance structure:**
- `topic` (string) - topic name
- `attempts` (number) - attempts in topic
- `correctRate` (number) - correct rate (0-1)
- `uniqueSteps` (number) - unique steps completed

**Source:** Aggregated from `submissions_data` for specific student

**📝 Note:** LLM uses this data to identify strong and weak topics

---

## ❌ What is NOT Sent

### Never sent:

- ❌ **Email addresses** of students
- ❌ **Passwords** or access tokens
- ❌ **Solution content** from students (code, answer text)
- ❌ **Detailed logs** with exact timestamps
- ❌ **IP addresses**
- ❌ **Private correspondence**
- ❌ **Raw CSV data** (only processed metrics)
- ❌ **Other students' data** (in student report)

---

## 🔒 Confidentiality Levels

### 🟢 Low (aggregated metrics)
- Scores, percentages, counts
- Indices (effort, consistency, struggle)
- Attendance statistics
- Activity curve patterns

### 🟠 Medium (personal data)
- **Student names**
- **User IDs**
- **Instructor comments**

### 🔴 High (NOT sent)
- Email, passwords, solution content

---

## 🛡️ Security Measures

1. **Transport:**
   - ✅ HTTPS for all requests
   - ✅ Internal Hyperskill proxy (not public OpenAI)

2. **Access:**
   - ✅ Only admins can generate reports
   - ✅ API key stored server-side (not in browser)

3. **Processing:**
   - ✅ Only processed metrics (not raw data)
   - ✅ Normalized time series
   - ✅ No solution content

4. **Storage:**
   - ✅ LLM results saved in your Supabase DB
   - ✅ You control report publication

---

## 📊 Real Data Example

### Manager Report (excerpt):

```json
{
  "reportTitle": "Python Advanced 2024-Q1",
  "reportDescription": "Final results for cohort #45",
  "totalStudents": 23,
  "teamComments": {
    "programExpert": "Students showed great progress in OOP",
    "teachingAssistants": "Most struggled with async programming",
    "learningSupport": "Good engagement overall"
  },
  "performanceData": [
    {
      "user_id": "123456",
      "name": "John Smith",
      "total": 450,
      "total_pct": 85,
      "submissions": 120,
      "success_rate": 0.78,
      "effort_index": 1.15,
      "simple_segment": "Leader engaged"
    }
  ],
  "submissionsStats": {
    "totalSubmissions": 2450,
    "sampleSize": 100,
    "topicDistribution": {
      "Topic 1": 320,
      "Topic 2": 280,
      "Topic 3": 310
    }
  },
  "courseStructure": {
    "totalTopics": 15,
    "totalSteps": 150
  }
}
```

### Student Report (excerpt):

```json
{
  "studentName": "John Smith",
  "performance": {
    "user_id": "123456",
    "total_pct": 85,
    "success_rate": 0.78,
    "active_days_ratio": 0.82
  },
  "feedback": {
    "comment_program_expert": "Excellent progress in advanced topics",
    "comment_teaching_assistants": "Very active in discussions"
  },
  "submissionsAnalysis": {
    "totalSubmissions": 120,
    "correctSubmissions": 94,
    "successRate": 0.783,
    "topicPerformance": [
      {
        "topic": "Topic 1",
        "attempts": 35,
        "correctRate": 0.85,
        "uniqueSteps": 10
      },
      {
        "topic": "Topic 2",
        "attempts": 42,
        "correctRate": 0.71,
        "uniqueSteps": 12
      },
      {
        "topic": "Topic 3",
        "attempts": 43,
        "correctRate": 0.79,
        "uniqueSteps": 11
      }
    ]
  }
}
```

---

## 📋 Recommendations

### ✅ Recommended:
1. Obtain student consent for data processing
2. Don't include sensitive information in comments
3. Use internal proxy (as configured)
4. Regularly clean up old reports

### ⚠️ Be Careful:
1. Instructor comments may contain personal information
2. Student names are transmitted for personalization
3. User IDs may be linked to other systems

---

## 🔗 Related Documents

- **Technical Documentation:** `docs/llm-reports-feature.md`
- **Setup Guide:** `docs/LLM_SETUP.md`
- **User Guide:** `docs/LLM_USER_GUIDE.md`
- **LiteLLM Changes:** `CHANGES_FOR_LITELLM.md`

---

**Last Updated:** 2025-10-06  
**Version:** 1.0

