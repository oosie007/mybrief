const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dgfmvoxvnojfkhooqggq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZm12b3h2bm9qZmtob29xZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzI5NzAsImV4cCI6MjA0ODU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
);

async function checkRecentYouTubeContent() {
  console.log('Checking recent YouTube content...');
  
  // Get content from last 2 hours
  const twoHoursAgo = new Date();
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
  
  const { data, error } = await supabase
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
    .eq('content_type', 'youtube')
    .gte('published_at', twoHoursAgo.toISOString())
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} recent YouTube videos:`);
  data.forEach((item, index) => {
    const publishedDate = new Date(item.published_at);
    const hoursAgo = Math.round((new Date().getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
    console.log(`${index + 1}. "${item.title}" - ${hoursAgo} hours ago (${item.feed_sources?.name})`);
  });
}

checkRecentYouTubeContent(); 