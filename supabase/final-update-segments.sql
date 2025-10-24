-- FINAL MIGRATION: Update segment names using jsonb_set (proper way)
-- This correctly updates JSONB fields instead of string replacement

-- Update all reports
UPDATE reports
SET performance_data = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'simple_segment' = 'Leader efficient' THEN jsonb_set(elem, '{simple_segment}', '"Highly efficient"')
      WHEN elem->>'simple_segment' = 'Leader engaged' THEN jsonb_set(elem, '{simple_segment}', '"Highly engaged"')
      WHEN elem->>'simple_segment' = 'Balanced + engaged' THEN jsonb_set(elem, '{simple_segment}', '"Moderately engaged"')
      WHEN elem->>'simple_segment' = 'Balanced middle' THEN jsonb_set(elem, '{simple_segment}', '"Moderately engaged"')
      WHEN elem->>'simple_segment' = 'Moderately performing' THEN jsonb_set(elem, '{simple_segment}', '"Moderately engaged"')
      WHEN elem->>'simple_segment' = 'Hardworking but struggling' THEN jsonb_set(elem, '{simple_segment}', '"Highly committed"')
      WHEN elem->>'simple_segment' = 'Highly effortful' THEN jsonb_set(elem, '{simple_segment}', '"Highly committed"')
      WHEN elem->>'simple_segment' = 'Low engagement' THEN jsonb_set(elem, '{simple_segment}', '"Less engaged"')
      WHEN elem->>'simple_segment' = 'Low participation' THEN jsonb_set(elem, '{simple_segment}', '"Less engaged"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(performance_data) elem
)
WHERE performance_data IS NOT NULL;

-- Verification: Check all unique segment names after update
SELECT 
  jsonb_array_elements(performance_data)->>'simple_segment' as segment_name,
  COUNT(*) as count
FROM reports
WHERE performance_data IS NOT NULL
GROUP BY segment_name
ORDER BY count DESC;

-- Verification: Check specific report
SELECT DISTINCT
  jsonb_array_elements(performance_data)->>'simple_segment' as segment_name
FROM reports
WHERE id = 'b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b'
ORDER BY segment_name;

