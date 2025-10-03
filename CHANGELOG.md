# Changelog

## 2025-10-03

### Fixed
- **User ID Exclusion**: Fixed issue where excluded user IDs were not being filtered from reports
  - Implemented case-insensitive ID matching (e.g., "ABC123" matches "abc123")
  - User IDs are now normalized (trimmed and lowercased) for comparison
  - Original ID formatting is preserved in the results display
  - Added logging in processing screen to show which IDs are being excluded

- **Consistent User Counts**: Fixed discrepancy between Performance and Dynamic segmentation user counts
  - Both modes now process the same set of users from all data sources
  - Users without activity data (no timestamps) are included in Dynamic mode with "no-activity" label
  - Ensures consistent learner counts across both segmentation modes

### How it works:
1. When you enter IDs to exclude (e.g., "123, ABC456"), they are converted to lowercase for comparison
2. User IDs from CSV files are also normalized to lowercase when checking exclusions
3. However, the original formatting from the CSV is preserved when displaying results
4. This ensures that IDs are excluded regardless of case differences

### Example:
- CSV has user ID: "ABC123"
- You exclude: "abc123"
- Result: User is excluded ✓
- Display: Original "ABC123" format is preserved (if the user wasn't excluded)

### User Count Consistency:
- Performance mode: Processes all users from learners.csv, grade_book.csv, and submissions.csv
- Dynamic mode: Now processes the same users, including those without activity data
- Users without timestamps get "no-activity" easing label and red color coding

