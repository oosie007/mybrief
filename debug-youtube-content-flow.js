#!/usr/bin/env node

/**
 * Debug YouTube Content Flow
 * This script debugs the complete flow from database to frontend
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugYouTubeContentFlow() {
  console.log('🔍 Debugging YouTube Content Flow...\n');
  
  try {
    // 1. Check if YouTube content exists in database
    console.log('1. Checking YouTube content in database...');
    const { data: youtubeContent, error: youtubeError } = await supabase
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
          type,
          url
        )
      `)
      .eq('content_type', 'youtube')
      .order('published_at', { ascending: false })
      .limit(5);
    
    if (youtubeError) {
      console.error('❌ Error fetching YouTube content:', youtubeError);
    } else {
      console.log('✅ YouTube content found:', youtubeContent?.length || 0);
      if (youtubeContent && youtubeContent.length > 0) {
        console.log('Recent YouTube content:');
        youtubeContent.forEach((item, index) => {
          const feedSource = item.feed_sources;
          console.log(`${index + 1}. ${item.title} - ${feedSource?.name} - ${item.published_at}`);
        });
      }
    }
    
    // 2. Check if user has YouTube feeds
    console.log('\n2. Checking user YouTube feeds...');
    const { data: userFeeds, error: userFeedsError } = await supabase
      .from('user_feeds')
      .select(`
        user_id,
        feed_source_id,
        is_active,
        feed_sources (
          name,
          type,
          url
        )
      `)
      .eq('is_active', true);
    
    if (userFeedsError) {
      console.error('❌ Error fetching user feeds:', userFeedsError);
    } else {
      console.log('✅ User feeds found:', userFeeds?.length || 0);
      
      // Filter YouTube feeds
      const youtubeFeeds = userFeeds?.filter(feed => feed.feed_sources?.type === 'youtube') || [];
      console.log('YouTube feeds subscribed:', youtubeFeeds.length);
      
      if (youtubeFeeds.length > 0) {
        console.log('User YouTube feeds:');
        youtubeFeeds.forEach((feed, index) => {
          const feedSource = feed.feed_sources;
          console.log(`${index + 1}. ${feedSource?.name} - ${feedSource?.url}`);
        });
      }
    }
    
    // 3. Check if YouTube content matches user's subscribed feeds
    console.log('\n3. Checking content for user\'s YouTube feeds...');
    if (userFeeds && userFeeds.length > 0) {
      const userFeedSourceIds = userFeeds.map(feed => feed.feed_source_id);
      const youtubeFeedSourceIds = userFeeds
        .filter(feed => feed.feed_sources?.type === 'youtube')
        .map(feed => feed.feed_source_id);
      
      console.log('User feed source IDs:', userFeedSourceIds.length);
      console.log('YouTube feed source IDs:', youtubeFeedSourceIds.length);
      
      if (youtubeFeedSourceIds.length > 0) {
        const { data: userYouTubeContent, error: userYouTubeError } = await supabase
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
          .eq('content_type', 'youtube')
          .in('feed_source_id', youtubeFeedSourceIds)
          .order('published_at', { ascending: false })
          .limit(10);
        
        if (userYouTubeError) {
          console.error('❌ Error fetching user YouTube content:', userYouTubeError);
        } else {
          console.log('✅ User YouTube content found:', userYouTubeContent?.length || 0);
          if (userYouTubeContent && userYouTubeContent.length > 0) {
            console.log('User YouTube content:');
            userYouTubeContent.forEach((item, index) => {
              const feedSource = item.feed_sources;
              console.log(`${index + 1}. ${item.title} - ${feedSource?.name} - ${item.published_at}`);
            });
          } else {
            console.log('❌ No YouTube content found for user\'s subscribed feeds!');
          }
        }
      }
    }
    
    // 4. Check the digest generator logic
    console.log('\n4. Analyzing digest generator logic...');
    console.log(`
The app uses aggregateUserContent() function which:
1. Gets user feeds from user_feeds table
2. Filters content by feed_source_id
3. Returns content items for display

If user has YouTube feeds but no content shows, the issue could be:
- Frontend not calling aggregateUserContent()
- Frontend filtering out YouTube content
- Frontend not rendering YouTube cards properly
    `);
    
    // 5. Check if there's a mismatch between feed sources and content
    console.log('\n5. Checking feed source to content mapping...');
    const { data: allFeedSources, error: feedSourcesError } = await supabase
      .from('feed_sources')
      .select('id, name, type, url')
      .eq('type', 'youtube');
    
    if (feedSourcesError) {
      console.error('❌ Error fetching feed sources:', feedSourcesError);
    } else {
      console.log('✅ YouTube feed sources found:', allFeedSources?.length || 0);
      if (allFeedSources && allFeedSources.length > 0) {
        console.log('YouTube feed sources:');
        allFeedSources.forEach((feed, index) => {
          console.log(`${index + 1}. ID: ${feed.id}, Name: ${feed.name}, URL: ${feed.url}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugYouTubeContentFlow().catch(console.error); 