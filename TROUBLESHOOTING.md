# Troubleshooting: Student Comments Not Showing

## Problem
Student comments saved during report creation don't appear when viewing the report later.

## Diagnostic Steps

### 1. Check if table exists in Supabase

Open Supabase Dashboard → SQL Editor, run:
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'student_comments';
```

**Expected result**: One row showing the table exists.

**If empty**: Run `supabase/add-student-comments.sql` to create the table.

### 2. Check table structure

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'student_comments'
ORDER BY ordinal_position;
```

**Expected columns**:
- `id` (uuid)
- `report_id` (uuid)
- `user_id` (text)
- `comment_program_expert` (text)
- `comment_teaching_assistants` (text)
- `comment_learning_support` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `updated_by` (uuid)

### 3. Check for existing comments

```sql
SELECT * FROM public.student_comments;
```

This will show all saved student comments.

### 4. Test manual insert

```sql
-- Replace with actual values
INSERT INTO public.student_comments (
  report_id, 
  user_id, 
  comment_program_expert,
  updated_by
) VALUES (
  'your-report-id-here',
  'test-user-123',
  'Test comment',
  'your-user-id-here'
);
```

If this fails, check the error message.

### 5. Check RLS policies

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'student_comments';
```

**Expected policies**:
- "Everyone can view student comments" (SELECT)
- "Admins can manage student comments" (ALL)

## Common Issues

### Issue: Table doesn't exist
**Solution**: Run `supabase/add-student-comments.sql` in Supabase SQL Editor.

### Issue: RLS blocking inserts
**Solution**: Verify your user has admin role in profiles table:
```sql
SELECT id, email, role FROM public.profiles 
WHERE id = 'your-user-id';
```

### Issue: Comments not being sent from frontend
**Solution**: 
1. Open browser console (F12)
2. Look for logs: "Student comments to save: ..."
3. Check "Number of students with comments: ..."
4. If 0, comments aren't being saved to context properly

### Issue: Comments sent but not inserted
**Solution**:
1. Check server terminal logs
2. Look for "Saving student comments: ..."
3. Check for database errors
4. Verify report_id and user_id are correct

## Debug Checklist

- [ ] Table `student_comments` exists in Supabase
- [ ] Table has correct structure
- [ ] RLS policies are configured
- [ ] User has admin role
- [ ] Browser console shows comments being sent
- [ ] Server logs show comments being received
- [ ] Server logs show successful insert (or error)
- [ ] Comments appear in database query
- [ ] Comments load when viewing student detail page

## Contact Points

If all above checks pass but issue persists:
1. Export server logs
2. Export browser console logs
3. Run SQL query: `SELECT * FROM student_comments WHERE report_id = 'your-report-id';`
4. Share all three with development team

