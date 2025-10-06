-- ⚡ QUICK FIX for infinite recursion in RLS policies
-- Run this in Supabase SQL Editor to fix the issue immediately

-- 1. Drop the problematic policies
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;

-- 2. Create simple, working policies
create policy "Everyone can view profiles"
  on public.profiles for select
  using (true);

-- Users can still update their own profile
-- (the existing "Users can update own profile" policy handles this)

-- 3. Verify it works
select id, email, full_name, role from public.profiles limit 5;

-- ✅ Done! Now refresh your app and it should work.

