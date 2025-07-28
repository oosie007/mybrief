#!/usr/bin/env node

/**
 * Test YouTube Favicon Update
 * This script tests if YouTube favicon URLs are being updated correctly
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testYouTubeFaviconUpdate() {
  console.log('🧪 Testing YouTube Favicon Update...\n');
  
  try {
    // 1. Check current YouTube feeds and their favicon URLs
    console.log('1. Checking current YouTube feeds...');
    const { data: youtubeFeeds, error: feedsError } = await supabase
      .from('feed_sources')
      .select('id, name, url, type, favicon_url')
      .eq('type', 'youtube')
      .order('name');
    
    if (feedsError) {
      console.error('Error fetching YouTube feeds:', feedsError);
      return;
    }
    
    console.log(`Found ${youtubeFeeds?.length || 0} YouTube feeds:`);
    youtubeFeeds?.forEach((feed, index) => {
      console.log(`${index + 1}. ${feed.name}:`);
      console.log(`   URL: ${feed.url}`);
      console.log(`   Favicon: ${feed.favicon_url || 'NOT SET'}`);
      console.log(`   Status: ${feed.favicon_url ? '✅ HAS FAVICON' : '❌ NO FAVICON'}`);
      console.log('');
    });
    
    // 2. Test immediate YouTube fetcher for a specific feed
    if (youtubeFeeds && youtubeFeeds.length > 0) {
      const testFeed = youtubeFeeds[0]; // Use first feed for testing
      console.log(`2. Testing immediate fetch for: ${testFeed.name}`);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/youtubeFetcher`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedSourceId: testFeed.id,
          immediate: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ YouTube fetcher response:', result);
        
        // 3. Check if favicon was updated
        console.log('\n3. Checking if favicon was updated...');
        const { data: updatedFeed, error: updateError } = await supabase
          .from('feed_sources')
          .select('id, name, url, type, favicon_url')
          .eq('id', testFeed.id)
          .single();
        
        if (updateError) {
          console.error('Error fetching updated feed:', updateError);
        } else {
          console.log(`Updated feed: ${updatedFeed.name}`);
          console.log(`Favicon URL: ${updatedFeed.favicon_url || 'NOT SET'}`);
          console.log(`Status: ${updatedFeed.favicon_url ? '✅ UPDATED' : '❌ NOT UPDATED'}`);
          
          if (updatedFeed.favicon_url && updatedFeed.favicon_url !== testFeed.favicon_url) {
            console.log('🎉 Favicon was successfully updated!');
          } else if (updatedFeed.favicon_url) {
            console.log('ℹ️  Favicon was already set');
          } else {
            console.log('❌ Favicon was not updated');
          }
        }
      } else {
        console.log('❌ YouTube fetcher failed:', response.status);
      }
    }
    
    // 4. Test user feeds query (like FeedManagementScreen)
    console.log('\n4. Testing user feeds query with favicon_url...');
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
      const youtubeUserFeeds = userFeeds?.filter(feed => feed.feed_sources?.type === 'youtube') || [];
      console.log(`Found ${youtubeUserFeeds.length} YouTube user feeds:`);
      
      youtubeUserFeeds.forEach((feed, index) => {
        const feedSource = feed.feed_sources;
        console.log(`${index + 1}. ${feedSource?.name}:`);
        console.log(`   Favicon URL: ${feedSource?.favicon_url || 'NOT SET'}`);
        console.log(`   Status: ${feedSource?.favicon_url ? '✅ HAS FAVICON' : '❌ NO FAVICON'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testYouTubeFaviconUpdate(); 