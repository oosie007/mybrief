-- Remove specific YouTube feeds to re-add them fresh
-- First, get the feed source IDs for these channels
SELECT id, name, url FROM feed_sources 
WHERE type = 'youtube' AND name IN ('Ali Abdaal', 'Tiago Forte', 'Greg Isenberg');

-- Then remove them from user_feeds (replace the IDs with actual values from above query)
-- DELETE FROM user_feeds WHERE feed_source_id IN ('feed-source-id-1', 'feed-source-id-2', 'feed-source-id-3');

-- Finally remove from feed_sources
-- DELETE FROM feed_sources WHERE name IN ('Ali Abdaal', 'Tiago Forte', 'Greg Isenberg'); 