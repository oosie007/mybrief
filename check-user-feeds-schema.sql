-- Check the actual schema of user_feeds table
-- Run this in your Supabase SQL editor

-- 1. Check what columns exist in user_feeds
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_feeds'
ORDER BY ordinal_position;

-- 2. Check a few sample records
SELECT * FROM user_feeds LIMIT 5;

-- 3. Check if there are any YouTube feeds
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
WHERE fs.type = 'youtube'
LIMIT 10;

-- 4. Check if there are any YouTube content items
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

-- 5. Check if YouTube fetcher has been run recently
-- Look for recent content items from YouTube feeds
SELECT 
  COUNT(*) as youtube_content_count,
  MIN(published_at) as oldest_youtube_content,
  MAX(published_at) as newest_youtube_content
FROM content_items ci
JOIN feed_sources fs ON ci.feed_source_id = fs.id
WHERE fs.type = 'youtube'; 