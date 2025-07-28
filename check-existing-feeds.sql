-- Check existing feeds in the database
-- Run this in your Supabase SQL editor to see what's already there

-- 1. Check all feed sources
SELECT 
  id,
  name,
  url,
  type,
  is_active,
  created_at
FROM feed_sources 
ORDER BY created_at DESC;

-- 2. Check user feeds (replace 'YOUR_USER_ID' with your actual user ID)
-- First, get your user ID:
SELECT id, email FROM auth.users LIMIT 5;

-- Then check your feeds (replace YOUR_USER_ID):
-- SELECT 
--   uf.id,
--   uf.user_id,
--   uf.feed_source_id,
--   uf.is_active,
--   uf.created_at,
--   fs.name as feed_name,
--   fs.url as feed_url,
--   fs.type as feed_type
-- FROM user_feeds uf
-- JOIN feed_sources fs ON uf.feed_source_id = fs.id
-- WHERE uf.user_id = 'YOUR_USER_ID'
-- ORDER BY uf.created_at DESC;

-- 3. Count feeds by type
SELECT 
  type,
  COUNT(*) as count
FROM feed_sources 
GROUP BY type
ORDER BY count DESC;

-- 4. Check if there are any active user feeds
SELECT 
  COUNT(*) as total_user_feeds,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_feeds
FROM user_feeds; 