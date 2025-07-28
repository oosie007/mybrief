-- Create read_articles table to track read status of articles
CREATE TABLE IF NOT EXISTS read_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_item_id)
);

-- Add RLS policies for read_articles table
ALTER TABLE read_articles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own read articles
CREATE POLICY "Users can view their own read articles" ON read_articles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own read articles
CREATE POLICY "Users can insert their own read articles" ON read_articles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own read articles
CREATE POLICY "Users can update their own read articles" ON read_articles
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own read articles
CREATE POLICY "Users can delete their own read articles" ON read_articles
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_read_articles_user_content ON read_articles(user_id, content_item_id); 