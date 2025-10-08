-- ================================================================
-- Shared Reports Feature - Database Schema
-- ================================================================
-- This migration adds support for sharing reports with customizable
-- block order and granular access control
-- ================================================================

-- 1. Create shared_reports table
-- ================================================================
CREATE TABLE IF NOT EXISTS shared_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Report identification
  report_type TEXT NOT NULL CHECK (report_type IN ('manager', 'student')),
  source_report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id TEXT, -- For student reports, identifies which student
  
  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  
  -- Editable blocks with order
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Structure: [{ id: string, type: string, title: string, content: string, order: number }]
  
  -- Access control
  is_public BOOLEAN DEFAULT FALSE,
  access_code TEXT UNIQUE, -- Optional: for link-based sharing
  
  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  -- Removed unique constraint to allow multiple shared reports per student
  -- from the same source report (e.g., different block configurations)
);

-- Create indexes for better query performance
CREATE INDEX idx_shared_reports_source ON shared_reports(source_report_id);
CREATE INDEX idx_shared_reports_user ON shared_reports(user_id);
CREATE INDEX idx_shared_reports_type ON shared_reports(report_type);
CREATE INDEX idx_shared_reports_access_code ON shared_reports(access_code) WHERE access_code IS NOT NULL;

COMMENT ON TABLE shared_reports IS 'Stores shareable report versions with customizable blocks';
COMMENT ON COLUMN shared_reports.blocks IS 'Array of editable content blocks with order';
COMMENT ON COLUMN shared_reports.access_code IS 'Optional code for link-based anonymous access';


-- 2. Create report_access table (many-to-many)
-- ================================================================
CREATE TABLE IF NOT EXISTS report_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  shared_report_id UUID NOT NULL REFERENCES shared_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Access metadata
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Optional: expiration
  expires_at TIMESTAMPTZ,
  
  -- Unique constraint: one access record per user per report
  UNIQUE(shared_report_id, user_id)
);

-- Create indexes
CREATE INDEX idx_report_access_shared_report ON report_access(shared_report_id);
CREATE INDEX idx_report_access_user ON report_access(user_id);
CREATE INDEX idx_report_access_expires ON report_access(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE report_access IS 'Controls which users can view which shared reports';
COMMENT ON COLUMN report_access.expires_at IS 'Optional expiration timestamp for temporary access';


-- 3. Create updated_at trigger for shared_reports
-- ================================================================
CREATE OR REPLACE FUNCTION update_shared_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shared_reports_updated_at
  BEFORE UPDATE ON shared_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_reports_updated_at();


-- 4. Row Level Security (RLS) Policies
-- ================================================================

-- Enable RLS
ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_access ENABLE ROW LEVEL SECURITY;

-- Shared Reports Policies
-- ----------------------------------------------------------------

-- Admins can do everything
CREATE POLICY "Admins can manage all shared reports"
  ON shared_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view reports they have access to
CREATE POLICY "Users can view shared reports with access"
  ON shared_reports
  FOR SELECT
  USING (
    -- User has explicit access
    EXISTS (
      SELECT 1 FROM report_access
      WHERE report_access.shared_report_id = shared_reports.id
      AND report_access.user_id = auth.uid()
      AND (report_access.expires_at IS NULL OR report_access.expires_at > NOW())
    )
    OR
    -- Report is public
    shared_reports.is_public = TRUE
  );

-- Creators can view their own shared reports
CREATE POLICY "Creators can view their shared reports"
  ON shared_reports
  FOR SELECT
  USING (created_by = auth.uid());


-- Report Access Policies
-- ----------------------------------------------------------------

-- Admins can manage all access records
CREATE POLICY "Admins can manage all report access"
  ON report_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own access records
CREATE POLICY "Users can view their access records"
  ON report_access
  FOR SELECT
  USING (user_id = auth.uid());


-- 5. Helper Functions
-- ================================================================

-- Function to grant access to multiple users at once
CREATE OR REPLACE FUNCTION grant_report_access(
  p_shared_report_id UUID,
  p_user_ids UUID[],
  p_granted_by UUID,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(user_id UUID, success BOOLEAN, message TEXT) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO report_access (shared_report_id, user_id, granted_by, expires_at)
  SELECT p_shared_report_id, unnest(p_user_ids), p_granted_by, p_expires_at
  ON CONFLICT (shared_report_id, user_id) 
  DO UPDATE SET 
    granted_by = EXCLUDED.granted_by,
    granted_at = NOW(),
    expires_at = EXCLUDED.expires_at
  RETURNING 
    report_access.user_id,
    TRUE as success,
    'Access granted'::TEXT as message;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY
    SELECT NULL::UUID, FALSE, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke access from multiple users
CREATE OR REPLACE FUNCTION revoke_report_access(
  p_shared_report_id UUID,
  p_user_ids UUID[]
)
RETURNS TABLE(user_id UUID, success BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  DELETE FROM report_access
  WHERE shared_report_id = p_shared_report_id
  AND user_id = ANY(p_user_ids)
  RETURNING report_access.user_id, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Views for easier querying
-- ================================================================

-- View to see all reports with access info
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

COMMENT ON VIEW shared_reports_with_access IS 'Shared reports with aggregated access information';


-- ================================================================
-- Migration Complete
-- ================================================================
