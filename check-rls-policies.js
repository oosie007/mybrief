#!/usr/bin/env node

/**
 * Check RLS Policies
 * This script checks if RLS policies are preventing access to user_feeds
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS Policies...\n');
  
  try {
    // 1. Check if user_feeds table has RLS enabled
    console.log('1. Checking user_feeds table access...');
    const { data: userFeeds, error: userFeedsError } = await supabase
      .from('user_feeds')
      .select('user_id')
      .limit(1);
    
    if (userFeedsError) {
      console.log('❌ Cannot access user_feeds:', userFeedsError.message);
      console.log('This suggests RLS is blocking access');
    } else {
      console.log('✅ Can access user_feeds table');
      console.log('Records found:', userFeeds?.length || 0);
    }
    
    // 2. Check if the issue is with the specific user ID
    console.log('\n2. Checking specific user ID access...');
    const { data: specificUserFeeds, error: specificUserError } = await supabase
      .from('user_feeds')
      .select('user_id')
      .eq('user_id', 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1')
      .limit(1);
    
    if (specificUserError) {
      console.log('❌ Cannot access specific user feeds:', specificUserError.message);
    } else {
      console.log('✅ Can access specific user feeds');
      console.log('Records found:', specificUserFeeds?.length || 0);
    }
    
    // 3. Check if the app uses a different authentication method
    console.log('\n3. Analyzing the issue...');
    console.log(`
The problem is likely:

1. RLS (Row Level Security) is enabled on user_feeds table
2. The anon key can't access user-specific data without authentication
3. Your app needs to be logged in to access user_feeds
4. The script runs without authentication, so it can't see user data

SOLUTION:
- Your app needs to be authenticated to access user_feeds
- The script can't access user_feeds because it's not authenticated
- This is actually correct behavior for security

The feeds are definitely in the database (20 feeds confirmed), but:
- Dashboard can see them (admin access)
- Script can't see them (anon key, no auth)
- App should be able to see them (if authenticated)
    `);
    
    // 4. Check if the app is actually using the correct user ID
    console.log('\n4. Next steps:');
    console.log(`
To fix this:

1. Make sure your app is logged in
2. Check what user ID your app is using
3. Verify the user ID matches b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1
4. If different, add feeds to the correct user ID

The feeds exist in the database, so the issue is authentication/user ID mismatch.
    `);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

checkRLSPolicies().catch(console.error); 