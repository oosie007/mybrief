-- Verify if feeds were actually committed to the database
-- Run this in your Supabase SQL Editor

-- 1. Check if the user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE id = 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1';

-- 2. Check if user_feeds were actually inserted
SELECT COUNT(*) as total_feeds
FROM user_feeds 
WHERE user_id = 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1';

-- 3. Check all user_feeds records
SELECT 
  user_id,
  feed_source_id,
  is_active,
  created_at
FROM user_feeds 
WHERE user_id = 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1';

-- 4. Check if there are any user_feeds at all
SELECT COUNT(*) as total_user_feeds
FROM user_feeds;

-- 5. Check recent user_feeds insertions
SELECT 
  user_id,
  feed_source_id,
  is_active,
  created_at
FROM user_feeds 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Check if the INSERT statement actually worked
-- This will show if the feeds were added to the correct user
SELECT 
  uf.user_id,
  fs.name,
  fs.type,
  fs.url,
  uf.is_active
FROM user_feeds uf
JOIN feed_sources fs ON uf.feed_source_id = fs.id
WHERE uf.user_id = 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1'
AND uf.is_active = true; 