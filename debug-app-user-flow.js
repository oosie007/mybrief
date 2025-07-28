#!/usr/bin/env node

/**
 * Debug App User Flow
 * This script simulates the exact flow the app uses to get user content
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAppUserFlow() {
  console.log('🔍 Debugging App User Flow...\n');
  
  try {
    // 1. Simulate what the app does - get current user
    console.log('1. Getting current user (like the app does)...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user:', userError);
      console.log('This means the user is not authenticated in the app');
      return;
    }
    
    if (!user) {
      console.log('❌ No user found - user is not authenticated');
      console.log('The app needs to be logged in to get user-specific content');
      return;
    }
    
    console.log('✅ User found:', user.id);
    console.log('User email:', user.email);
    
    // 2. Check user feeds (like the app does)
    console.log('\n2. Checking user feeds for this user...');
    const { data: userFeeds, error: userFeedsError } = await supabase
      .from('user_feeds')
      .select(`
        feed_source_id,
        feed_sources (
          id,
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
        console.log('User feeds:');
        userFeeds.forEach((feed, index) => {
          const feedSource = feed.feed_sources;
          console.log(`${index + 1}. ${feedSource?.name} (${feedSource?.type}) - ${feedSource?.url}`);
        });
        
        // 3. Check content for this user's feeds
        const feedSourceIds = userFeeds.map(feed => feed.feed_source_id);
        console.log('\n3. Checking content for user\'s feeds...');
        
        const { data: userContent, error: userContentError } = await supabase
          .from('content_items')
          .select(`
            id,
            title,
            content_type,
            published_at,
            feed_source_id,
            feed_sources (
              name,
              type
            )
          `)
          .in('feed_source_id', feedSourceIds)
          .order('published_at', { ascending: false })
          .limit(20);
        
        if (userContentError) {
          console.error('❌ Error fetching user content:', userContentError);
        } else {
          console.log('✅ User content found:', userContent?.length || 0);
          
          if (userContent && userContent.length > 0) {
            console.log('Content by type:');
            const byType = {};
            userContent.forEach(item => {
              const type = item.content_type || 'unknown';
              byType[type] = (byType[type] || 0) + 1;
            });
            
            Object.entries(byType).forEach(([type, count]) => {
              console.log(`- ${type}: ${count} items`);
            });
            
            console.log('\nRecent content:');
            userContent.slice(0, 10).forEach((item, index) => {
              const feedSource = item.feed_sources;
              console.log(`${index + 1}. ${item.title} (${item.content_type}) - ${feedSource?.name} - ${item.published_at}`);
            });
          } else {
            console.log('❌ No content found for user feeds!');
          }
        }
      } else {
        console.log('❌ No user feeds found - this is why you see demo data');
        console.log('The user needs to add feeds to their account');
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugAppUserFlow().catch(console.error); 