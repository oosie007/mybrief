-- Check if YourAverageTechBro videos are being fetched
SELECT 
  ci.id,
  ci.title,
  ci.published_at,
  ci.content_type,
  fs.name as channel_name,
  fs.url as channel_url
FROM content_items ci
JOIN feed_sources fs ON ci.feed_source_id = fs.id
WHERE fs.name LIKE '%YourAverageTechBro%'
  OR fs.url LIKE '%youraveragetechbro%'
ORDER BY ci.published_at DESC
LIMIT 10; 