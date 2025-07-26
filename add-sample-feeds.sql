-- Add sample RSS feeds to the database
-- Run this in your Supabase SQL editor

-- First, let's see what columns exist in feed_sources
-- You can run this to check: SELECT column_name FROM information_schema.columns WHERE table_name = 'feed_sources';

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feed_sources' AND column_name = 'is_active') THEN
        ALTER TABLE feed_sources ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add unique constraint on url if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feed_sources_url_key') THEN
        ALTER TABLE feed_sources ADD CONSTRAINT feed_sources_url_key UNIQUE (url);
    END IF;
END $$;

-- Add some popular RSS feeds
INSERT INTO feed_sources (name, url, type) VALUES
  ('TechCrunch', 'https://techcrunch.com/feed/', 'rss'),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'rss'),
  ('Wired', 'https://www.wired.com/feed/rss', 'rss'),
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'rss'),
  ('Hacker News', 'https://news.ycombinator.com/rss', 'rss')
ON CONFLICT (url) DO NOTHING;

-- Create content_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS content_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_source_id UUID REFERENCES feed_sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  content_type TEXT DEFAULT 'article',
  raw_content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS content_items_url_idx ON content_items(url); 