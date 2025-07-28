#!/usr/bin/env node

/**
 * Debug YouTube Channel ID Extraction
 * 
 * This script helps debug YouTube channel issues by testing channel ID extraction
 * and API calls. Run with: node debug-youtube-channel.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Get YouTube channel ID from various URL formats (same logic as Edge Function)
function extractChannelId(url) {
  // Handle different YouTube URL formats
  const patterns = [
    /youtube\.com\/channel\/([^\/\?]+)/,
    /youtube\.com\/c\/([^\/\?]+)/,
    /youtube\.com\/user\/([^\/\?]+)/,
    /youtube\.com\/@([^\/\?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Get channel ID using channel username
async function getChannelIdFromUsername(username, apiKey) {
  try {
    console.log(`🔍 Looking up channel ID for username: ${username}`);
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${username}&key=${apiKey}`
    );

    if (!response.ok) {
      console.error(`❌ Failed to get channel ID: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('📊 API Response:', JSON.stringify(data, null, 2));
    
    const channelId = data.items?.[0]?.id;
    if (channelId) {
      console.log(`✅ Found channel ID: ${channelId}`);
      return channelId;
    } else {
      console.log('❌ No channel ID found in response');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting channel ID:', error);
    return null;
  }
}

// Test channel details and uploads playlist
async function testChannelDetails(channelId, apiKey) {
  try {
    console.log(`🔍 Testing channel details for: ${channelId}`);
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${apiKey}`
    );

    if (!response.ok) {
      console.error(`❌ Failed to get channel details: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('📊 Channel Details Response:', JSON.stringify(data, null, 2));
    
    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
      
      console.log(`📺 Channel Name: ${channel.snippet?.title}`);
      console.log(`🆔 Channel ID: ${channel.id}`);
      console.log(`📋 Uploads Playlist ID: ${uploadsPlaylistId || 'NOT FOUND'}`);
      
      return uploadsPlaylistId;
    } else {
      console.log('❌ No channel found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing channel details:', error);
    return null;
  }
}

async function debugYouTubeChannel() {
  console.log('🎬 YouTube Channel Debug Tool\n');
  
  const apiKey = await question('Enter your YouTube Data API v3 key: ');
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ No API key provided. Exiting.');
    rl.close();
    return;
  }
  
  const testUrls = [
    'https://www.youtube.com/@TechCrunch',
    'https://www.youtube.com/@TheVerge',
    'https://www.youtube.com/@WIRED',
    'https://www.youtube.com/c/TheVerge',
    'https://www.youtube.com/user/TheVerge'
  ];
  
  console.log('\n🔍 Testing channel ID extraction...\n');
  
  for (const url of testUrls) {
    console.log(`\n--- Testing: ${url} ---`);
    
    // Test direct extraction
    const extractedId = extractChannelId(url);
    console.log(`Extracted ID: ${extractedId || 'None'}`);
    
    if (extractedId) {
      // Test if it's a valid channel ID
      await testChannelDetails(extractedId, apiKey);
    } else {
      // Try to get channel ID from username
      const usernameMatch = url.match(/youtube\.com\/(?:@|c\/|user\/)([^\/\?]+)/);
      if (usernameMatch) {
        const username = usernameMatch[1];
        console.log(`Trying username lookup: ${username}`);
        const channelId = await getChannelIdFromUsername(username, apiKey);
        if (channelId) {
          await testChannelDetails(channelId, apiKey);
        }
      }
    }
  }
  
  console.log('\n🎯 Manual Testing:');
  const manualUrl = await question('\nEnter a YouTube channel URL to test: ');
  if (manualUrl && manualUrl.trim() !== '') {
    console.log(`\n--- Manual Test: ${manualUrl} ---`);
    
    const extractedId = extractChannelId(manualUrl);
    console.log(`Extracted ID: ${extractedId || 'None'}`);
    
    if (extractedId) {
      await testChannelDetails(extractedId, apiKey);
    } else {
      const usernameMatch = manualUrl.match(/youtube\.com\/(?:@|c\/|user\/)([^\/\?]+)/);
      if (usernameMatch) {
        const username = usernameMatch[1];
        console.log(`Trying username lookup: ${username}`);
        const channelId = await getChannelIdFromUsername(username, apiKey);
        if (channelId) {
          await testChannelDetails(channelId, apiKey);
        }
      }
    }
  }
  
  rl.close();
}

debugYouTubeChannel().catch(console.error); 