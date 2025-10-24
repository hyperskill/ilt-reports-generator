# Utility Scripts

## 🧪 LLM Testing Scripts (NEW!)

Scripts for testing LLM report generation functionality.

### Quick Start

```bash
# Step 1: Check data preparation (NO TOKEN COST)
node scripts/check-llm-data.js manager <reportId>
node scripts/check-llm-data.js student <reportId> <userId>

# Step 2: Full test with LLM call (COSTS TOKENS!)
node scripts/test-llm-generation.js manager <reportId>
node scripts/test-llm-generation.js student <reportId> <userId>
```

### Available Testing Scripts

1. **`check-llm-data.js`** - Validates data preparation without making LLM API calls
   - Checks ENV variables
   - Validates report data
   - Checks learning outcomes & module tools
   - Detects empty/null values
   - NO TOKEN COST ✅

2. **`test-llm-generation.js`** - Complete test with actual LLM generation
   - Tests LLM connection
   - Makes real API call
   - Validates response format
   - Checks content quality
   - COSTS TOKENS ⚠️

📖 **[Read Full Testing Guide](TEST_LLM_GUIDE.md)** for detailed instructions and troubleshooting.

---

## generate-activity-csv.js

Generates `activity.csv` from `submissions.csv` by aggregating submission data into daily activity metrics.

### Usage

```bash
node scripts/generate-activity-csv.js <path-to-submissions.csv> [output-path]
```

### Example

```bash
# Generate activity CSV from submissions
node scripts/generate-activity-csv.js test-data/course-678-submissions-2025-10-02-09-25-12.csv test-data/course-678-activity-generated.csv
```

### What it does

1. Reads submissions CSV file
2. Aggregates submissions by user and date
3. Estimates activity metrics:
   - **active_minutes**: ~10 minutes per submission (configurable heuristic)
   - **sessions**: Estimated as ~1 session per 3 submissions
4. Outputs activity.csv with columns: `user_id`, `timestamp`, `active_minutes`, `sessions`

### Timestamp Handling

The script automatically handles:
- Unix epoch timestamps (seconds or milliseconds)
- ISO 8601 date strings
- Common column name variations (`timestamp`, `time`, `submission_time`, `attempt_time`, `created_at`)

### Notes

- This is a synthetic generation based on submission patterns
- If you have actual activity tracking data (e.g., from learning analytics), use that instead
- The minutes-per-submission heuristic (currently 10) can be adjusted in the script based on your platform's typical patterns
- The script groups all submissions on the same calendar day into a single activity record with aggregated metrics

### Output Format

```csv
user_id,timestamp,active_minutes,sessions
911061,2025-09-03T12:00:00Z,360,12
911061,2025-09-04T12:00:00Z,350,12
```

- `user_id`: Student identifier
- `timestamp`: ISO 8601 timestamp (set to noon UTC for the given date)
- `active_minutes`: Total estimated active minutes for that day
- `sessions`: Estimated number of distinct study sessions for that day

