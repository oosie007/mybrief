// Check YouTube feeds and profile pictures
const SUPABASE_URL = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

async function checkYouTubeFeeds() {
  console.log('🔍 Checking YouTube feed sources...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/feed_sources?select=*&type=eq.youtube&order=name`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const feeds = await response.json();
      console.log(`📊 YouTube feed sources: ${feeds.length}`);
      
      feeds.forEach(feed => {
        console.log(`\n📺 ${feed.name}:`);
        console.log(`  URL: ${feed.url}`);
        console.log(`  Favicon URL: ${feed.favicon_url || 'NOT SET'}`);
        console.log(`  Active: ${feed.is_active}`);
      });
      
      // Check if favicon_url column exists
      const feedsWithFavicon = feeds.filter(f => f.favicon_url);
      console.log(`\n✅ Feeds with profile pictures: ${feedsWithFavicon.length}/${feeds.length}`);
      
    } else {
      console.log(`❌ Failed to fetch feed sources: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkYouTubeFeeds(); 