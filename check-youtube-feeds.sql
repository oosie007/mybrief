-- Check YouTube feeds and content for your user
-- Run this in your Supabase SQL editor

-- 1. First, get your user ID:
SELECT id, email FROM auth.users LIMIT 5;

-- 2. Check if you have any YouTube feeds (replace YOUR_USER_ID):
-- SELECT 
--   uf.id,
--   uf.user_id,
--   uf.feed_source_id,
--   uf.is_active,
--   fs.name as feed_name,
--   fs.url as feed_url,
--   fs.type as feed_type
-- FROM user_feeds uf
-- JOIN feed_sources fs ON uf.feed_source_id = fs.id
-- WHERE uf.user_id = 'YOUR_USER_ID' AND fs.type = 'youtube';

-- 3. Check all your user feeds (replace YOUR_USER_ID):
-- SELECT 
--   uf.id,
--   uf.user_id,
--   uf.feed_source_id,
--   uf.is_active,
--   fs.name as feed_name,
--   fs.url as feed_url,
--   fs.type as feed_type
-- FROM user_feeds uf
-- JOIN feed_sources fs ON uf.feed_source_id = fs.id
-- WHERE uf.user_id = 'YOUR_USER_ID'
-- ORDER BY fs.type, fs.name;

-- 4. Check if there are any YouTube content items at all:
SELECT 
  COUNT(*) as total_youtube_content,
  MIN(published_at) as oldest_youtube_content,
  MAX(published_at) as newest_youtube_content
FROM content_items ci
JOIN feed_sources fs ON ci.feed_source_id = fs.id
WHERE fs.type = 'youtube';

-- 5. Show recent YouTube content:
SELECT 
  ci.id,
  ci.title,
  ci.url,
  ci.content_type,
  ci.published_at,
  fs.name as feed_name,
  fs.type as feed_type
FROM content_items ci
JOIN feed_sources fs ON ci.feed_source_id = fs.id
WHERE fs.type = 'youtube'
ORDER BY ci.published_at DESC
LIMIT 10;

-- 6. Check all YouTube feed sources:
SELECT 
  id,
  name,
  url,
  type,
  is_active
FROM feed_sources 
WHERE type = 'youtube'
ORDER BY name;

-- 7. Check if your specific YouTube channel exists (replace with your channel URL):
-- SELECT 
--   id,
--   name,
--   url,
--   type,
--   is_active
-- FROM feed_sources 
-- WHERE url LIKE '%your-channel-name%' OR name LIKE '%your-channel-name%'; 