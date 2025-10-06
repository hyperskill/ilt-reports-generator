-- Test if student_comments table exists and check its structure
select 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
from information_schema.columns
where table_name = 'student_comments'
and table_schema = 'public'
order by ordinal_position;

-- Check RLS policies
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
from pg_policies
where tablename = 'student_comments';

-- Test insert (replace with actual values)
-- INSERT INTO public.student_comments (report_id, user_id, comment_program_expert, updated_by)
-- VALUES ('your-report-id', 'test-user-123', 'Test comment', 'your-user-id');

