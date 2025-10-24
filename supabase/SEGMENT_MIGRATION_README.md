# Segment Names Migration (v3) - October 2024

This directory contains SQL migrations to update segment names from v1/v2 to v3 classification.

## Changes

### Segment Name Updates
- **Highly effortful** → **Highly committed**
- **Low participation** → **Less engaged**  
- **Moderately performing** → **Moderately engaged** (consolidated)
- **Leader efficient** → **Highly efficient** (v1 → v3)
- **Leader engaged** → **Highly engaged** (v1 → v3)
- **Balanced middle** → **Moderately engaged** (v1 → v3)
- **Low engagement** → **Less engaged** (v1 → v3)

### Color Scheme (Green gradient)
- 🟢 **Highly efficient, Highly engaged** — Dark green `rgba(34, 197, 94, 0.8)`
- 🟢 **Highly committed** — Medium green `rgba(74, 222, 128, 0.8)`
- 🟢 **Moderately engaged** — Light green `rgba(134, 239, 172, 0.8)`
- 🔴 **Less engaged** — Red `rgba(239, 68, 68, 0.8)`

## Migration Files

### 1. `final-update-segments.sql`
**Purpose**: Updates segment names in `reports.performance_data`

**What it does**:
- Uses `jsonb_set` to properly update JSONB fields
- Updates all old segment names (v1 and v2) to v3 naming
- Shows verification queries with segment distribution

**When to run**: First, to update the main reports table

```sql
-- Run in Supabase SQL Editor
-- Updates reports.performance_data with new segment names
```

### 2. `update-shared-reports-segments.sql`
**Purpose**: Updates segment names and descriptions in `shared_reports.blocks`

**What it does**:
- Updates segment names in report blocks (charts, tables, text)
- Updates detailed segment descriptions in helpText
- Uses text replacement for JSONB content

**When to run**: Second, to update shared reports

```sql
-- Run in Supabase SQL Editor
-- Updates shared_reports.blocks with new segment names and descriptions
```

### 3. `fix-duplicate-moderately.sql`
**Purpose**: Removes duplicate "Moderately engaged" entries from helpText

**What it does**:
- Removes duplicate legend entries that appeared after migration
- Cleans up helpText in shared_reports where multiple old segments became one

**When to run**: Third (optional), only if you see duplicates in legends

```sql
-- Run in Supabase SQL Editor
-- Removes duplicate "Moderately engaged" entries
```

## How to Apply

### Option 1: Apply All Migrations (Recommended)
Run migrations in order:
1. Open Supabase Dashboard → SQL Editor
2. Copy and run `final-update-segments.sql`
3. Copy and run `update-shared-reports-segments.sql`
4. If needed, copy and run `fix-duplicate-moderately.sql`

### Option 2: Fresh Start
If you have no existing reports, just use the updated application code. New reports will automatically use v3 segment names.

## Verification

After running migrations, verify with:

```sql
-- Check segment distribution in reports
SELECT 
  jsonb_array_elements(performance_data)->>'simple_segment' as segment_name,
  COUNT(*) as count
FROM reports
WHERE performance_data IS NOT NULL
GROUP BY segment_name
ORDER BY count DESC;

-- Check shared reports
SELECT 
  COUNT(*) as total_reports,
  SUM(CASE WHEN blocks::text LIKE '%Highly efficient%' THEN 1 ELSE 0 END) as has_new_names
FROM shared_reports;
```

## Rollback

**Warning**: These migrations modify data. Create a backup before running.

To rollback, you would need to reverse the text replacements, but it's recommended to restore from backup instead.

## Files Cleaned Up

The following test/intermediate files have been removed from the repository:
- `check-report-segments.sql` - test queries
- `force-update-segments.sql` - intermediate attempt  
- `remove-duplicate-moderately.sql` - intermediate attempt
- `update-segment-names-2024.sql` - first non-working attempt

Only production-ready migrations remain in this directory.

