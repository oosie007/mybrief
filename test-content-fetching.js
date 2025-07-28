#!/usr/bin/env node

/**
 * Test Content Fetching
 * This script tests the content fetching logic to see what's in the database
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testContentFetching() {
  console.log('🔍 Testing Content Fetching...\n');
  
  try {
    // 1. Check if there are any users
    console.log('1. Checking users...');
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(5);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log('Users found:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('First user:', users[0]);
      }
    }
    
    // 2. Check total content items
    console.log('\n2. Checking content items...');
    const { data: contentItems, error: contentError } = await supabase
      .from('content_items')
      .select('id, title, content_type, published_at')
      .order('published_at', { ascending: false })
      .limit(10);
    
    if (contentError) {
      console.error('Error fetching content items:', contentError);
    } else {
      console.log('Content items found:', contentItems?.length || 0);
      if (contentItems && contentItems.length > 0) {
        console.log('Recent content:');
        contentItems.forEach((item, index) => {
          console.log(`${index + 1}. ${item.title} (${item.content_type}) - ${item.published_at}`);
        });
      }
    }
    
    // 3. Check feed sources
    console.log('\n3. Checking feed sources...');
    const { data: feedSources, error: feedError } = await supabase
      .from('feed_sources')
      .select('*');
    
    if (feedError) {
      console.error('Error fetching feed sources:', feedError);
    } else {
      console.log('Feed sources found:', feedSources?.length || 0);
      if (feedSources && feedSources.length > 0) {
        console.log('Feed sources:');
        feedSources.forEach((feed, index) => {
          console.log(`${index + 1}. ${feed.name} (${feed.type}) - Active: ${feed.is_active}`);
        });
      }
    }
    
    // 4. Check user feeds (if we have a user ID)
    if (users && users.length > 0) {
      const userId = users[0].id;
      console.log(`\n4. Checking user feeds for user: ${userId}`);
      
      const { data: userFeeds, error: userFeedsError } = await supabase
        .from('user_feeds')
        .select(`
          *,
          feed_sources (
            id,
            name,
            url,
            type,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (userFeedsError) {
        console.error('Error fetching user feeds:', userFeedsError);
      } else {
        console.log('User feeds found:', userFeeds?.length || 0);
        if (userFeeds && userFeeds.length > 0) {
          console.log('User feeds:');
          userFeeds.forEach((feed, index) => {
            const feedSource = feed.feed_sources;
            console.log(`${index + 1}. ${feedSource?.name} (${feedSource?.type}) - ${feedSource?.url}`);
          });
        }
      }
      
      // 5. Test the actual content fetching logic
      console.log(`\n5. Testing content fetching for user: ${userId}`);
      
      const feedSourceIds = userFeeds?.map(feed => feed.feed_source_id) || [];
      console.log('Feed source IDs:', feedSourceIds);
      
      if (feedSourceIds.length > 0) {
        const { data: userContent, error: userContentError } = await supabase
          .from('content_items')
          .select(`
            id,
            title,
            url,
            description,
            image_url,
            published_at,
            content_type,
            feed_source_id,
            feed_sources (
              name,
              type
            )
          `)
          .in('feed_source_id', feedSourceIds)
          .order('published_at', { ascending: false })
          .limit(20);
        
        if (userContentError) {
          console.error('Error fetching user content:', userContentError);
        } else {
          console.log('User content found:', userContent?.length || 0);
          if (userContent && userContent.length > 0) {
            console.log('User content:');
            userContent.forEach((item, index) => {
              const feedSource = item.feed_sources;
              console.log(`${index + 1}. ${item.title} (${item.content_type}) - ${feedSource?.name} - ${item.published_at}`);
            });
          }
        }
      } else {
        console.log('No feed sources found for user');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testContentFetching().catch(console.error); 