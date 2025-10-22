-- Simplified migration script to update segment names in existing shared reports
-- This replaces old segment names with new ones using text replacement
UPDATE shared_reports
SET blocks = 
  replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              blocks::text,
              'Leader engaged', 'Highly engaged'
            ),
            'Leader efficient', 'Highly efficient'
          ),
          'Balanced + engaged', 'Moderately engaged'
        ),
        'Balanced middle', 'Moderately performing'
      ),
      'Hardworking but struggling', 'Highly effortful'
    ),
    'Low engagement', 'Low participation'
  )::jsonb
WHERE blocks::text ~ '(Leader engaged|Leader efficient|Balanced \+ engaged|Balanced middle|Hardworking but struggling|Low engagement)';

-- Show summary of affected reports
SELECT 
  id, 
  title, 
  report_type,
  created_at,
  updated_at,
  (blocks::text LIKE '%Highly engaged%' OR 
   blocks::text LIKE '%Highly efficient%' OR 
   blocks::text LIKE '%Moderately engaged%' OR 
   blocks::text LIKE '%Moderately performing%' OR 
   blocks::text LIKE '%Highly effortful%' OR 
   blocks::text LIKE '%Low participation%') as has_new_names
FROM shared_reports
ORDER BY updated_at DESC
LIMIT 20;

