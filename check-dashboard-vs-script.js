#!/usr/bin/env node

/**
 * Check Dashboard vs Script Access
 * This script checks if there's a mismatch between what the dashboard shows vs what scripts can access
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDashboardVsScript() {
  console.log('🔍 Checking Dashboard vs Script Access...\n');
  
  try {
    // 1. Check what the script can see in user_feeds
    console.log('1. What the script can see in user_feeds:');
    const { data: userFeeds, error: userFeedsError } = await supabase
      .from('user_feeds')
      .select('*')
      .limit(10);
    
    if (userFeedsError) {
      console.error('❌ Error accessing user_feeds:', userFeedsError);
    } else {
      console.log('✅ user_feeds records found:', userFeeds?.length || 0);
      if (userFeeds && userFeeds.length > 0) {
        console.log('Sample records:');
        userFeeds.forEach((feed, index) => {
          console.log(`${index + 1}. User ID: ${feed.user_id}, Feed Source ID: ${feed.feed_source_id}, Active: ${feed.is_active}`);
        });
      }
    }
    
    // 2. Check what the script can see in feed_sources
    console.log('\n2. What the script can see in feed_sources:');
    const { data: feedSources, error: feedSourcesError } = await supabase
      .from('feed_sources')
      .select('*')
      .limit(10);
    
    if (feedSourcesError) {
      console.error('❌ Error accessing feed_sources:', feedSourcesError);
    } else {
      console.log('✅ feed_sources records found:', feedSources?.length || 0);
      if (feedSources && feedSources.length > 0) {
        console.log('Sample records:');
        feedSources.forEach((source, index) => {
          console.log(`${index + 1}. ID: ${source.id}, Name: ${source.name}, Type: ${source.type}, URL: ${source.url}`);
        });
      }
    }
    
    // 3. Check what the script can see in content_items
    console.log('\n3. What the script can see in content_items:');
    const { data: contentItems, error: contentItemsError } = await supabase
      .from('content_items')
      .select('*')
      .limit(10);
    
    if (contentItemsError) {
      console.error('❌ Error accessing content_items:', contentItemsError);
    } else {
      console.log('✅ content_items records found:', contentItems?.length || 0);
      if (contentItems && contentItems.length > 0) {
        console.log('Sample records:');
        contentItems.forEach((item, index) => {
          console.log(`${index + 1}. ID: ${item.id}, Title: ${item.title?.substring(0, 50)}..., Type: ${item.content_type}, Feed Source ID: ${item.feed_source_id}`);
        });
      }
    }
    
    // 4. Check if there's a permission issue
    console.log('\n4. Checking for permission issues...');
    console.log(`
Possible issues:
1. Dashboard shows data from a different project/environment
2. Script is using different credentials
3. Database permissions are different
4. Data was added to a different user account

The dashboard showed 19 feeds for user b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1
But the script shows 0 feeds.

This suggests either:
- The feeds were added to a different user account
- There's a database permission issue
- The dashboard is showing cached/stale data
    `);
    
    // 5. Check if the specific user ID exists
    console.log('\n5. Checking if user b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1 exists:');
    const { data: specificUserFeeds, error: specificUserError } = await supabase
      .from('user_feeds')
      .select('*')
      .eq('user_id', 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1');
    
    if (specificUserError) {
      console.error('❌ Error checking specific user:', specificUserError);
    } else {
      console.log('✅ Specific user feeds found:', specificUserFeeds?.length || 0);
      if (specificUserFeeds && specificUserFeeds.length > 0) {
        console.log('Feeds for this user:');
        specificUserFeeds.forEach((feed, index) => {
          console.log(`${index + 1}. Feed Source ID: ${feed.feed_source_id}, Active: ${feed.is_active}`);
        });
      } else {
        console.log('❌ No feeds found for this user ID');
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

checkDashboardVsScript().catch(console.error); 