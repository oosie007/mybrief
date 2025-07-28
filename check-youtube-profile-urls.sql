-- Check YouTube feed sources and their profile picture URLs
SELECT 
  id,
  name,
  url,
  type,
  favicon_url,
  CASE 
    WHEN favicon_url IS NOT NULL THEN 'HAS PROFILE PICTURE'
    ELSE 'NO PROFILE PICTURE'
  END as status
FROM feed_sources 
WHERE type = 'youtube' 
ORDER BY name;

-- Check if the favicon_url column exists and has data
SELECT 
  COUNT(*) as total_youtube_feeds,
  COUNT(favicon_url) as feeds_with_profile_pictures,
  COUNT(*) - COUNT(favicon_url) as feeds_without_profile_pictures
FROM feed_sources 
WHERE type = 'youtube'; 