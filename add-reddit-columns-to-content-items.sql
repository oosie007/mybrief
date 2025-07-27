-- Add Reddit-specific columns to content_items table
-- This script adds columns needed for Reddit content metadata

-- Check if columns already exist before adding them
DO $$ 
BEGIN
    -- Add author column (for RSS content)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'content_items' 
        AND column_name = 'author'
    ) THEN
        ALTER TABLE content_items ADD COLUMN author TEXT;
        RAISE NOTICE 'Added author column to content_items table';
    ELSE
        RAISE NOTICE 'author column already exists in content_items table';
    END IF;

    -- Add score column (upvotes)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'content_items' 
        AND column_name = 'score'
    ) THEN
        ALTER TABLE content_items ADD COLUMN score INTEGER DEFAULT 0;
        RAISE NOTICE 'Added score column to content_items table';
    ELSE
        RAISE NOTICE 'score column already exists in content_items table';
    END IF;

    -- Add num_comments column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'content_items' 
        AND column_name = 'num_comments'
    ) THEN
        ALTER TABLE content_items ADD COLUMN num_comments INTEGER DEFAULT 0;
        RAISE NOTICE 'Added num_comments column to content_items table';
    ELSE
        RAISE NOTICE 'num_comments column already exists in content_items table';
    END IF;

    -- Add subreddit column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'content_items' 
        AND column_name = 'subreddit'
    ) THEN
        ALTER TABLE content_items ADD COLUMN subreddit TEXT;
        RAISE NOTICE 'Added subreddit column to content_items table';
    ELSE
        RAISE NOTICE 'subreddit column already exists in content_items table';
    END IF;

    -- Add permalink column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'content_items' 
        AND column_name = 'permalink'
    ) THEN
        ALTER TABLE content_items ADD COLUMN permalink TEXT;
        RAISE NOTICE 'Added permalink column to content_items table';
    ELSE
        RAISE NOTICE 'permalink column already exists in content_items table';
    END IF;

    -- Add is_self column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'content_items' 
        AND column_name = 'is_self'
    ) THEN
        ALTER TABLE content_items ADD COLUMN is_self BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_self column to content_items table';
    ELSE
        RAISE NOTICE 'is_self column already exists in content_items table';
    END IF;

    -- Add domain column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'content_items' 
        AND column_name = 'domain'
    ) THEN
        ALTER TABLE content_items ADD COLUMN domain TEXT;
        RAISE NOTICE 'Added domain column to content_items table';
    ELSE
        RAISE NOTICE 'domain column already exists in content_items table';
    END IF;
END $$;

-- Create indexes for better performance on Reddit-specific queries
CREATE INDEX IF NOT EXISTS idx_content_items_score ON content_items(score) WHERE content_type = 'reddit';
CREATE INDEX IF NOT EXISTS idx_content_items_num_comments ON content_items(num_comments) WHERE content_type = 'reddit';
CREATE INDEX IF NOT EXISTS idx_content_items_subreddit ON content_items(subreddit) WHERE content_type = 'reddit';
CREATE INDEX IF NOT EXISTS idx_content_items_author ON content_items(author) WHERE content_type = 'reddit';

-- Add comments to document the new columns
COMMENT ON COLUMN content_items.author IS 'Author name for RSS content';
COMMENT ON COLUMN content_items.score IS 'Reddit upvotes count for Reddit content';
COMMENT ON COLUMN content_items.num_comments IS 'Reddit comments count for Reddit content';
COMMENT ON COLUMN content_items.subreddit IS 'Subreddit name for Reddit content';
COMMENT ON COLUMN content_items.permalink IS 'Reddit permalink URL for Reddit content';
COMMENT ON COLUMN content_items.is_self IS 'Whether Reddit post is a text post (self post)';
COMMENT ON COLUMN content_items.domain IS 'Domain of external link for Reddit content';

-- Show the updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'content_items' 
ORDER BY ordinal_position; 