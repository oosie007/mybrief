-- Update user feed configuration to allow 100 total articles
UPDATE users 
SET feed_config = '{"articles_per_feed": 10, "total_articles": 100, "time_window_hours": 24, "use_time_window": false}' 
WHERE id = 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1';

-- Verify the update
SELECT id, feed_config FROM users WHERE id = 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1'; 