-- Add YouTube feeds to user account
-- Replace 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1' with your actual user ID

INSERT INTO user_feeds (user_id, feed_source_id, is_active) 
SELECT 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1', id, true 
FROM feed_sources 
WHERE url IN (
  'https://www.youtube.com/@TechCrunch',
  'https://www.youtube.com/@TheVerge',
  'https://www.youtube.com/@WIRED',
  'https://www.youtube.com/@howiaipodcast'
)
ON CONFLICT (user_id, feed_source_id) DO UPDATE SET is_active = true;

-- Verify YouTube feeds were added
SELECT 
  uf.user_id,
  fs.name,
  fs.type,
  fs.url
FROM user_feeds uf
JOIN feed_sources fs ON uf.feed_source_id = fs.id
WHERE uf.user_id = 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1'
AND fs.type = 'youtube'
AND uf.is_active = true; 