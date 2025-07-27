-- Fix ALL foreign key constraints to allow cascade deletes from feed_sources
-- This will automatically delete related records when feed_sources are deleted

-- 1. Fix user_feeds foreign key constraint
ALTER TABLE user_feeds 
DROP CONSTRAINT IF EXISTS user_feeds_feed_source_id_fkey;

ALTER TABLE user_feeds 
ADD CONSTRAINT user_feeds_feed_source_id_fkey 
FOREIGN KEY (feed_source_id) 
REFERENCES feed_sources(id) 
ON DELETE CASCADE;

-- 2. Fix content_items foreign key constraint
ALTER TABLE content_items 
DROP CONSTRAINT IF EXISTS content_items_feed_source_id_fkey;

ALTER TABLE content_items 
ADD CONSTRAINT content_items_feed_source_id_fkey 
FOREIGN KEY (feed_source_id) 
REFERENCES feed_sources(id) 
ON DELETE CASCADE;

-- 3. Verify all constraints were updated
SELECT 
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
    AND ccu.table_name = 'feed_sources'
ORDER BY tc.table_name, kcu.column_name; 