-- Check existing YouTube feed sources
SELECT id, name, url, type FROM feed_sources 
WHERE url LIKE '%aliabdaal%' OR name LIKE '%aliabdaal%';

-- Update the feed source name to "Ali Abdaal"
UPDATE feed_sources 
SET name = 'Ali Abdaal' 
WHERE url = 'https://www.youtube.com/@aliabdaal';

-- Verify the update
SELECT id, name, url, type FROM feed_sources 
WHERE url LIKE '%aliabdaal%'; 