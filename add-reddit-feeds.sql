-- Add sample Reddit feed sources
-- This script adds popular Reddit subreddits as feed sources

-- Check if Reddit feed sources already exist
DO $$ 
BEGIN
    -- Add Technology subreddit
    IF NOT EXISTS (
        SELECT 1 FROM feed_sources 
        WHERE url = 'https://reddit.com/r/technology'
    ) THEN
        INSERT INTO feed_sources (name, url, type, is_active, description) 
        VALUES ('Technology', 'https://reddit.com/r/technology', 'reddit', true, 'Technology news and discussions');
        RAISE NOTICE 'Added Technology Reddit feed';
    ELSE
        RAISE NOTICE 'Technology Reddit feed already exists';
    END IF;

    -- Add Programming subreddit
    IF NOT EXISTS (
        SELECT 1 FROM feed_sources 
        WHERE url = 'https://reddit.com/r/programming'
    ) THEN
        INSERT INTO feed_sources (name, url, type, is_active, description) 
        VALUES ('Programming', 'https://reddit.com/r/programming', 'reddit', true, 'Programming discussions and news');
        RAISE NOTICE 'Added Programming Reddit feed';
    ELSE
        RAISE NOTICE 'Programming Reddit feed already exists';
    END IF;

    -- Add WebDev subreddit
    IF NOT EXISTS (
        SELECT 1 FROM feed_sources 
        WHERE url = 'https://reddit.com/r/webdev'
    ) THEN
        INSERT INTO feed_sources (name, url, type, is_active, description) 
        VALUES ('WebDev', 'https://reddit.com/r/webdev', 'reddit', true, 'Web development discussions');
        RAISE NOTICE 'Added WebDev Reddit feed';
    ELSE
        RAISE NOTICE 'WebDev Reddit feed already exists';
    END IF;

    -- Add ReactJS subreddit
    IF NOT EXISTS (
        SELECT 1 FROM feed_sources 
        WHERE url = 'https://reddit.com/r/reactjs'
    ) THEN
        INSERT INTO feed_sources (name, url, type, is_active, description) 
        VALUES ('ReactJS', 'https://reddit.com/r/reactjs', 'reddit', true, 'React.js discussions and news');
        RAISE NOTICE 'Added ReactJS Reddit feed';
    ELSE
        RAISE NOTICE 'ReactJS Reddit feed already exists';
    END IF;

    -- Add JavaScript subreddit
    IF NOT EXISTS (
        SELECT 1 FROM feed_sources 
        WHERE url = 'https://reddit.com/r/javascript'
    ) THEN
        INSERT INTO feed_sources (name, url, type, is_active, description) 
        VALUES ('JavaScript', 'https://reddit.com/r/javascript', 'reddit', true, 'JavaScript discussions and news');
        RAISE NOTICE 'Added JavaScript Reddit feed';
    ELSE
        RAISE NOTICE 'JavaScript Reddit feed already exists';
    END IF;

END $$;

-- Show all Reddit feed sources
SELECT 
    id,
    name,
    url,
    type,
    is_active,
    created_at
FROM feed_sources 
WHERE type = 'reddit'
ORDER BY name;

-- Show count of Reddit feed sources
SELECT 
    COUNT(*) as total_reddit_feeds,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_reddit_feeds
FROM feed_sources 
WHERE type = 'reddit'; 