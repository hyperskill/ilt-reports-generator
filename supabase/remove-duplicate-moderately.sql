-- Remove duplicate "Moderately engaged" entries from helpText in shared_reports
-- This happens when multiple old segments were merged into one

UPDATE shared_reports
SET blocks = 
  replace(
    blocks::text,
    '<li><strong>Moderately engaged</strong> - Participates occasionally, shows average involvement</li><li><strong>Moderately engaged</strong> - Participates occasionally, shows average involvement</li>',
    '<li><strong>Moderately engaged</strong> - Participates occasionally, shows average involvement</li>'
  )::jsonb
WHERE blocks::text LIKE '%<li><strong>Moderately engaged</strong> - Participates occasionally, shows average involvement</li><li><strong>Moderately engaged</strong> - Participates occasionally, shows average involvement</li>%';

-- Also try cleaning up any other duplicate patterns
UPDATE shared_reports
SET blocks = 
  regexp_replace(
    blocks::text,
    '("Moderately engaged" - Participates occasionally, shows average involvement[^•]*•[^•]*"Moderately engaged" - Participates occasionally, shows average involvement)',
    '"Moderately engaged" - Participates occasionally, shows average involvement',
    'g'
  )::jsonb
WHERE blocks::text ~ '"Moderately engaged" - Participates occasionally, shows average involvement[^•]*•[^•]*"Moderately engaged" - Participates occasionally, shows average involvement';

-- Verification
SELECT 
  id,
  title,
  (blocks::text LIKE '%Moderately engaged%Moderately engaged%') as still_has_duplicate
FROM shared_reports
WHERE blocks::text LIKE '%Moderately engaged%'
LIMIT 10;

