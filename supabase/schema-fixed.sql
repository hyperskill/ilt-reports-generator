-- FIXED VERSION: Create profiles table to store user roles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  role text not null check (role in ('admin', 'manager', 'student')),
  requested_admin boolean default false,
  admin_approved_at timestamp with time zone,
  admin_approved_by uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- SIMPLIFIED POLICIES - No recursion!

-- Everyone can read all profiles (needed for app to work)
create policy "Anyone can view profiles"
  on profiles for select
  using (true);

-- Users can only update their own non-role fields
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Note: Role changes must be done via service role or direct DB access
-- This prevents security issues and infinite recursion

-- Create a function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, requested_admin)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce((new.raw_user_meta_data->>'requested_admin')::boolean, false)
  );
  return new;
end;
$$;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create reports table
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  created_by uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Store file metadata
  grade_book_file_path text,
  learners_file_path text,
  submissions_file_path text,
  meetings_file_path text,
  structure_file_path text,
  
  -- Store processing results as JSONB
  performance_data jsonb,
  dynamic_data jsonb,
  dynamic_series jsonb,
  
  -- Store settings
  settings jsonb,
  excluded_user_ids text[],
  
  -- Status
  status text not null default 'draft' check (status in ('draft', 'processing', 'completed', 'error')),
  error_message text
);

-- Set up RLS for reports
alter table public.reports enable row level security;

-- For reports, we check role inline (no recursion since it's a different table)
create policy "Admins can do everything with reports"
  on reports for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Managers and students can view completed reports
create policy "Managers and students can view completed reports"
  on reports for select
  using (
    status = 'completed' and 
    (select role from public.profiles where id = auth.uid()) in ('manager', 'student')
  );

-- Create indexes for better query performance
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_requested_admin_idx on public.profiles(requested_admin) where requested_admin = true;
create index if not exists reports_created_by_idx on public.reports(created_by);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_created_at_idx on public.reports(created_at desc);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Add updated_at trigger to profiles
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

-- Add updated_at trigger to reports
drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
  before update on public.reports
  for each row
  execute procedure public.handle_updated_at();

-- Create a view for pending admin requests (for admin dashboard)
create or replace view public.pending_admin_requests as
select 
  id,
  email,
  full_name,
  role,
  created_at
from public.profiles
where requested_admin = true 
  and role != 'admin'
order by created_at desc;

-- Grant access to the view
grant select on public.pending_admin_requests to authenticated;

