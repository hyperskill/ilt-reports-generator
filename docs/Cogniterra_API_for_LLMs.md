
# Cogniterra REST API — Overview for LLM Integration

The **Cogniterra REST API** provides structured access to educational data such as courses, modules, lessons, and steps.  
It follows REST conventions and uses JSON responses. The API is similar to Stepik’s public API and can be used to retrieve detailed information about course structure and learner progress.

---

## 🔹 Authentication

Some endpoints require authentication via API token.  
You can use standard header-based auth:

```
Authorization: Bearer <YOUR_TOKEN>
```

---

## 🔹 Main Entities

Cogniterra represents course content through a hierarchy:

```
Course → Sections (Modules) → Lessons (Topics) → Steps (Exercises / Materials)
```

### 1. Courses

**Endpoint:**
```
GET /api/courses/{course_id}
```

**Response example:**
```json
{
  "id": 678,
  "title": "AI Engineer Bootcamp",
  "slug": "ai-engineer-bootcamp",
  "summary": "A program for learning to design and deploy LLM-based systems.",
  "language": "en",
  "sections": [1234, 1235, 1236]
}
```

---

### 2. Sections (Modules)

**Endpoint:**
```
GET /api/sections?course={course_id}
```

**Returns:** list of modules belonging to a course.

**Response example:**
```json
{
  "id": 1234,
  "title": "Introduction to LLMs",
  "position": 1,
  "lessons": [1001, 1002, 1003]
}
```

---

### 3. Lessons (Topics)

**Endpoint:**
```
GET /api/lessons/{lesson_id}
```

Each lesson corresponds to a learning topic and contains steps (units of content).

**Response example:**
```json
{
  "id": 1001,
  "title": "Prompt Engineering Basics",
  "steps": [501, 502, 503]
}
```

---

### 4. Steps (Units)

**Endpoint:**
```
GET /api/steps/{step_id}
```

Each step is a piece of interactive content (video, text, quiz, or code exercise).

**Response example:**
```json
{
  "id": 501,
  "step_type": "choice",
  "title": "Choosing better prompts",
  "block": {
    "text": "Which of these prompts produces better reasoning?",
    "options": ["Option A", "Option B"]
  }
}
```

---

## 🔹 Additional Endpoints

### /api/achievements
Returns definitions of user achievements and progress tracking elements.

### /api/achievement-progresses
Tracks user-specific achievement completion status.

### /api/announcements
Lists course-related announcements or instructor messages.

### /api/adaptivity-parameters-changes
Provides analytics about changes in adaptive learning parameters — used to measure lesson difficulty and learner skill updates.

---

## 🔹 Typical Use Cases

1. **Build course structure visualizations**
   - Combine `/api/sections`, `/api/lessons`, and `/api/steps` responses.
2. **Track learner progress**
   - Use `/api/achievement-progresses` with `user` filters.
3. **Generate summaries for LLM-based tutoring**
   - Combine lesson and step content to produce context-aware explanations.
4. **Integrate course metadata with external dashboards**
   - Extract module names, lesson counts, and assessment statistics.

---

## 🔹 Example: Retrieve full module-topic structure

1. Get sections for a course:
   ```bash
   GET /api/sections?course=678
   ```
2. For each lesson in each section:
   ```bash
   GET /api/lessons/{lesson_id}
   ```
3. Combine responses into:
   ```json
   {
     "module_title": "Working with LangChain",
     "lessons": ["Chains & Agents", "Tool Integration", "Memory Systems"]
   }
   ```

---

## 🔹 Notes for LLM usage

When fine-tuning or augmenting prompts with Cogniterra data, it’s recommended to:
- Treat `course`, `section`, and `lesson` names as hierarchical context.
- Use `step_type` to infer whether a given step provides theory or practice.
- Avoid downloading raw user data unless authorized — personal identifiers should be excluded.

---

© Cogniterra Platform, 2025.
For documentation reference: https://cogniterra.org/api/docs/
