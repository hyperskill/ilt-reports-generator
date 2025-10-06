-- Add comment fields to reports table
-- Run this in Supabase SQL Editor

alter table public.reports
  add column if not exists comment_program_expert text,
  add column if not exists comment_teaching_assistants text,
  add column if not exists comment_learning_support text;

-- Verify the columns were added
select column_name, data_type 
from information_schema.columns 
where table_name = 'reports' 
  and column_name like 'comment%';

