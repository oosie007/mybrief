#!/usr/bin/env node

/**
 * Check User YouTube Feeds
 * This script checks if YouTube feeds were actually added to the user's account
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserYouTubeFeeds() {
  console.log('🔍 Checking User YouTube Feeds...\n');
  
  try {
    // 1. Check if user has YouTube feeds
    console.log('1. Checking user YouTube feeds...');
    const { data: userYoutubeFeeds, error: userFeedsError } = await supabase
      .from('user_feeds')
      .select(`
        *,
        feed_sources (
          name,
          type,
          url
        )
      `)
      .eq('user_id', 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1')
      .eq('is_active', true);
    
    if (userFeedsError) {
      console.log('❌ Error fetching user feeds:', userFeedsError.message);
    } else {
      const youtubeFeeds = userYoutubeFeeds?.filter(feed => feed.feed_sources?.type === 'youtube') || [];
      console.log('✅ User YouTube feeds found:', youtubeFeeds.length);
      
      if (youtubeFeeds.length > 0) {
        console.log('User YouTube feeds:');
        youtubeFeeds.forEach((feed, index) => {
          console.log(`${index + 1}. ${feed.feed_sources.name} - ${feed.feed_sources.url}`);
        });
      } else {
        console.log('❌ User has NO YouTube feeds! This is the problem.');
      }
    }
    
    // 2. Check if YouTube content exists for these feeds
    console.log('\n2. Checking YouTube content for user feeds...');
    if (userYoutubeFeeds && userYoutubeFeeds.length > 0) {
      const feedSourceIds = userYoutubeFeeds.map(feed => feed.feed_source_id);
      console.log('Feed source IDs:', feedSourceIds);
      
      const { data: youtubeContent, error: contentError } = await supabase
        .from('content_items')
        .select('*')
        .eq('content_type', 'youtube')
        .in('feed_source_id', feedSourceIds)
        .order('published_at', { ascending: false })
        .limit(10);
      
      if (contentError) {
        console.log('❌ Error fetching YouTube content:', contentError.message);
      } else {
        console.log('✅ YouTube content for user feeds:', youtubeContent?.length || 0, 'items');
        
        if (youtubeContent && youtubeContent.length > 0) {
          console.log('Recent YouTube videos for user:');
          youtubeContent.forEach((video, index) => {
            console.log(`${index + 1}. "${video.title}" - ${video.published_at}`);
          });
        } else {
          console.log('❌ No YouTube content found for user feeds');
        }
      }
    }
    
    // 3. Check recent content (last 7 days, not just 24 hours)
    console.log('\n3. Checking recent YouTube content (last 7 days)...');
    const { data: recentYoutube, error: recentError } = await supabase
      .from('content_items')
      .select('*')
      .eq('content_type', 'youtube')
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('published_at', { ascending: false })
      .limit(10);
    
    if (recentError) {
      console.log('❌ Error fetching recent YouTube content:', recentError.message);
    } else {
      console.log('✅ Recent YouTube content (last 7 days):', recentYoutube?.length || 0, 'items');
      
      if (recentYoutube && recentYoutube.length > 0) {
        console.log('Recent YouTube videos:');
        recentYoutube.forEach((video, index) => {
          console.log(`${index + 1}. "${video.title}" - ${video.published_at}`);
        });
      } else {
        console.log('❌ No recent YouTube content found');
      }
    }
    
    // 4. Provide immediate fix
    console.log('\n4. IMMEDIATE FIX:');
    console.log(`
If user has no YouTube feeds, run this SQL in Supabase:

INSERT INTO user_feeds (user_id, feed_source_id, is_active)
SELECT 
  'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1' as user_id,
  id as feed_source_id,
  true as is_active
FROM feed_sources 
WHERE type = 'youtube'
ON CONFLICT (user_id, feed_source_id) DO UPDATE SET
  is_active = true;

Then restart the app and check console logs.
    `);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

checkUserYouTubeFeeds().catch(console.error); 