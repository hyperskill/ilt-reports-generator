-- Create table for LLM-generated manager reports
create table if not exists public.manager_reports (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  generated_content jsonb not null,
  edited_content jsonb,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) not null,
  
  -- One manager report per base report
  unique(report_id)
);

-- Create table for LLM-generated student reports
create table if not exists public.student_reports (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  user_id text not null,
  generated_content jsonb not null,
  edited_content jsonb,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) not null,
  
  -- One student report per student per base report
  unique(report_id, user_id)
);

-- Enable RLS
alter table public.manager_reports enable row level security;
alter table public.student_reports enable row level security;

-- Policies for manager_reports
create policy "Everyone can view published manager reports"
  on public.manager_reports for select
  using (is_published = true or auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

create policy "Admins can manage manager reports"
  on public.manager_reports for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Policies for student_reports
create policy "Students can view their own published reports"
  on public.student_reports for select
  using (
    is_published = true and (
      auth.uid()::text = user_id or
      auth.uid() in (select id from public.profiles where role in ('admin', 'manager'))
    )
  );

create policy "Admins can manage student reports"
  on public.student_reports for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Create indexes for faster lookups
create index if not exists manager_reports_report_id_idx on public.manager_reports(report_id);
create index if not exists student_reports_report_user_idx on public.student_reports(report_id, user_id);

-- Create updated_at trigger function if not exists
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger set_manager_reports_updated_at
  before update on public.manager_reports
  for each row
  execute function public.handle_updated_at();

create trigger set_student_reports_updated_at
  before update on public.student_reports
  for each row
  execute function public.handle_updated_at();

