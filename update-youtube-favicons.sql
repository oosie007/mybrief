-- Update all YouTube feed sources to use actual favicons
-- This will clear the cached favicon URLs so they get refreshed

UPDATE feed_sources 
SET favicon_url = NULL 
WHERE type = 'youtube';

-- Verify the update
SELECT id, name, url, type, favicon_url 
FROM feed_sources 
WHERE type = 'youtube'; 