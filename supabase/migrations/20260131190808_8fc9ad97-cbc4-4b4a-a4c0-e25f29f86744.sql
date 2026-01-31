-- Fix last 2 cases with hyphen format
UPDATE scouted_properties SET
  title = REPLACE(title, ', יפו', ', ' || neighborhood)
WHERE source = 'homeless'
  AND is_active = true
  AND title LIKE '%, יפו'
  AND neighborhood IS NOT NULL
  AND neighborhood != 'יפו';