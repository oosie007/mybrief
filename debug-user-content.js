#!/usr/bin/env node

/**
 * Debug User Content
 * This script helps debug why content isn't showing up for a specific user
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserContent() {
  console.log('🔍 Debugging User Content...\n');
  
  try {
    // 1. Check all users
    console.log('1. Checking all users...');
    const { data: users, error: usersError } = await supabase
      .from('user_feeds')
      .select('user_id')
      .limit(10);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      const uniqueUsers = [...new Set(users?.map(u => u.user_id) || [])];
      console.log('Users with feeds:', uniqueUsers.length);
      console.log('User IDs:', uniqueUsers);
    }
    
    // 2. Check user feeds for the first user
    if (users && users.length > 0) {
      const userId = users[0].user_id;
      console.log(`\n2. Checking user feeds for user: ${userId}`);
      
      const { data: userFeeds, error: userFeedsError } = await supabase
        .from('user_feeds')
        .select(`
          *,
          feed_sources (
            id,
            name,
            url,
            type,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (userFeedsError) {
        console.error('Error fetching user feeds:', userFeedsError);
      } else {
        console.log('User feeds found:', userFeeds?.length || 0);
        if (userFeeds && userFeeds.length > 0) {
          console.log('User feeds:');
          userFeeds.forEach((feed, index) => {
            const feedSource = feed.feed_sources;
            console.log(`${index + 1}. ${feedSource?.name} (${feedSource?.type}) - ${feedSource?.url}`);
          });
          
          // 3. Check content for this user's feeds
          const feedSourceIds = userFeeds.map(feed => feed.feed_source_id);
          console.log(`\n3. Checking content for ${feedSourceIds.length} feed sources...`);
          
          const { data: userContent, error: userContentError } = await supabase
            .from('content_items')
            .select(`
              id,
              title,
              url,
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
            console.error('Error fetching user content:', userContentError);
          } else {
            console.log('User content found:', userContent?.length || 0);
            if (userContent && userContent.length > 0) {
              console.log('User content by type:');
              const byType = {};
              userContent.forEach(item => {
                const type = item.content_type || 'unknown';
                byType[type] = (byType[type] || 0) + 1;
              });
              
              Object.entries(byType).forEach(([type, count]) => {
                console.log(`- ${type}: ${count} items`);
              });
              
              console.log('\nRecent user content:');
              userContent.slice(0, 10).forEach((item, index) => {
                const feedSource = item.feed_sources;
                console.log(`${index + 1}. ${item.title} (${item.content_type}) - ${feedSource?.name} - ${item.published_at}`);
              });
            } else {
              console.log('No content found for user feeds!');
            }
          }
        }
      }
    }
    
    // 4. Check if there are any YouTube content items at all
    console.log('\n4. Checking all YouTube content...');
    const { data: allYouTubeContent, error: allYouTubeError } = await supabase
      .from('content_items')
      .select(`
        id,
        title,
        content_type,
        published_at,
        feed_sources (
          name,
          type
        )
      `)
      .eq('content_type', 'youtube')
      .order('published_at', { ascending: false })
      .limit(10);
    
    if (allYouTubeError) {
      console.error('Error fetching all YouTube content:', allYouTubeError);
    } else {
      console.log('Total YouTube content found:', allYouTubeContent?.length || 0);
      if (allYouTubeContent && allYouTubeContent.length > 0) {
        console.log('Recent YouTube content:');
        allYouTubeContent.forEach((item, index) => {
          const feedSource = item.feed_sources;
          console.log(`${index + 1}. ${item.title} - ${feedSource?.name} - ${item.published_at}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugUserContent().catch(console.error); 