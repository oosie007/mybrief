#!/usr/bin/env node

/**
 * Check User Config
 * This script checks if there's a user-specific configuration overriding our changes
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserConfig() {
  console.log('🔍 Checking User Configuration...\n');
  
  try {
    // 1. Check if there's a users table with feed_config
    console.log('1. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Cannot access users table:', usersError.message);
    } else {
      console.log('✅ Can access users table');
      console.log('Users found:', users?.length || 0);
      
      if (users && users.length > 0) {
        console.log('User data:');
        users.forEach((user, index) => {
          console.log(`${index + 1}. ID: ${user.id}, Feed Config:`, user.feed_config);
        });
      }
    }
    
    // 2. Check if the specific user has a feed_config
    console.log('\n2. Checking specific user config...');
    const { data: specificUser, error: specificUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1')
      .single();
    
    if (specificUserError) {
      console.log('❌ Cannot access specific user:', specificUserError.message);
    } else if (specificUser) {
      console.log('✅ Found user config:');
      console.log('User ID:', specificUser.id);
      console.log('Feed Config:', specificUser.feed_config);
      
      if (specificUser.feed_config && specificUser.feed_config.total_articles) {
        console.log('❌ User has custom feed_config with total_articles:', specificUser.feed_config.total_articles);
        console.log('This is overriding our default of 100!');
      } else {
        console.log('✅ User has no custom feed_config, should use default of 100');
      }
    } else {
      console.log('❌ User not found in users table');
    }
    
    // 3. Provide solution
    console.log('\n3. Solution:');
    console.log(`
If the user has a custom feed_config with total_articles: 50, we need to update it:

UPDATE users 
SET feed_config = '{"articles_per_feed": 10, "total_articles": 100, "time_window_hours": 24, "use_time_window": false}' 
WHERE id = 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1';

Or delete the feed_config to use defaults:

UPDATE users 
SET feed_config = NULL 
WHERE id = 'b7bd7a4b-a14f-49f1-b0d5-e51ca9d328d1';
    `);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

checkUserConfig().catch(console.error); 