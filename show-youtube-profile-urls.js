// Show YouTube profile picture URLs
const SUPABASE_URL = 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTUyODgsImV4cCI6MjA2OTAzMTI4OH0.7P47Ka8F7AtU97OPvrb6yq4mzHKpK0viUNnPm4ooij0';

async function showYouTubeProfileUrls() {
  console.log('🔍 Checking YouTube profile picture URLs...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/feed_sources?select=*&type=eq.youtube&order=name`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const feeds = await response.json();
      console.log(`📊 YouTube feed sources: ${feeds.length}\n`);
      
      feeds.forEach((feed, index) => {
        console.log(`${index + 1}. ${feed.name}:`);
        console.log(`   Channel URL: ${feed.url}`);
        console.log(`   Profile Picture URL: ${feed.favicon_url || 'NOT SET'}`);
        console.log(`   Status: ${feed.favicon_url ? '✅ HAS PROFILE PICTURE' : '❌ NO PROFILE PICTURE'}`);
        console.log('');
      });
      
      // Summary
      const feedsWithProfile = feeds.filter(f => f.favicon_url);
      console.log(`📈 Summary:`);
      console.log(`   Total YouTube feeds: ${feeds.length}`);
      console.log(`   Feeds with profile pictures: ${feedsWithProfile.length}`);
      console.log(`   Feeds without profile pictures: ${feeds.length - feedsWithProfile.length}`);
      
    } else {
      console.log(`❌ Failed to fetch feed sources: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showYouTubeProfileUrls(); 