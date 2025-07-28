-- Check if YouTube feed sources have profile pictures
SELECT id, name, url, type, favicon_url 
FROM feed_sources 
WHERE type = 'youtube' 
ORDER BY name;

-- Check if the favicon_url column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'feed_sources' AND column_name = 'favicon_url'; 