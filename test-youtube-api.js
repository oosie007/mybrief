#!/usr/bin/env node

/**
 * Simple YouTube API Test
 * Tests basic API functionality with a known working channel
 */

const API_KEY = 'AIzaSyDrtcZXYpIje2c5iLSvW-lpjsAV_S-yGWI';

async function testYouTubeAPI() {
  console.log('🎬 Testing YouTube API Key...\n');
  
  // Test 1: Search for a popular channel
  console.log('🔍 Test 1: Searching for "Google Developers" channel...');
  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=Google+Developers&type=channel&key=${API_KEY}`
    );
    
    if (!searchResponse.ok) {
      console.error(`❌ Search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      const errorText = await searchResponse.text();
      console.error('Error details:', errorText);
    } else {
      const searchData = await searchResponse.json();
      console.log(`✅ Search successful! Found ${searchData.items?.length || 0} channels`);
      
      if (searchData.items && searchData.items.length > 0) {
        const channelId = searchData.items[0].snippet.channelId;
        console.log(`📺 Found channel ID: ${channelId}`);
        
        // Test 2: Get channel details
        console.log('\n🔍 Test 2: Getting channel details...');
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${API_KEY}`
        );
        
        if (!channelResponse.ok) {
          console.error(`❌ Channel details failed: ${channelResponse.status}`);
        } else {
          const channelData = await channelResponse.json();
          console.log('✅ Channel details successful!');
          console.log(`📺 Channel: ${channelData.items[0].snippet.title}`);
          console.log(`📋 Uploads playlist: ${channelData.items[0].contentDetails.relatedPlaylists.uploads}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Search test failed:', error);
  }
  
  // Test 3: Direct channel lookup (using a known channel ID)
  console.log('\n🔍 Test 3: Testing with known channel ID...');
  try {
    const knownChannelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw'; // Google Developers
    const directResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${knownChannelId}&key=${API_KEY}`
    );
    
    if (!directResponse.ok) {
      console.error(`❌ Direct lookup failed: ${directResponse.status}`);
    } else {
      const directData = await directResponse.json();
      console.log('✅ Direct lookup successful!');
      console.log(`📺 Channel: ${directData.items[0].snippet.title}`);
      console.log(`📋 Uploads playlist: ${directData.items[0].contentDetails.relatedPlaylists.uploads}`);
    }
  } catch (error) {
    console.error('❌ Direct lookup failed:', error);
  }
  
  // Test 4: Check API quota
  console.log('\n🔍 Test 4: Checking API quota...');
  try {
    const quotaResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${API_KEY}`
    );
    
    console.log(`📊 Response status: ${quotaResponse.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(quotaResponse.headers.entries()));
  } catch (error) {
    console.error('❌ Quota check failed:', error);
  }
}

testYouTubeAPI().catch(console.error); 