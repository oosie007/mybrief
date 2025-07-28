#!/usr/bin/env node

/**
 * YouTube API Setup Script
 * 
 * This script helps you set up YouTube API credentials for the mybrief app.
 * Run with: node setup-youtube-api.js
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

async function setupYouTubeAPI() {
  console.log('🎬 YouTube API Setup for mybrief\n');
  
  console.log('📋 Steps to get your YouTube API Key:');
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Create a new project or select an existing one');
  console.log('3. Enable the YouTube Data API v3');
  console.log('4. Create credentials (API Key)');
  console.log('5. Copy your API key\n');
  
  const apiKey = await question('Enter your YouTube Data API v3 key: ');
  
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ No API key provided. Setup cancelled.');
    rl.close();
    return;
  }
  
  console.log('\n✅ YouTube API Key captured!');
  console.log('\n📝 Add this environment variable to your Supabase project:');
  console.log('\n🔑 YOUTUBE_API_KEY');
  console.log(`📄 ${apiKey}`);
  
  console.log('\n📋 Instructions:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to Settings → Edge Functions');
  console.log('3. Add the environment variable:');
  console.log(`   - Key: YOUTUBE_API_KEY`);
  console.log(`   - Value: ${apiKey}`);
  
  console.log('\n🎯 Example YouTube channels to add:');
  console.log('- TechCrunch: https://www.youtube.com/@TechCrunch');
  console.log('- The Verge: https://www.youtube.com/@TheVerge');
  console.log('- Wired: https://www.youtube.com/@WIRED');
  console.log('- Ars Technica: https://www.youtube.com/@ArsTechnica');
  
  console.log('\n📊 To add channels, run this SQL in your Supabase SQL editor:');
  console.log(`
INSERT INTO feed_sources (name, url, type, is_active) VALUES
  ('TechCrunch', 'https://www.youtube.com/@TechCrunch', 'youtube', true),
  ('The Verge', 'https://www.youtube.com/@TheVerge', 'youtube', true),
  ('Wired', 'https://www.youtube.com/@WIRED', 'youtube', true);
  `);
  
  console.log('\n🚀 After setup:');
  console.log('1. Deploy the YouTube fetcher: supabase functions deploy youtubeFetcher');
  console.log('2. Test the function with curl or through the dashboard');
  console.log('3. The videos will appear in your feed with thumbnails and metadata!');
  
  rl.close();
}

setupYouTubeAPI().catch(console.error); 