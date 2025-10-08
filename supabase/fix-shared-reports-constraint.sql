-- ================================================================
-- Fix Shared Reports Unique Constraint
-- ================================================================
-- This script removes the overly restrictive unique constraint
-- that prevents creating multiple shared reports for the same
-- student from the same source report
-- ================================================================

-- Drop the existing unique constraint
ALTER TABLE shared_reports 
DROP CONSTRAINT IF EXISTS shared_reports_source_report_id_user_id_report_type_key;

-- Add a comment explaining the change
COMMENT ON TABLE shared_reports IS 'Stores shareable report versions with customizable blocks. Multiple reports per student from same source are allowed.';
