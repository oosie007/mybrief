// Test script for Reddit fetcher functionality
// Run this with: node test-reddit-fetcher.js

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dgfmvoxvnojfkhooqggq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function testRedditAPI() {
  console.log('🔍 Testing Reddit API directly...\n');
  
  const testSubreddits = ['technology', 'programming', 'webdev'];
  
  for (const subreddit of testSubreddits) {
    try {
      console.log(`Testing r/${subreddit}...`);
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=5`, {
        headers: {
          'User-Agent': 'mybrief-app/1.0 (by /u/mybrief-app)'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const posts = data.data.children;
        console.log(`✅ Successfully fetched ${posts.length} posts from r/${subreddit}`);
        
        // Show sample post data
        if (posts.length > 0) {
          const samplePost = posts[0].data;
          console.log(`📝 Sample post: "${samplePost.title}"`);
          console.log(`   Author: ${samplePost.author}`);
          console.log(`   Score: ${samplePost.score}`);
          console.log(`   Comments: ${samplePost.num_comments}`);
          console.log(`   URL: ${samplePost.url}`);
          console.log(`   Is self: ${samplePost.is_self}`);
          console.log(`   Domain: ${samplePost.domain}`);
          console.log('');
        }
      } else {
        console.log(`❌ Failed to fetch r/${subreddit}: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error testing r/${subreddit}:`, error.message);
    }
  }
}

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  if (!SUPABASE_ANON_KEY) {
    console.log('❌ SUPABASE_ANON_KEY not found in environment variables');
    console.log('Please set your Supabase anon key as an environment variable');
    return;
  }
  
  try {
    // Test basic Supabase connection
    const response = await fetch(`${SUPABASE_URL}/rest/v1/feed_sources?select=*&type=eq.reddit&is_active=eq.true`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Successfully connected to Supabase`);
      console.log(`📊 Found ${data.length} active Reddit feed sources:`);
      
      if (data.length > 0) {
        data.forEach((feed, index) => {
          console.log(`  ${index + 1}. ${feed.name} (${feed.url})`);
        });
      } else {
        console.log('   No Reddit feed sources found. You may need to add some.');
      }
    } else {
      console.log(`❌ Failed to connect to Supabase: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error connecting to Supabase:', error.message);
  }
}

async function testEdgeFunction() {
  console.log('\n🔍 Testing Reddit Fetcher Edge Function...\n');
  
  if (!SUPABASE_ANON_KEY) {
    console.log('❌ SUPABASE_ANON_KEY not found - cannot test Edge Function');
    return;
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/redditFetcher`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Reddit Fetcher Edge Function executed successfully!');
      console.log('📊 Results:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log(`❌ Edge Function failed: ${response.status}`);
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error calling Edge Function:', error.message);
  }
}

async function checkContentItems() {
  console.log('\n🔍 Checking existing Reddit content items...\n');
  
  if (!SUPABASE_ANON_KEY) {
    console.log('❌ SUPABASE_ANON_KEY not found - cannot check content items');
    return;
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/content_items?select=*&content_type=eq.reddit&order=published_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Found ${data.length} Reddit content items in database:`);
      
      if (data.length > 0) {
        data.forEach((item, index) => {
          console.log(`  ${index + 1}. "${item.title}"`);
          console.log(`     Author: ${item.author}`);
          console.log(`     Subreddit: ${item.subreddit}`);
          console.log(`     Score: ${item.score}, Comments: ${item.num_comments}`);
          console.log(`     Published: ${item.published_at}`);
          console.log('');
        });
      } else {
        console.log('   No Reddit content items found. Run the fetcher to populate data.');
      }
    } else {
      console.log(`❌ Failed to fetch content items: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error checking content items:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Reddit Fetcher Tests...\n');
  
  await testRedditAPI();
  await testSupabaseConnection();
  await testEdgeFunction();
  await checkContentItems();
  
  console.log('\n✅ All tests complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. If Reddit API tests pass, the fetcher should work');
  console.log('2. If no Reddit feed sources found, add some via Feed Management');
  console.log('3. If Edge Function fails, check Supabase logs');
  console.log('4. Run GitHub Action manually to test the full workflow');
}

runAllTests(); 