-- Add submissions and structure data to reports table
-- This allows generating student topic tables from saved reports

alter table public.reports
add column if not exists submissions_data jsonb,
add column if not exists structure_data jsonb;

-- Add comment
comment on column public.reports.submissions_data is 'Raw submissions data for generating student topic analysis';
comment on column public.reports.structure_data is 'Course structure data for linking topics to Cogniterra';

