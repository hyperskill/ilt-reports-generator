-- Create profiles table to store user roles
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

-- Allow users to read their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Allow users to update their own profile (except role and admin fields)
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Admins can update any profile (for role approval)
create policy "Admins can update any profile"
  on profiles for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

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
create or replace trigger on_auth_user_created
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

-- Admins can do everything with reports
create policy "Admins can do everything with reports"
  on reports for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Managers and students can view completed reports
create policy "Managers and students can view completed reports"
  on reports for select
  using (
    status = 'completed' and (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role in ('manager', 'student')
      )
    )
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
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

-- Add updated_at trigger to reports
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
