-- Migration to update segment names to new classification (v3)
-- Date: October 2024
-- 
-- This migration updates ALL old segment names (v1 and v2) to new v3 naming:
--
-- V1 → V3:
-- "Leader efficient" → "Highly efficient"
-- "Leader engaged" → "Highly engaged"
-- "Balanced + engaged" → "Moderately engaged"
-- "Balanced middle" → "Moderately engaged"
-- "Hardworking but struggling" → "Highly committed"
-- "Low engagement" → "Less engaged"
--
-- V2 → V3:
-- "Highly effortful" → "Highly committed"
-- "Low participation" → "Less engaged"
-- "Moderately performing" → "Moderately engaged"
--
-- Affected tables: reports, shared_reports

-- Update reports table (main reports with performance_data)
UPDATE reports
SET performance_data = 
  replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    performance_data::text,
                    '"simple_segment":"Leader efficient"', '"simple_segment":"Highly efficient"'
                  ),
                  '"simple_segment":"Leader engaged"', '"simple_segment":"Highly engaged"'
                ),
                '"simple_segment":"Balanced + engaged"', '"simple_segment":"Moderately engaged"'
              ),
              '"simple_segment":"Balanced middle"', '"simple_segment":"Moderately engaged"'
            ),
            '"simple_segment":"Moderately performing"', '"simple_segment":"Moderately engaged"'
          ),
          '"simple_segment":"Hardworking but struggling"', '"simple_segment":"Highly committed"'
        ),
        '"simple_segment":"Highly effortful"', '"simple_segment":"Highly committed"'
      ),
      '"simple_segment":"Low engagement"', '"simple_segment":"Less engaged"'
    ),
    '"simple_segment":"Low participation"', '"simple_segment":"Less engaged"'
  )::jsonb
WHERE performance_data IS NOT NULL 
  AND performance_data::text ~ '(Leader efficient|Leader engaged|Balanced \+ engaged|Balanced middle|Hardworking but struggling|Low engagement|Highly effortful|Low participation|Moderately performing)';

-- Update shared_reports table (blocks with segment references)
UPDATE shared_reports
SET blocks = 
  replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    blocks::text,
                    'Leader efficient', 'Highly efficient'
                  ),
                  'Leader engaged', 'Highly engaged'
                ),
                'Balanced + engaged', 'Moderately engaged'
              ),
              'Balanced middle', 'Moderately engaged'
            ),
            'Hardworking but struggling', 'Highly committed'
          ),
          'Low engagement', 'Less engaged'
        ),
        'Highly effortful', 'Highly committed'
      ),
      'Low participation', 'Less engaged'
    ),
    'Moderately performing', 'Moderately engaged'
  )::jsonb
WHERE blocks::text ~ '(Leader efficient|Leader engaged|Balanced \+ engaged|Balanced middle|Hardworking but struggling|Low engagement|Highly effortful|Low participation|Moderately performing)';

-- Show summary of affected reports
SELECT 
  'Reports table' as table_name,
  COUNT(*) as total_updated
FROM reports
WHERE performance_data IS NOT NULL
  AND performance_data::text ~ '(Highly committed|Less engaged)'

UNION ALL

SELECT 
  'Shared reports table' as table_name,
  COUNT(*) as total_updated
FROM shared_reports
WHERE blocks::text ~ '(Highly committed|Less engaged)';

-- Verification: Show distribution of new segment names in reports
SELECT 
  'Reports' as source,
  jsonb_array_elements(performance_data)->>'simple_segment' as segment_name,
  COUNT(*) as count
FROM reports
WHERE performance_data IS NOT NULL
GROUP BY segment_name
ORDER BY count DESC;

-- Verification: Show sample of updated shared reports
SELECT 
  id, 
  title, 
  report_type,
  created_at,
  updated_at,
  (blocks::text LIKE '%Highly committed%') as has_highly_committed,
  (blocks::text LIKE '%Less engaged%') as has_less_engaged,
  (blocks::text LIKE '%Moderately engaged%') as has_moderately_engaged
FROM shared_reports
WHERE blocks::text ~ '(Highly committed|Less engaged|Moderately engaged)'
ORDER BY updated_at DESC
LIMIT 10;

