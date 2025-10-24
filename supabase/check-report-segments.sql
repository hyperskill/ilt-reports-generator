-- Check segments in specific report
-- Replace the UUID with your report ID: b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b

SELECT 
  id,
  title,
  created_at,
  updated_at,
  jsonb_array_elements(performance_data)->>'simple_segment' as segment_name
FROM reports
WHERE id = 'b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b'
LIMIT 100;

-- Check if old segment names still exist
SELECT 
  id,
  title,
  (performance_data::text LIKE '%Highly effortful%') as has_old_effortful,
  (performance_data::text LIKE '%Low participation%') as has_old_low_participation,
  (performance_data::text LIKE '%Moderately performing%') as has_old_moderately_performing,
  (performance_data::text LIKE '%Highly committed%') as has_new_committed,
  (performance_data::text LIKE '%Less engaged%') as has_new_less_engaged
FROM reports
WHERE id = 'b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b';

