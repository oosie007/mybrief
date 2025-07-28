#!/usr/bin/env node

/**
 * Test Immediate Content Fetching
 * This script tests the immediate content fetching functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImmediateFetch() {
  console.log('🧪 Testing Immediate Content Fetching...\n');
  
  try {
    // 1. Test RSS fetcher with immediate flag
    console.log('1. Testing RSS Fetcher with immediate flag...');
    const rssResponse = await fetch(`${supabaseUrl}/functions/v1/rssFetcher`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedSourceId: 'test-rss-id',
        immediate: true
      })
    });
    
    if (rssResponse.ok) {
      const rssResult = await rssResponse.json();
      console.log('✅ RSS Fetcher immediate response:', rssResult);
    } else {
      console.log('❌ RSS Fetcher failed:', rssResponse.status);
    }
    
    // 2. Test YouTube fetcher with immediate flag
    console.log('\n2. Testing YouTube Fetcher with immediate flag...');
    const youtubeResponse = await fetch(`${supabaseUrl}/functions/v1/youtubeFetcher`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedSourceId: 'test-youtube-id',
        immediate: true
      })
    });
    
    if (youtubeResponse.ok) {
      const youtubeResult = await youtubeResponse.json();
      console.log('✅ YouTube Fetcher immediate response:', youtubeResult);
    } else {
      console.log('❌ YouTube Fetcher failed:', youtubeResponse.status);
    }
    
    // 3. Test Reddit fetcher with immediate flag
    console.log('\n3. Testing Reddit Fetcher with immediate flag...');
    const redditResponse = await fetch(`${supabaseUrl}/functions/v1/redditFetcher`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedSourceId: 'test-reddit-id',
        immediate: true
      })
    });
    
    if (redditResponse.ok) {
      const redditResult = await redditResponse.json();
      console.log('✅ Reddit Fetcher immediate response:', redditResult);
    } else {
      console.log('❌ Reddit Fetcher failed:', redditResponse.status);
    }
    
    console.log('\n🎉 Immediate fetching test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testImmediateFetch(); 