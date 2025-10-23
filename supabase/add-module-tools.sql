-- Add module_tools table to store generated tools information for each module
create table if not exists public.module_tools (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  module_id integer not null,
  module_title text not null,
  tools text not null, -- Generated tools description text
  created_by uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one tools entry per module per report
  unique(report_id, module_id)
);

-- Set up RLS for module_tools
alter table public.module_tools enable row level security;

-- Admins can do everything with module tools
create policy "Admins can manage module tools"
  on module_tools for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Managers can view module tools
create policy "Managers can view module tools"
  on module_tools for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'manager'
    )
  );

-- Create indexes for better query performance
create index if not exists module_tools_report_id_idx on public.module_tools(report_id);
create index if not exists module_tools_module_id_idx on public.module_tools(module_id);
create index if not exists module_tools_created_at_idx on public.module_tools(created_at desc);

-- Add updated_at trigger to module_tools
create trigger set_module_tools_updated_at
  before update on public.module_tools
  for each row
  execute procedure public.handle_updated_at();

