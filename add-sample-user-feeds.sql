-- Add sample feeds for testing the new feed management interface
-- Run this in your Supabase SQL editor

-- First, let's add some sample feed sources if they don't exist
INSERT INTO feed_sources (name, url, type, is_active) VALUES
  ('TechCrunch', 'https://techcrunch.com/feed/', 'rss', true),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'rss', true),
  ('Wired', 'https://www.wired.com/feed/rss', 'rss', true),
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'rss', true),
  ('Hacker News', 'https://news.ycombinator.com/rss', 'rss', true),
  ('Technology', 'https://reddit.com/r/technology', 'reddit', true),
  ('Programming', 'https://reddit.com/r/programming', 'reddit', true),
  ('WebDev', 'https://reddit.com/r/webdev', 'reddit', true),
  ('ReactJS', 'https://reddit.com/r/reactjs', 'reddit', true),
  ('TechCrunch', 'https://www.youtube.com/@TechCrunch', 'youtube', true),
  ('The Verge', 'https://www.youtube.com/@TheVerge', 'youtube', true),
  ('WIRED', 'https://www.youtube.com/@WIRED', 'youtube', true)
ON CONFLICT (url) DO NOTHING;

-- Now let's add these feeds to a test user (replace 'YOUR_USER_ID' with actual user ID)
-- First, get your user ID:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then run this with your actual user ID:
-- INSERT INTO user_feeds (user_id, feed_source_id, is_active) 
-- SELECT 'YOUR_USER_ID', id, true 
-- FROM feed_sources 
-- WHERE url IN (
--   'https://techcrunch.com/feed/',
--   'https://reddit.com/r/technology',
--   'https://www.youtube.com/@TechCrunch'
-- )
-- ON CONFLICT (user_id, feed_source_id) DO UPDATE SET is_active = true;

-- To get your user ID, run this query:
SELECT id, email FROM auth.users LIMIT 5; 