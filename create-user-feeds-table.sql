-- Create user_feeds table if it doesn't exist
-- This table links users to their subscribed feeds

CREATE TABLE IF NOT EXISTS user_feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feed_source_id UUID REFERENCES feed_sources(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feed_source_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS user_feeds_user_id_idx ON user_feeds(user_id);
CREATE INDEX IF NOT EXISTS user_feeds_feed_source_id_idx ON user_feeds(feed_source_id);
CREATE INDEX IF NOT EXISTS user_feeds_active_idx ON user_feeds(is_active);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_feeds ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own feed subscriptions
CREATE POLICY "Users can view their own feed subscriptions" ON user_feeds
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own feed subscriptions
CREATE POLICY "Users can insert their own feed subscriptions" ON user_feeds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own feed subscriptions
CREATE POLICY "Users can update their own feed subscriptions" ON user_feeds
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own feed subscriptions
CREATE POLICY "Users can delete their own feed subscriptions" ON user_feeds
  FOR DELETE USING (auth.uid() = user_id); 