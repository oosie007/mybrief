#!/usr/bin/env node

/**
 * Test Channel Lookup
 * Tests the new channel lookup method using search API
 */

const API_KEY = 'AIzaSyDrtcZXYpIje2c5iLSvW-lpjsAV_S-yGWI';

async function testChannelLookup() {
  console.log('🎬 Testing Channel Lookup with Search API...\n');
  
  const testUsernames = ['TheVerge', 'TechCrunch', 'WIRED', 'howiaipodcast'];
  
  for (const username of testUsernames) {
    console.log(`\n--- Testing: ${username} ---`);
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(username)}&type=channel&key=${API_KEY}`
      );
      
      if (!response.ok) {
        console.error(`❌ Search failed: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`📊 Found ${data.items?.length || 0} channels`);
      
      if (data.items && data.items.length > 0) {
        // Find exact match
        const exactMatch = data.items.find((item) => 
          item.snippet.channelTitle.toLowerCase() === username.toLowerCase() ||
          item.snippet.channelTitle.toLowerCase().includes(username.toLowerCase())
        );
        
        const bestMatch = exactMatch || data.items[0];
        console.log(`📺 Best match: ${bestMatch.snippet.channelTitle}`);
        console.log(`🆔 Channel ID: ${bestMatch.snippet.channelId}`);
        
        // Test if we can get channel details
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${bestMatch.snippet.channelId}&key=${API_KEY}`
        );
        
        if (channelResponse.ok) {
          const channelData = await channelResponse.json();
          const uploadsPlaylist = channelData.items[0].contentDetails.relatedPlaylists.uploads;
          console.log(`✅ Channel details found! Uploads playlist: ${uploadsPlaylist}`);
        } else {
          console.log(`❌ Channel details failed: ${channelResponse.status}`);
        }
      } else {
        console.log('❌ No channels found');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

testChannelLookup().catch(console.error); 