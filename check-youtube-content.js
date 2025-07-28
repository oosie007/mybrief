#!/usr/bin/env node

/**
 * Check YouTube Content
 * This script checks if YouTube content exists in the database
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkYouTubeContent() {
  console.log('🔍 Checking YouTube Content...\n');
  
  try {
    // 1. Check if YouTube content exists in content_items
    console.log('1. Checking YouTube content in content_items...');
    const { data: youtubeContent, error: youtubeError } = await supabase
      .from('content_items')
      .select('*')
      .eq('content_type', 'youtube')
      .order('published_at', { ascending: false })
      .limit(10);
    
    if (youtubeError) {
      console.log('❌ Error fetching YouTube content:', youtubeError.message);
    } else {
      console.log('✅ YouTube content found:', youtubeContent?.length || 0, 'items');
      
      if (youtubeContent && youtubeContent.length > 0) {
        console.log('Recent YouTube videos:');
        youtubeContent.forEach((video, index) => {
          console.log(`${index + 1}. "${video.title}" - ${video.published_at}`);
        });
      } else {
        console.log('❌ No YouTube content found in database');
      }
    }
    
    // 2. Check YouTube feed sources
    console.log('\n2. Checking YouTube feed sources...');
    const { data: youtubeFeeds, error: feedsError } = await supabase
      .from('feed_sources')
      .select('*')
      .eq('type', 'youtube');
    
    if (feedsError) {
      console.log('❌ Error fetching YouTube feeds:', feedsError.message);
    } else {
      console.log('✅ YouTube feed sources found:', youtubeFeeds?.length || 0);
      
      if (youtubeFeeds && youtubeFeeds.length > 0) {
        console.log('YouTube feed sources:');
        youtubeFeeds.forEach((feed, index) => {
          console.log(`${index + 1}. ${feed.name} - ${feed.url}`);
        });
      } else {
        console.log('❌ No YouTube feed sources found');
      }
    }
    
    // 3. Check user's YouTube feeds
    console.log('\n3. Checking user YouTube feeds...');
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
      console.log('❌ Error fetching user YouTube feeds:', userFeedsError.message);
    } else {
      const youtubeUserFeeds = userYoutubeFeeds?.filter(feed => feed.feed_sources?.type === 'youtube') || [];
      console.log('✅ User YouTube feeds found:', youtubeUserFeeds.length);
      
      if (youtubeUserFeeds.length > 0) {
        console.log('User YouTube feeds:');
        youtubeUserFeeds.forEach((feed, index) => {
          console.log(`${index + 1}. ${feed.feed_sources.name} - ${feed.feed_sources.url}`);
        });
      } else {
        console.log('❌ User has no YouTube feeds');
      }
    }
    
    // 4. Check recent content by type
    console.log('\n4. Checking recent content by type...');
    const { data: recentContent, error: recentError } = await supabase
      .from('content_items')
      .select('content_type, published_at')
      .gte('published_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('published_at', { ascending: false });
    
    if (recentError) {
      console.log('❌ Error fetching recent content:', recentError.message);
    } else {
      const byType = {};
      recentContent?.forEach(item => {
        const type = item.content_type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });
      
      console.log('Recent content by type (last 24 hours):');
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`- ${type}: ${count} items`);
      });
    }
    
    // 5. Provide solutions
    console.log('\n5. Solutions:');
    if (!youtubeContent || youtubeContent.length === 0) {
      console.log(`
❌ No YouTube content found. Possible solutions:

1. Run the YouTube fetcher manually:
   curl -X POST "https://dgfmvoxvnojfkhooqggq.supabase.co/functions/v1/youtubeFetcher" \\
   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0"

2. Check if user has YouTube feeds:
   - Go to Feed Management in the app
   - Add some YouTube channels
   - Make sure they're active

3. Check YouTube fetcher logs in Supabase Dashboard
      `);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

checkYouTubeContent().catch(console.error); 