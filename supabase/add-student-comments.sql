-- Create student_comments table
create table if not exists public.student_comments (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  user_id text not null,
  comment_program_expert text,
  comment_teaching_assistants text,
  comment_learning_support text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references auth.users(id),
  
  -- Ensure one comment entry per student per report
  unique(report_id, user_id)
);

-- Enable RLS
alter table public.student_comments enable row level security;

-- Allow authenticated users to view student comments
create policy "Everyone can view student comments"
  on public.student_comments for select
  using (true);

-- Allow admins to insert/update student comments
create policy "Admins can manage student comments"
  on public.student_comments for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Create index for faster lookups
create index if not exists student_comments_report_user_idx 
  on public.student_comments(report_id, user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.student_comments
  for each row
  execute function public.handle_updated_at();

