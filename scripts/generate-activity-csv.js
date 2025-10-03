#!/usr/bin/env node
/**
 * Generate activity.csv from submissions.csv
 * 
 * This script creates a synthetic activity.csv file by aggregating submissions data.
 * Each submission is treated as a session, and we estimate active minutes based on
 * submission frequency and patterns.
 * 
 * Usage: node scripts/generate-activity-csv.js <path-to-submissions.csv>
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

function dateKey(timestamp) {
  // Handle both Unix epoch (seconds or milliseconds) and ISO strings
  let date;
  if (typeof timestamp === 'number' || /^\d+$/.test(timestamp)) {
    // Unix timestamp - check if seconds or milliseconds
    const ts = parseInt(timestamp);
    date = ts > 10000000000 ? new Date(ts) : new Date(ts * 1000);
  } else {
    date = new Date(timestamp);
  }
  return date.toISOString().split('T')[0];
}

function generateActivity(submissionsPath, outputPath) {
  console.log('Reading submissions file...');
  const csvContent = fs.readFileSync(submissionsPath, 'utf-8');
  const submissions = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Loaded ${submissions.length} submissions`);

  // Aggregate by user and date
  const activityByUserDate = new Map();

  for (const row of submissions) {
    const userId = row.user_id || row.UserId || row.uid || row.user;
    const timestampRaw = row.timestamp || row.time || row.submission_time || row.attempt_time || row.created_at;
    
    if (!userId || !timestampRaw) continue;

    try {
      const date = dateKey(timestampRaw);
      const key = `${userId}|${date}`;

      const existing = activityByUserDate.get(key) || {
        user_id: userId,
        date: date,
        submissions: 0,
      };

      existing.submissions += 1;
      activityByUserDate.set(key, existing);
    } catch (err) {
      // Skip invalid timestamps
      continue;
    }
  }

  console.log(`Aggregated into ${activityByUserDate.size} user-date combinations`);

  // Convert to activity rows
  const activityRows = [];
  const userLastTimestamp = new Map();

  for (const [key, data] of activityByUserDate.entries()) {
    // Estimate sessions: group submissions within 2-hour windows
    // For simplicity, assume 1 session per 3 submissions (rough heuristic)
    const sessions = Math.max(1, Math.ceil(data.submissions / 3));
    
    // Estimate active minutes: 5-15 minutes per submission (depends on difficulty)
    // Average of 10 minutes per submission
    const active_minutes = Math.round(data.submissions * 10);

    // Use the date at noon UTC as the timestamp for that day
    const dayTimestamp = `${data.date}T12:00:00Z`;

    activityRows.push({
      user_id: data.user_id,
      timestamp: dayTimestamp,
      active_minutes: active_minutes,
      sessions: sessions,
    });
  }

  // Sort by user_id and timestamp
  activityRows.sort((a, b) => {
    if (a.user_id !== b.user_id) return a.user_id.localeCompare(b.user_id);
    return a.timestamp.localeCompare(b.timestamp);
  });

  console.log(`Generated ${activityRows.length} activity records`);

  // Write to CSV
  const csvOutput = stringify(activityRows, {
    header: true,
    columns: ['user_id', 'timestamp', 'active_minutes', 'sessions'],
  });

  fs.writeFileSync(outputPath, csvOutput, 'utf-8');
  console.log(`✅ Activity CSV written to: ${outputPath}`);
  console.log(`\nSample data (first 5 rows):`);
  console.log(activityRows.slice(0, 5).map(r => 
    `  ${r.user_id} | ${r.timestamp} | ${r.active_minutes} min | ${r.sessions} sessions`
  ).join('\n'));
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node generate-activity-csv.js <path-to-submissions.csv> [output-path]');
  console.error('Example: node generate-activity-csv.js test-data/course-678-submissions-2025-10-02-09-25-12.csv');
  process.exit(1);
}

const submissionsPath = args[0];
const outputPath = args[1] || submissionsPath.replace('submissions', 'activity').replace('.csv', '-generated.csv');

if (!fs.existsSync(submissionsPath)) {
  console.error(`Error: File not found: ${submissionsPath}`);
  process.exit(1);
}

try {
  generateActivity(submissionsPath, outputPath);
} catch (error) {
  console.error('Error generating activity CSV:', error.message);
  process.exit(1);
}

