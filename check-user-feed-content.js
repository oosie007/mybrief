const { createClient } = require('@supabase/supabase-js');

// You'll need to replace this with your actual Supabase URL and anon key
const supabase = createClient(
  'https://dgfmvoxvnojfkhooqggq.supabase.co',
  'YOUR_ANON_KEY_HERE' // Replace with your actual anon key
);

async function checkUserFeedContent() {
  console.log('Checking user feed content...');
  
  // First, let's get your user ID - you'll need to replace this with your actual user ID
  const userId = 'YOUR_USER_ID_HERE'; // Replace with your actual user ID
  
  // Get user's subscribed feeds
  const { data: userFeeds, error: feedsError } = await supabase
    .from('user_feeds')
    .select(`
      feed_source_id,
      feed_sources (
        id,
        name,
        type,
        favicon_url
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (feedsError) {
    console.error('Error fetching user feeds:', feedsError);
    return;
  }

  console.log(`User has ${userFeeds.length} active feeds:`);
  userFeeds.forEach(feed => {
    console.log(`- ${feed.feed_sources.name} (${feed.feed_sources.type})`);
  });

  const feedSourceIds = userFeeds.map(feed => feed.feed_source_id);
  
  // Get content from last 24 hours (same as digest logic)
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - 24);
  
  console.log(`\nLooking for content from: ${startDate.toISOString()}`);
  console.log(`Feed source IDs: ${feedSourceIds.join(', ')}`);

  const { data: contentItems, error: contentError } = await supabase
    .from('content_items')
    .select(`
      id,
      title,
      url,
      published_at,
      content_type,
      feed_sources (
        name,
        type
      )
    `)
    .in('feed_source_id', feedSourceIds)
    .gte('published_at', startDate.toISOString())
    .order('published_at', { ascending: false });

  if (contentError) {
    console.error('Error fetching content:', contentError);
    return;
  }

  console.log(`\nFound ${contentItems.length} content items in last 24 hours:`);
  
  // Group by type
  const byType = {};
  contentItems.forEach(item => {
    const type = item.content_type;
    if (!byType[type]) byType[type] = [];
    byType[type].push(item);
  });

  Object.keys(byType).forEach(type => {
    console.log(`\n${type.toUpperCase()} (${byType[type].length} items):`);
    byType[type].forEach((item, index) => {
      const publishedDate = new Date(item.published_at);
      const hoursAgo = Math.round((new Date().getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
      console.log(`  ${index + 1}. "${item.title}" - ${hoursAgo} hours ago (${item.feed_sources?.name})`);
    });
  });

  // Check YouTube specifically
  const youtubeItems = contentItems.filter(item => item.content_type === 'youtube');
  console.log(`\nYOUTUBE VIDEOS (${youtubeItems.length}):`);
  youtubeItems.forEach((item, index) => {
    const publishedDate = new Date(item.published_at);
    const hoursAgo = Math.round((new Date().getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
    console.log(`  ${index + 1}. "${item.title}" - ${hoursAgo} hours ago (${item.feed_sources?.name})`);
  });
}

checkUserFeedContent(); 