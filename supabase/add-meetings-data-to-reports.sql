-- Add meetings data to reports table
-- This allows displaying meeting attendance in module analytics

alter table public.reports
add column if not exists meetings_data jsonb;

-- Add comment
comment on column public.reports.meetings_data is 'Raw meetings attendance data for module analytics';

