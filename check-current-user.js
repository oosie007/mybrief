#!/usr/bin/env node

/**
 * Check Current User
 * This script checks what user ID the app is currently using
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentUser() {
  console.log('🔍 Checking Current User...\n');
  
  try {
    // Try to get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ No authenticated user found');
      console.log('Error:', userError.message);
      console.log('\nThis means:');
      console.log('1. You need to log into your app first');
      console.log('2. The app is not authenticated');
      console.log('3. No user-specific content will be shown');
      return;
    }
    
    if (!user) {
      console.log('❌ No user found');
      console.log('You need to log into your app');
      return;
    }
    
    console.log('✅ User found!');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Created at:', user.created_at);
    
    // Check if this user has feeds
    console.log('\n🔍 Checking if this user has feeds...');
    const { data: userFeeds, error: userFeedsError } = await supabase
      .from('user_feeds')
      .select(`
        feed_source_id,
        feed_sources (
          name,
          type,
          url
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    if (userFeedsError) {
      console.error('❌ Error fetching user feeds:', userFeedsError);
    } else {
      console.log('✅ User feeds found:', userFeeds?.length || 0);
      
      if (userFeeds && userFeeds.length > 0) {
        console.log('\nUser feeds:');
        userFeeds.forEach((feed, index) => {
          const feedSource = feed.feed_sources;
          console.log(`${index + 1}. ${feedSource?.name} (${feedSource?.type}) - ${feedSource?.url}`);
        });
        
        // Count by type
        const byType = {};
        userFeeds.forEach(feed => {
          const type = feed.feed_sources?.type || 'unknown';
          byType[type] = (byType[type] || 0) + 1;
        });
        
        console.log('\nFeeds by type:');
        Object.entries(byType).forEach(([type, count]) => {
          console.log(`- ${type}: ${count} feeds`);
        });
      } else {
        console.log('❌ No feeds found for this user');
        console.log('This is why you see demo data instead of real content');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCurrentUser().catch(console.error); 