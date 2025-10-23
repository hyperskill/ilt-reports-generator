-- Add learning_outcomes table to store generated learning outcomes for each module
create table if not exists public.learning_outcomes (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  module_id integer not null,
  module_title text not null,
  outcomes text not null, -- Generated learning outcomes text
  created_by uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one learning outcome per module per report
  unique(report_id, module_id)
);

-- Set up RLS for learning_outcomes
alter table public.learning_outcomes enable row level security;

-- Admins can do everything with learning outcomes
create policy "Admins can manage learning outcomes"
  on learning_outcomes for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Managers can view learning outcomes for reports they have access to
create policy "Managers can view learning outcomes"
  on learning_outcomes for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'manager'
    )
  );

-- Create indexes for better query performance
create index if not exists learning_outcomes_report_id_idx on public.learning_outcomes(report_id);
create index if not exists learning_outcomes_module_id_idx on public.learning_outcomes(module_id);
create index if not exists learning_outcomes_created_at_idx on public.learning_outcomes(created_at desc);

-- Add updated_at trigger to learning_outcomes
create trigger set_learning_outcomes_updated_at
  before update on public.learning_outcomes
  for each row
  execute procedure public.handle_updated_at();

