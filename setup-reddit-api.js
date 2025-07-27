#!/usr/bin/env node

/**
 * Reddit API Setup Script
 * 
 * This script helps you set up Reddit API credentials for the mybrief app.
 * Run this script to get step-by-step instructions and validate your setup.
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

async function main() {
  console.log('🔴 Reddit API Setup for MyBrief\n');
  
  console.log('Step 1: Create a Reddit App');
  console.log('1. Go to https://www.reddit.com/prefs/apps');
  console.log('2. Click "Create App" or "Create Another App"');
  console.log('3. Fill in the details:');
  console.log('   - Name: mybrief-app (or any name you prefer)');
  console.log('   - App type: Select "web app"');
  console.log('   - Description: Brief description of your app');
  console.log('   - About URL: Your app\'s URL (can be placeholder)');
  console.log('   - Redirect URI: http://localhost:8080 (for development)');
  console.log('4. Click "Create app"\n');
  
  const hasApp = await question('Have you created the Reddit app? (y/n): ');
  
  if (hasApp.toLowerCase() !== 'y') {
    console.log('\nPlease create the Reddit app first, then run this script again.');
    rl.close();
    return;
  }
  
  console.log('\nStep 2: Get Your Credentials');
  console.log('After creating the app, you should see:');
  console.log('- Client ID: The string under your app name (e.g., abc123def456)');
  console.log('- Client Secret: The "secret" field (e.g., ghi789jkl012)\n');
  
  const clientId = await question('Enter your Reddit Client ID: ');
  const clientSecret = await question('Enter your Reddit Client Secret: ');
  const username = await question('Enter your Reddit username (for User-Agent): ');
  
  if (!clientId || !clientSecret) {
    console.log('\n❌ Error: Client ID and Client Secret are required!');
    rl.close();
    return;
  }
  
  console.log('\nStep 3: Set Environment Variables');
  console.log('\nAdd these to your Supabase project environment variables:');
  console.log('(You can do this in the Supabase dashboard under Settings > API)');
  console.log('\n' + '='.repeat(50));
  console.log(`REDDIT_CLIENT_ID=${clientId}`);
  console.log(`REDDIT_CLIENT_SECRET=${clientSecret}`);
  console.log(`REDDIT_USER_AGENT=mybrief-app/1.0 (by /u/${username})`);
  console.log('='.repeat(50));
  
  console.log('\nStep 4: Deploy the Function');
  console.log('Run this command to deploy the updated function:');
  console.log('supabase functions deploy redditFetcher');
  
  console.log('\nStep 5: Test the Function');
  console.log('After deployment, test the function:');
  console.log('curl -X POST https://your-project.supabase.co/functions/v1/redditFetcher');
  
  console.log('\n✅ Setup complete! Your Reddit fetcher should now work without 403 errors.');
  
  rl.close();
}

main().catch(console.error); 