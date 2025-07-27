-- Fix foreign key constraint to allow cascade deletes
-- This will automatically delete user_feeds records when feed_sources are deleted

-- First, drop the existing foreign key constraint
ALTER TABLE user_feeds 
DROP CONSTRAINT IF EXISTS user_feeds_feed_source_id_fkey;

-- Then recreate it with CASCADE DELETE
ALTER TABLE user_feeds 
ADD CONSTRAINT user_feeds_feed_source_id_fkey 
FOREIGN KEY (feed_source_id) 
REFERENCES feed_sources(id) 
ON DELETE CASCADE;

-- Verify the constraint was updated
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'user_feeds'
    AND kcu.column_name = 'feed_source_id'; 