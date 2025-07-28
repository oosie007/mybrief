#!/usr/bin/env node

/**
 * Test YouTube Fetcher
 * This script tests the YouTube fetcher and checks for YouTube content
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testYouTubeFetcher() {
  console.log('🎬 Testing YouTube Fetcher...\n');
  
  try {
    // 1. Check YouTube feed sources
    console.log('1. Checking YouTube feed sources...');
    const { data: youtubeFeeds, error: youtubeFeedsError } = await supabase
      .from('feed_sources')
      .select('*')
      .eq('type', 'youtube');
    
    if (youtubeFeedsError) {
      console.error('Error fetching YouTube feeds:', youtubeFeedsError);
    } else {
      console.log('YouTube feed sources found:', youtubeFeeds?.length || 0);
      if (youtubeFeeds && youtubeFeeds.length > 0) {
        console.log('YouTube feeds:');
        youtubeFeeds.forEach((feed, index) => {
          console.log(`${index + 1}. ${feed.name} - ${feed.url} - Active: ${feed.is_active}`);
        });
      }
    }
    
    // 2. Check YouTube content items
    console.log('\n2. Checking YouTube content items...');
    const { data: youtubeContent, error: youtubeContentError } = await supabase
      .from('content_items')
      .select(`
        id,
        title,
        url,
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
    
    if (youtubeContentError) {
      console.error('Error fetching YouTube content:', youtubeContentError);
    } else {
      console.log('YouTube content items found:', youtubeContent?.length || 0);
      if (youtubeContent && youtubeContent.length > 0) {
        console.log('Recent YouTube content:');
        youtubeContent.forEach((item, index) => {
          const feedSource = item.feed_sources;
          console.log(`${index + 1}. ${item.title} - ${feedSource?.name} - ${item.published_at}`);
        });
      } else {
        console.log('No YouTube content found!');
      }
    }
    
    // 3. Check if YouTube fetcher has been run recently
    console.log('\n3. Checking recent content by type...');
    const { data: recentContent, error: recentContentError } = await supabase
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
      .order('published_at', { ascending: false })
      .limit(20);
    
    if (recentContentError) {
      console.error('Error fetching recent content:', recentContentError);
    } else {
      console.log('Recent content by type:');
      const byType = {};
      recentContent?.forEach(item => {
        const type = item.content_type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });
      
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`- ${type}: ${count} items`);
      });
    }
    
    // 4. Test the YouTube fetcher
    console.log('\n4. Testing YouTube fetcher...');
    try {
      const response = await fetch('https://dgfmvoxvnojfkhooqggq.supabase.co/functions/v1/youtubeFetcher', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('YouTube fetcher result:', result);
    } catch (error) {
      console.error('Error calling YouTube fetcher:', error);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testYouTubeFetcher().catch(console.error); 