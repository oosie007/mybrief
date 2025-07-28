#!/usr/bin/env node

/**
 * Check App User ID
 * This script helps identify what user ID the app is using
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppUserId() {
  console.log('🔍 Checking App User ID...\n');
  
  try {
    // 1. Check all users in user_feeds table
    console.log('1. Checking all users with feeds...');
    const { data: allUserFeeds, error: allUserFeedsError } = await supabase
      .from('user_feeds')
      .select('user_id')
      .eq('is_active', true);
    
    if (allUserFeedsError) {
      console.error('❌ Error fetching user feeds:', allUserFeedsError);
    } else {
      const uniqueUserIds = [...new Set(allUserFeeds?.map(feed => feed.user_id) || [])];
      console.log('✅ Users with feeds found:', uniqueUserIds.length);
      console.log('User IDs:', uniqueUserIds);
      
      if (uniqueUserIds.length > 0) {
        console.log('\n2. Checking feeds for each user...');
        
        for (const userId of uniqueUserIds) {
          console.log(`\n--- User ID: ${userId} ---`);
          
          const { data: userFeeds, error: userFeedsError } = await supabase
            .from('user_feeds')
            .select(`
              feed_source_id,
              feed_sources (
                name,
                type,
                url
              )
            `)
            .eq('user_id', userId)
            .eq('is_active', true);
          
          if (userFeedsError) {
            console.error('Error fetching feeds for user:', userFeedsError);
          } else {
            console.log('Feeds count:', userFeeds?.length || 0);
            
            // Count by type
            const byType = {};
            userFeeds?.forEach(feed => {
              const type = feed.feed_sources?.type || 'unknown';
              byType[type] = (byType[type] || 0) + 1;
            });
            
            Object.entries(byType).forEach(([type, count]) => {
              console.log(`- ${type}: ${count} feeds`);
            });
            
            // Show YouTube feeds specifically
            const youtubeFeeds = userFeeds?.filter(feed => feed.feed_sources?.type === 'youtube') || [];
            if (youtubeFeeds.length > 0) {
              console.log('YouTube feeds:');
              youtubeFeeds.forEach((feed, index) => {
                const feedSource = feed.feed_sources;
                console.log(`  ${index + 1}. ${feedSource?.name} - ${feedSource?.url}`);
              });
            }
          }
        }
      }
    }
    
    // 3. Provide debugging steps
    console.log('\n3. Debugging Steps:');
    console.log(`
To find out what user ID your app is using:

1. Add this console.log to your DigestScreen.tsx in the loadTodayDigest function:
   console.log('Current user ID:', user.id);

2. Check your app logs when it loads content

3. Compare the user ID in your app with the ones above

4. If they don't match, you need to add feeds to the correct user ID

5. Or check if you're logging in with a different email account
    `);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

checkAppUserId().catch(console.error); 