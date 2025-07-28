-- Add YouTube feeds to user account
-- First, let's see what YouTube feed sources are available
SELECT id, name, type, url FROM feed_sources WHERE type = 'youtube';

-- Now add YouTube feeds to the user
INSERT INTO user_feeds (user_id, feed_source_id, is_active, created_at)
SELECT 
  'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1' as user_id,
  id as feed_source_id,
  true as is_active,
  NOW() as created_at
FROM feed_sources 
WHERE type = 'youtube'
ON CONFLICT (user_id, feed_source_id) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- Verify the user now has YouTube feeds
SELECT 
  uf.id,
  uf.user_id,
  uf.is_active,
  fs.name,
  fs.type,
  fs.url
FROM user_feeds uf
JOIN feed_sources fs ON uf.feed_source_id = fs.id
WHERE uf.user_id = 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1'
  AND fs.type = 'youtube'
  AND uf.is_active = true; 