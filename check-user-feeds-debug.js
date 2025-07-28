#!/usr/bin/env node

/**
 * Check User Feeds Debug
 * This script helps debug why user feeds aren't being added
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserFeedsDebug() {
  console.log('🔍 Debugging User Feeds...\n');
  
  try {
    // 1. Check if we can access auth.users (this might fail with anon key)
    console.log('1. Checking if we can access auth.users...');
    try {
      const { data: users, error: usersError } = await supabase
        .from('auth.users')
        .select('id, email')
        .limit(5);
      
      if (usersError) {
        console.log('❌ Cannot access auth.users with anon key:', usersError.message);
        console.log('This is expected - anon key cannot access auth.users');
      } else {
        console.log('✅ Can access auth.users');
        console.log('Users found:', users?.length || 0);
        if (users && users.length > 0) {
          users.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Error accessing auth.users:', error.message);
    }
    
    // 2. Check user_feeds table structure
    console.log('\n2. Checking user_feeds table...');
    const { data: userFeeds, error: userFeedsError } = await supabase
      .from('user_feeds')
      .select('*')
      .limit(5);
    
    if (userFeedsError) {
      console.error('❌ Error accessing user_feeds:', userFeedsError);
    } else {
      console.log('✅ Can access user_feeds');
      console.log('User feeds found:', userFeeds?.length || 0);
      if (userFeeds && userFeeds.length > 0) {
        console.log('Sample user feeds:');
        userFeeds.forEach((feed, index) => {
          console.log(`${index + 1}. User ID: ${feed.user_id}, Feed Source ID: ${feed.feed_source_id}, Active: ${feed.is_active}`);
        });
      }
    }
    
    // 3. Check feed_sources table
    console.log('\n3. Checking feed_sources table...');
    const { data: feedSources, error: feedSourcesError } = await supabase
      .from('feed_sources')
      .select('id, name, type, url')
      .in('type', ['rss', 'reddit', 'youtube'])
      .limit(10);
    
    if (feedSourcesError) {
      console.error('❌ Error accessing feed_sources:', feedSourcesError);
    } else {
      console.log('✅ Can access feed_sources');
      console.log('Feed sources found:', feedSources?.length || 0);
      if (feedSources && feedSources.length > 0) {
        console.log('Sample feed sources:');
        feedSources.forEach((feed, index) => {
          console.log(`${index + 1}. ID: ${feed.id}, Name: ${feed.name}, Type: ${feed.type}, URL: ${feed.url}`);
        });
      }
    }
    
    // 4. Try to insert a test user feed (this will likely fail with anon key)
    console.log('\n4. Testing insert permission...');
    if (feedSources && feedSources.length > 0) {
      const testFeedId = feedSources[0].id;
      const testUserId = 'test-user-id';
      
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('user_feeds')
          .insert({
            user_id: testUserId,
            feed_source_id: testFeedId,
            is_active: true
          });
        
        if (insertError) {
          console.log('❌ Cannot insert with anon key:', insertError.message);
          console.log('This is expected - you need to use the SQL Editor in Supabase Dashboard');
        } else {
          console.log('✅ Can insert with anon key');
        }
      } catch (error) {
        console.log('❌ Insert test failed:', error.message);
      }
    }
    
    // 5. Provide manual SQL instructions
    console.log('\n5. Manual SQL Instructions:');
    console.log(`
To add feeds to your account, you need to:

1. Go to your Supabase Dashboard
2. Go to SQL Editor
3. Run this query to get your user ID:
   SELECT id, email FROM auth.users LIMIT 5;

4. Then run this query (replace YOUR_USER_ID with your actual user ID):
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

5. After running the SQL, restart your app and check if content appears.
    `);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

checkUserFeedsDebug().catch(console.error); 