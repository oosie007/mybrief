#!/usr/bin/env node

/**
 * Test Feed Addition Flow
 * This script tests the feed addition flow to ensure it works correctly
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFeedAdditionFlow() {
  console.log('🧪 Testing Feed Addition Flow...\n');
  
  try {
    // 1. Check current user feeds
    console.log('1. Checking current user feeds...');
    const { data: userFeeds, error: userFeedsError } = await supabase
      .from('user_feeds')
      .select(`
        *,
        feed_sources (
          id,
          name,
          url,
          type,
          is_active,
          favicon_url
        )
      `)
      .eq('user_id', 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1') // Test user ID
      .eq('is_active', true);
    
    if (userFeedsError) {
      console.error('Error fetching user feeds:', userFeedsError);
    } else {
      console.log(`Found ${userFeeds?.length || 0} user feeds`);
      userFeeds?.forEach((feed, index) => {
        const feedSource = feed.feed_sources;
        console.log(`${index + 1}. ${feedSource?.name} (${feedSource?.type})`);
      });
    }
    
    // 2. Test adding a new RSS feed
    console.log('\n2. Testing RSS feed addition...');
    const testRssFeed = {
      name: 'Test RSS Feed',
      url: 'https://techcrunch.com/feed/',
      type: 'rss'
    };
    
    // Create feed source
    const { data: rssFeedSource, error: rssError } = await supabase
      .from('feed_sources')
      .upsert({
        name: testRssFeed.name,
        url: testRssFeed.url,
        type: testRssFeed.type,
        is_active: true,
      }, { onConflict: 'url' })
      .select()
      .single();
    
    if (rssError) {
      console.error('Error creating RSS feed source:', rssError);
    } else {
      console.log('✅ RSS feed source created:', rssFeedSource.name);
      
      // Link to user
      const { error: userRssError } = await supabase
        .from('user_feeds')
        .upsert({
          user_id: 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1',
          feed_source_id: rssFeedSource.id,
          is_active: true,
        }, { onConflict: 'user_id,feed_source_id' });
      
      if (userRssError) {
        console.error('Error linking RSS feed to user:', userRssError);
      } else {
        console.log('✅ RSS feed linked to user');
        
        // Test immediate fetch
        const rssResponse = await fetch(`${supabaseUrl}/functions/v1/rssFetcher`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedSourceId: rssFeedSource.id,
            immediate: true
          })
        });
        
        if (rssResponse.ok) {
          const rssResult = await rssResponse.json();
          console.log('✅ RSS immediate fetch successful:', rssResult);
        } else {
          console.log('❌ RSS immediate fetch failed:', rssResponse.status);
        }
      }
    }
    
    // 3. Test adding a new YouTube feed
    console.log('\n3. Testing YouTube feed addition...');
    const testYoutubeFeed = {
      name: 'Test YouTube Channel',
      url: 'https://www.youtube.com/@TechCrunch',
      type: 'youtube'
    };
    
    // Create feed source
    const { data: youtubeFeedSource, error: youtubeError } = await supabase
      .from('feed_sources')
      .upsert({
        name: testYoutubeFeed.name,
        url: testYoutubeFeed.url,
        type: testYoutubeFeed.type,
        is_active: true,
      }, { onConflict: 'url' })
      .select()
      .single();
    
    if (youtubeError) {
      console.error('Error creating YouTube feed source:', youtubeError);
    } else {
      console.log('✅ YouTube feed source created:', youtubeFeedSource.name);
      
      // Link to user
      const { error: userYoutubeError } = await supabase
        .from('user_feeds')
        .upsert({
          user_id: 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1',
          feed_source_id: youtubeFeedSource.id,
          is_active: true,
        }, { onConflict: 'user_id,feed_source_id' });
      
      if (userYoutubeError) {
        console.error('Error linking YouTube feed to user:', userYoutubeError);
      } else {
        console.log('✅ YouTube feed linked to user');
        
        // Test immediate fetch
        const youtubeResponse = await fetch(`${supabaseUrl}/functions/v1/youtubeFetcher`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedSourceId: youtubeFeedSource.id,
            immediate: true
          })
        });
        
        if (youtubeResponse.ok) {
          const youtubeResult = await youtubeResponse.json();
          console.log('✅ YouTube immediate fetch successful:', youtubeResult);
          
          // Check if favicon was updated
          setTimeout(async () => {
            const { data: updatedFeed, error: updateError } = await supabase
              .from('feed_sources')
              .select('id, name, url, type, favicon_url')
              .eq('id', youtubeFeedSource.id)
              .single();
            
            if (updateError) {
              console.error('Error fetching updated feed:', updateError);
            } else {
              console.log(`Updated YouTube feed: ${updatedFeed.name}`);
              console.log(`Favicon URL: ${updatedFeed.favicon_url || 'NOT SET'}`);
              console.log(`Status: ${updatedFeed.favicon_url ? '✅ HAS FAVICON' : '❌ NO FAVICON'}`);
            }
          }, 2000);
        } else {
          console.log('❌ YouTube immediate fetch failed:', youtubeResponse.status);
        }
      }
    }
    
    console.log('\n🎉 Feed addition flow test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testFeedAdditionFlow(); 