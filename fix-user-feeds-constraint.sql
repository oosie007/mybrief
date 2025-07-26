-- Fix the user_feeds table by adding the missing unique constraint
-- This will allow the upsert operation to work properly

-- Add the unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_feeds_user_id_feed_source_id_key'
    ) THEN
        ALTER TABLE user_feeds ADD CONSTRAINT user_feeds_user_id_feed_source_id_key 
        UNIQUE (user_id, feed_source_id);
    END IF;
END $$;

-- Verify the constraint was added
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'user_feeds'::regclass 
AND conname = 'user_feeds_user_id_feed_source_id_key'; 