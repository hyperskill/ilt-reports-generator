-- Create student_certificates table to store certificate links for each student in a report
create table if not exists public.student_certificates (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  user_id text not null,
  certificate_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one certificate per student per report
  unique(report_id, user_id)
);

-- Set up Row Level Security (RLS)
alter table public.student_certificates enable row level security;

-- Admins can do everything with certificates
create policy "Admins can do everything with certificates"
  on student_certificates for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Managers and students can view certificates from completed reports
create policy "Managers and students can view certificates"
  on student_certificates for select
  using (
    exists (
      select 1 from public.reports
      where reports.id = student_certificates.report_id 
      and reports.status = 'completed'
      and exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role in ('manager', 'student')
      )
    )
  );

-- Create indexes for better query performance
create index if not exists student_certificates_report_id_idx on public.student_certificates(report_id);
create index if not exists student_certificates_user_id_idx on public.student_certificates(user_id);

-- Add updated_at trigger to student_certificates
create trigger set_student_certificates_updated_at
  before update on public.student_certificates
  for each row
  execute procedure public.handle_updated_at();



