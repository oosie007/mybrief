#!/usr/bin/env node

/**
 * Debug Session Issue
 * This script debugs why the user appears logged in but can't access user_feeds
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSessionIssue() {
  console.log('🔍 Debugging Session Issue...\n');
  
  try {
    // 1. Check if there's a session
    console.log('1. Checking session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ Session found!');
      console.log('User ID:', session.user.id);
      console.log('Email:', session.user.email);
      console.log('Session expires:', session.expires_at);
      console.log('Access token exists:', !!session.access_token);
    } else {
      console.log('❌ No session found');
    }
    
    // 2. Check if the specific user can access their feeds
    console.log('\n2. Testing user feed access...');
    const testUserId = 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1';
    
    // Try to access user_feeds for this specific user
    const { data: userFeeds, error: userFeedsError } = await supabase
      .from('user_feeds')
      .select('*')
      .eq('user_id', testUserId)
      .limit(5);
    
    if (userFeedsError) {
      console.log('❌ Cannot access user_feeds:', userFeedsError.message);
      console.log('Error code:', userFeedsError.code);
      console.log('Error details:', userFeedsError.details);
    } else {
      console.log('✅ Can access user_feeds');
      console.log('Records found:', userFeeds?.length || 0);
    }
    
    // 3. Check RLS policies
    console.log('\n3. RLS Policy Analysis...');
    console.log(`
The issue is likely:

1. RLS (Row Level Security) is enabled on user_feeds table
2. The policy requires authentication to access user-specific data
3. Even though user appears logged in, the session might not be valid for RLS

Possible solutions:
- Check if RLS policies are correctly configured
- Verify the user session is valid for database access
- Check if the app is using the correct authentication method
    `);
    
    // 4. Check if this is a common Supabase RLS issue
    console.log('\n4. Common Supabase RLS Issues...');
    console.log(`
Common causes:
1. RLS policy requires auth.uid() but session is not valid
2. Policy is too restrictive
3. Session token expired
4. Different authentication method used

The app shows user is logged in, but RLS might be blocking access.
    `);
    
    // 5. Provide solution steps
    console.log('\n5. Solution Steps:');
    console.log(`
To fix this:

1. Check RLS policies on user_feeds table in Supabase Dashboard
2. Verify the policy allows authenticated users to access their own feeds
3. Check if session is valid for database operations
4. Consider temporarily disabling RLS for testing

The user ID and feeds are correct, so this is an authentication/RLS issue.
    `);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugSessionIssue().catch(console.error); 