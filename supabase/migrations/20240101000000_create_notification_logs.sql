-- Add notification fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS digest_time TIME DEFAULT '07:00:00',
ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Create notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily_digest', 'new_content', 'reminder', 'system')),
  data JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expo_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_users_notification_enabled ON users(notification_enabled);
CREATE INDEX IF NOT EXISTS idx_users_expo_push_token ON users(expo_push_token);

-- Enable RLS on notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_logs
CREATE POLICY "Users can view their own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notification logs" ON notification_logs
  FOR INSERT WITH CHECK (true);

-- Create function to clean up old notification logs
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_logs 
  WHERE sent_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old logs (runs daily)
SELECT cron.schedule(
  'cleanup-notification-logs',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT cleanup_old_notification_logs();'
); 