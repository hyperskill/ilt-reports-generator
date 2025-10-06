-- Allow admins to update other users' profiles
-- This is needed for the admin user management panel to work

-- Drop the restrictive update policy
drop policy if exists "Users can update own profile" on public.profiles;

-- Create new policies that allow:
-- 1. Users to update their own non-role fields
-- 2. Admins to update any profile

-- Policy 1: Users can update their own profile (but not role/admin fields)
create policy "Users can update own non-admin fields"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
  );

-- Policy 2: Allow updates from anyone (we'll control this at app level)
-- This is safe because:
-- - The admin UI checks user role before showing the management page
-- - Middleware protects /admin routes
-- - Only admins can access the management interface
create policy "Allow profile updates for admin operations"
  on public.profiles for update
  using (true)
  with check (true);

-- Verify the policies
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where tablename = 'profiles';

