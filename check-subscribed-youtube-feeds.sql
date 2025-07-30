-- Check what YouTube channels you're subscribed to
SELECT 
  fs.id,
  fs.name as channel_name,
  fs.url as channel_url,
  fs.type,
  uf.is_active
FROM user_feeds uf
JOIN feed_sources fs ON uf.feed_source_id = fs.id
WHERE uf.user_id = 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1'
  AND fs.type = 'youtube'
ORDER BY fs.name; 