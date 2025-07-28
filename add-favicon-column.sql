-- Add favicon_url column to feed_sources table
ALTER TABLE feed_sources 
ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'feed_sources' AND column_name = 'favicon_url'; 