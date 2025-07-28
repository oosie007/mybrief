// Debug content aggregation to see if favicon_url is included
const SUPABASE_URL = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

async function debugContentFavicons() {
  console.log('🔍 Debugging content aggregation for favicon_url...\n');
  
  try {
    // First, check if user_feeds includes favicon_url
    console.log('1. Checking user_feeds with feed_sources...');
    const userFeedsResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_feeds?select=feed_source_id,feed_sources(id,name,type,favicon_url)&is_active=eq.true&limit=5`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (userFeedsResponse.ok) {
      const userFeeds = await userFeedsResponse.json();
      console.log(`Found ${userFeeds.length} user feeds`);
      
      userFeeds.forEach((feed, index) => {
        console.log(`\n${index + 1}. Feed Source:`);
        console.log(`   Name: ${feed.feed_sources?.name}`);
        console.log(`   Type: ${feed.feed_sources?.type}`);
        console.log(`   Favicon URL: ${feed.feed_sources?.favicon_url || 'NOT SET'}`);
      });
    }
    
    // Check content_items to see if they include feed_sources with favicon_url
    console.log('\n2. Checking content_items with feed_sources...');
    const contentResponse = await fetch(`${SUPABASE_URL}/rest/v1/content_items?select=id,title,content_type,feed_sources(id,name,type,favicon_url)&content_type=eq.youtube&limit=3`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (contentResponse.ok) {
      const contentItems = await contentResponse.json();
      console.log(`Found ${contentItems.length} YouTube content items`);
      
      contentItems.forEach((item, index) => {
        console.log(`\n${index + 1}. Content Item:`);
        console.log(`   Title: ${item.title}`);
        console.log(`   Type: ${item.content_type}`);
        console.log(`   Feed Name: ${item.feed_sources?.name}`);
        console.log(`   Feed Favicon: ${item.feed_sources?.favicon_url || 'NOT SET'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugContentFavicons(); 