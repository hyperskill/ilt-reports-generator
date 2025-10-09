-- ================================================================
-- Remove Public/Publish functionality and enhance sharing
-- ================================================================
-- This migration removes is_public from shared_reports and 
-- is_published from LLM reports, focusing on explicit user sharing
-- ================================================================

-- 1. Drop dependent objects before removing is_public column
-- ================================================================

-- Drop the view that depends on is_public
DROP VIEW IF EXISTS shared_reports_with_access;

-- Drop the policy that depends on is_public
DROP POLICY IF EXISTS "Users can view shared reports with access" ON shared_reports;

-- 2. Remove is_public column from shared_reports
-- ================================================================
ALTER TABLE shared_reports DROP COLUMN IF EXISTS is_public;

-- 3. Drop policies that depend on is_published before dropping columns
-- ================================================================

-- Drop manager_reports policy that depends on is_published
DROP POLICY IF EXISTS "Everyone can view published manager reports" ON manager_reports;

-- Drop student_reports policy that depends on is_published
DROP POLICY IF EXISTS "Students can view their own published reports" ON student_reports;

-- 4. Remove is_published column from manager_reports
-- ================================================================
ALTER TABLE manager_reports DROP COLUMN IF EXISTS is_published;

-- 5. Remove is_published column from student_reports
-- ================================================================
ALTER TABLE student_reports DROP COLUMN IF EXISTS is_published;

-- 6. Create new RLS policy for shared_reports
-- ================================================================

-- Create new policy: Users can only view reports they have explicit access to
-- (Old policy already dropped in step 1)
CREATE POLICY "Users can view shared reports with explicit access"
  ON shared_reports
  FOR SELECT
  USING (
    -- User has explicit access via report_access table
    EXISTS (
      SELECT 1 FROM report_access
      WHERE report_access.shared_report_id = shared_reports.id
      AND report_access.user_id = auth.uid()
      AND (report_access.expires_at IS NULL OR report_access.expires_at > NOW())
    )
  );

-- 7. Create new RLS policy for manager_reports
-- ================================================================

-- Create new policy: Only admins can view manager reports
CREATE POLICY "Admins can view all manager reports"
  ON manager_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 8. Create new RLS policy for student_reports
-- ================================================================

-- Create new policy: Only admins can view student reports
CREATE POLICY "Admins can view all student reports"
  ON student_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Note: report_access table is already set up
-- ================================================================
-- (Already created in add-shared-reports.sql)

-- The report_access table structure:
-- - id: UUID primary key
-- - shared_report_id: UUID references shared_reports(id)
-- - user_id: UUID references auth.users(id)
-- - granted_by: UUID references auth.users(id)
-- - granted_at: TIMESTAMPTZ
-- - expires_at: TIMESTAMPTZ (optional)

-- 9. Add indexes for better performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_report_access_user_report 
  ON report_access(user_id, shared_report_id);

-- 10. Recreate the view without is_public column
-- ================================================================
CREATE OR REPLACE VIEW shared_reports_with_access AS
SELECT 
  sr.*,
  COALESCE(
    json_agg(
      json_build_object(
        'user_id', ra.user_id,
        'email', u.email,
        'granted_at', ra.granted_at,
        'expires_at', ra.expires_at
      ) ORDER BY ra.granted_at DESC
    ) FILTER (WHERE ra.user_id IS NOT NULL),
    '[]'::json
  ) as access_list,
  COUNT(ra.user_id) as access_count
FROM shared_reports sr
LEFT JOIN report_access ra ON sr.id = ra.shared_report_id
  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
LEFT JOIN auth.users u ON ra.user_id = u.id
GROUP BY sr.id;

COMMENT ON VIEW shared_reports_with_access IS 'Shared reports with aggregated access information (without is_public)';

-- ================================================================
-- Migration Complete
-- ================================================================

-- Summary of changes:
-- 1. Dropped dependent view and policy
-- 2. Removed is_public from shared_reports
-- 3. Removed is_published from manager_reports and student_reports
-- 4. Updated RLS policies to use only explicit access via report_access table
-- 5. Recreated view without is_public column
-- 6. Admins have full access to all reports
-- 7. Regular users can only see shared reports explicitly shared with them

