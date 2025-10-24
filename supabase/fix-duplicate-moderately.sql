-- Remove duplicate "Moderately engaged" bullet point from helpText
-- Simple text replacement approach

UPDATE shared_reports
SET blocks = 
  replace(
    blocks::text,
    '</li><li><strong>Moderately engaged</strong> - Participates occasionally, shows average involvement</li><li><strong>Moderately engaged</strong>',
    '</li><li><strong>Moderately engaged</strong>'
  )::jsonb
WHERE blocks::text LIKE '%</li><li><strong>Moderately engaged</strong> - Participates occasionally, shows average involvement</li><li><strong>Moderately engaged</strong>%';

-- Verification: count how many times "Moderately engaged" appears in each report
SELECT 
  id,
  title,
  (LENGTH(blocks::text) - LENGTH(REPLACE(blocks::text, '<strong>Moderately engaged</strong>', ''))) / LENGTH('<strong>Moderately engaged</strong>') AS moderately_count
FROM shared_reports
WHERE blocks::text LIKE '%Moderately engaged%'
ORDER BY moderately_count DESC
LIMIT 10;

