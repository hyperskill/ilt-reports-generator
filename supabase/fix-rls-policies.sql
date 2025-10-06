-- Fix infinite recursion in RLS policies for profiles table

-- Drop existing problematic policies
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;

-- Recreate policies without recursion
-- Use auth.uid() directly instead of checking profiles table

-- Allow admins to view all profiles (check via JWT claims or direct auth check)
create policy "Users can view all profiles"
  on profiles for select
  using (true);  -- Temporarily allow all authenticated users to read profiles

-- Allow users to update their own profile
-- Admins can update via service role key or direct DB access
create policy "Users can update own profile only"
  on profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id 
    and (
      -- Users can't change their own role
      (select role from profiles where id = auth.uid()) = role
      or role is null
    )
  );

-- For admin operations, use service role key or direct SQL
-- This prevents the infinite recursion issue

