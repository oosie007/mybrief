-- Add YouTube feeds to the database
-- Run this in your Supabase SQL editor

-- 1. Add YouTube feed sources
INSERT INTO feed_sources (name, url, type, is_active) VALUES
  ('TechCrunch', 'https://www.youtube.com/@TechCrunch', 'youtube', true),
  ('The Verge', 'https://www.youtube.com/@TheVerge', 'youtube', true),
  ('WIRED', 'https://www.youtube.com/@WIRED', 'youtube', true),
  ('How I AI', 'https://www.youtube.com/@howiaipodcast', 'youtube', true)
ON CONFLICT (url) DO NOTHING;

-- 2. Check if you have any YouTube feeds already
SELECT 
  uf.id,
  uf.user_id,
  uf.feed_source_id,
  uf.is_active,
  fs.name as feed_name,
  fs.url as feed_url,
  fs.type as feed_type
FROM user_feeds uf
JOIN feed_sources fs ON uf.feed_source_id = fs.id
WHERE fs.type = 'youtube';

-- 3. If you want to add YouTube feeds to your account, first get your user ID:
SELECT id, email FROM auth.users LIMIT 5;

-- 4. Then add YouTube feeds to your account (replace YOUR_USER_ID):
-- INSERT INTO user_feeds (user_id, feed_source_id, is_active) 
-- SELECT 'YOUR_USER_ID', id, true 
-- FROM feed_sources 
-- WHERE url IN (
--   'https://www.youtube.com/@TechCrunch',
--   'https://www.youtube.com/@TheVerge'
-- )
-- ON CONFLICT (user_id, feed_source_id) DO UPDATE SET is_active = true;

-- 5. Check if there are YouTube content items
SELECT 
  COUNT(*) as youtube_content_count,
  MIN(published_at) as oldest_youtube_content,
  MAX(published_at) as newest_youtube_content
FROM content_items ci
JOIN feed_sources fs ON ci.feed_source_id = fs.id
WHERE fs.type = 'youtube'; 