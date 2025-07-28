#!/usr/bin/env node

/**
 * Add Feeds to User Account
 * This script adds feeds to a user account
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addFeedsToUserAccount() {
  console.log('🔧 Adding feeds to user account...\n');
  
  try {
    // 1. Get some feed sources to add
    console.log('1. Getting available feed sources...');
    const { data: feedSources, error: feedError } = await supabase
      .from('feed_sources')
      .select('*')
      .in('type', ['rss', 'reddit', 'youtube'])
      .limit(15);
    
    if (feedError) {
      console.error('Error fetching feed sources:', feedError);
      return;
    }
    
    console.log('Found feed sources:', feedSources?.length || 0);
    
    // 2. Show available feeds
    console.log('\n2. Available feeds to add:');
    feedSources?.forEach((feed, index) => {
      console.log(`${index + 1}. ${feed.name} (${feed.type}) - ${feed.url}`);
    });
    
    // 3. For now, let's create a SQL script to add feeds
    console.log('\n3. SQL script to add feeds to your account:');
    console.log(`
-- First, get your user ID:
SELECT id, email FROM auth.users LIMIT 5;

-- Then add these feeds to your account (replace YOUR_USER_ID):
INSERT INTO user_feeds (user_id, feed_source_id, is_active) 
SELECT 'YOUR_USER_ID', id, true 
FROM feed_sources 
WHERE url IN (
  'https://techcrunch.com/feed/',
  'https://reddit.com/r/technology',
  'https://www.youtube.com/@TechCrunch',
  'https://www.youtube.com/@TheVerge',
  'https://www.youtube.com/@WIRED'
)
ON CONFLICT (user_id, feed_source_id) DO UPDATE SET is_active = true;
    `);
    
    // 4. Check if there are any user feeds already
    console.log('\n4. Checking existing user feeds...');
    const { data: userFeeds, error: userFeedsError } = await supabase
      .from('user_feeds')
      .select(`
        *,
        feed_sources (
          name,
          type,
          url
        )
      `)
      .limit(10);
    
    if (userFeedsError) {
      console.error('Error fetching user feeds:', userFeedsError);
    } else {
      console.log('Existing user feeds:', userFeeds?.length || 0);
      if (userFeeds && userFeeds.length > 0) {
        userFeeds.forEach((feed, index) => {
          const feedSource = feed.feed_sources;
          console.log(`${index + 1}. ${feedSource?.name} (${feedSource?.type}) - ${feedSource?.url}`);
        });
      } else {
        console.log('No user feeds found - this is why you see demo data!');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addFeedsToUserAccount().catch(console.error); 