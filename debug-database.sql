-- Debug Database State
-- Run this in your Supabase SQL Editor to check the current state

-- 1. Check if user_feeds table exists and has the right structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_feeds'
ORDER BY ordinal_position;

-- 2. Check if there are any users
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- 3. Check if there are any feed_sources
SELECT id, name, url, type, is_active FROM feed_sources LIMIT 10;

-- 4. Check if there are any user_feeds (replace 'YOUR_USER_ID' with actual user ID)
-- First, get your user ID:
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then check user_feeds for that user (replace with actual user ID):
-- SELECT uf.id, uf.user_id, uf.feed_source_id, uf.is_active, fs.name, fs.url
-- FROM user_feeds uf
-- JOIN feed_sources fs ON uf.feed_source_id = fs.id
-- WHERE uf.user_id = 'YOUR_USER_ID';

-- 5. Check if there are any content_items
SELECT id, title, feed_source_id, published_at FROM content_items LIMIT 10;

-- 6. Check the full flow for a specific user (replace 'YOUR_USER_ID'):
-- SELECT 
--   uf.user_id,
--   fs.name as feed_name,
--   fs.url as feed_url,
--   ci.title as content_title,
--   ci.published_at
-- FROM user_feeds uf
-- JOIN feed_sources fs ON uf.feed_source_id = fs.id
-- LEFT JOIN content_items ci ON fs.id = ci.feed_source_id
-- WHERE uf.user_id = 'YOUR_USER_ID' AND uf.is_active = true
-- ORDER BY ci.published_at DESC; 