-- Update segment names and descriptions in shared_reports
-- This updates the segment text in report blocks (charts, tables, text descriptions)

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
                        'Moderately performing', 'Moderately engaged'
                      ),
                      'Hardworking but struggling', 'Highly committed'
                    ),
                    'Highly effortful', 'Highly committed'
                  ),
                  'Low engagement', 'Less engaged'
                ),
                'Low participation', 'Less engaged'
              ),
              'Completion ≥80% + Meeting attendance ≥70% (shows both high performance and active participation in live sessions)', 'Actively participates, contributes with enthusiasm'
            ),
            'Completion ≥80% + Low attempts per task (≤3) + Regular work pattern (≥50% course days) (achieves top results efficiently without excessive effort)', 'Consistently productive, delivers strong results'
          ),
          'Completion 30-80% + Meeting attendance ≥60% + Regular activity (≥40% course days) (solid performance with consistent participation)', 'Participates occasionally, shows average involvement'
        ),
        'Completion 30-80% (average performance, standard engagement)', 'Participates occasionally, shows average involvement'
      ),
      'High effort (above-average submissions and active days) + High struggle score (many attempts per task + low success rate) (putting in effort but facing challenges)', 'Puts in strong effort, motivated but still finding consistency'
    ),
    'Completion <30% with very few submissions (<20) OR very low activity (below-average effort + irregular work pattern) (minimal participation or progress)', 'Limited participation or motivation'
  )::jsonb
WHERE blocks::text ~ '(Leader efficient|Leader engaged|Balanced middle|Low engagement|achieves top results efficiently|putting in effort but facing challenges|average performance, standard engagement)';

-- Verification: Check how many shared reports were updated
SELECT 
  COUNT(*) as updated_reports
FROM shared_reports
WHERE blocks::text ~ '(Highly efficient|Highly engaged|Less engaged|Highly committed)';

-- Show sample of updated reports
SELECT 
  id,
  title,
  report_type,
  updated_at
FROM shared_reports
WHERE blocks::text ~ '(Highly efficient|Highly engaged|Less engaged)'
ORDER BY updated_at DESC
LIMIT 5;

