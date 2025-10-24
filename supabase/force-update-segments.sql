-- FORCE UPDATE all segment names (no WHERE condition)
-- This will update ALL reports, even if they don't have old segment names

-- Update reports table
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
WHERE performance_data IS NOT NULL;

-- Check result for specific report
SELECT 
  id,
  title,
  jsonb_array_elements(performance_data)->>'simple_segment' as segment_name
FROM reports
WHERE id = 'b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b'
LIMIT 10;

-- Count all unique segments across all reports
SELECT 
  jsonb_array_elements(performance_data)->>'simple_segment' as segment_name,
  COUNT(*) as count
FROM reports
WHERE performance_data IS NOT NULL
GROUP BY segment_name
ORDER BY count DESC;

