// Debug script to check Reddit feed sources
// Run this with: node debug-reddit-feeds.js

const SUPABASE_URL = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

async function checkFeedSources() {
  console.log('🔍 Checking all feed sources...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/feed_sources?select=*&order=type,name`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const feeds = await response.json();
      console.log(`📊 Total feed sources: ${feeds.length}`);
      
      // Group by type
      const byType = feeds.reduce((acc, feed) => {
        if (!acc[feed.type]) acc[feed.type] = [];
        acc[feed.type].push(feed);
        return acc;
      }, {});
      
      Object.entries(byType).forEach(([type, typeFeeds]) => {
        console.log(`\n📋 ${type.toUpperCase()} feeds (${typeFeeds.length}):`);
        typeFeeds.forEach(feed => {
          console.log(`  - ${feed.name} (${feed.url}) - Active: ${feed.is_active}`);
        });
      });
      
      // Check specifically for Reddit feeds
      const redditFeeds = feeds.filter(f => f.type === 'reddit');
      console.log(`\n🔴 Reddit feeds found: ${redditFeeds.length}`);
      redditFeeds.forEach(feed => {
        console.log(`  - ${feed.name} (${feed.url}) - Active: ${feed.is_active}`);
      });
      
      // Check active Reddit feeds
      const activeRedditFeeds = redditFeeds.filter(f => f.is_active);
      console.log(`\n✅ Active Reddit feeds: ${activeRedditFeeds.length}`);
      
    } else {
      console.log(`❌ Failed to fetch feed sources: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function checkContentItems() {
  console.log('\n🔍 Checking content items by type...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/content_items?select=content_type,count&group=content_type`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Content items by type:');
      data.forEach(item => {
        console.log(`  - ${item.content_type}: ${item.count} items`);
      });
    } else {
      console.log(`❌ Failed to fetch content items: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runDiagnostics() {
  console.log('🚀 Running Reddit Feed Diagnostics...\n');
  
  await checkFeedSources();
  await checkContentItems();
  
  console.log('\n✅ Diagnostics complete!');
}

runDiagnostics(); 