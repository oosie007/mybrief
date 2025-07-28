#!/usr/bin/env node

/**
 * Debug Auth Session
 * This script debugs the authentication session
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuthSession() {
  console.log('🔍 Debugging Auth Session...\n');
  
  try {
    // 1. Check if there's a session
    console.log('1. Checking for existing session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ Session found!');
      console.log('User ID:', session.user.id);
      console.log('Email:', session.user.email);
      console.log('Session expires:', session.expires_at);
    } else {
      console.log('❌ No session found');
    }
    
    // 2. Check if there's a user (different from session)
    console.log('\n2. Checking for user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ User error:', userError.message);
    } else if (user) {
      console.log('✅ User found!');
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
    } else {
      console.log('❌ No user found');
    }
    
    // 3. Check if the app is using a different authentication method
    console.log('\n3. Checking if app uses different auth...');
    console.log(`
The app might be using:
1. Anonymous authentication
2. A different user account
3. Session stored in app storage (not accessible via script)
4. Demo mode for testing

Let's check what's actually happening in your app...
    `);
    
    // 4. Check if there are any users in the database
    console.log('\n4. Checking all users with feeds in database...');
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
        console.log('\n5. Checking feeds for each user...');
        
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
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugAuthSession().catch(console.error); 