import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

// Reddit API credentials
const REDDIT_CLIENT_ID = Deno.env.get('REDDIT_CLIENT_ID')
const REDDIT_CLIENT_SECRET = Deno.env.get('REDDIT_CLIENT_SECRET')
const REDDIT_USER_AGENT = Deno.env.get('REDDIT_USER_AGENT') || 'mybrief-app/1.0 (by /u/mybrief-app)'

interface RedditPost {
  id: string;
  title: string;
  url: string;
  selftext: string;
  author: string;
  subreddit: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  is_self: boolean;
  domain: string;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

// Get Reddit access token using client credentials flow
async function getRedditAccessToken(): Promise<string | null> {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    console.warn('Reddit API credentials not configured. Using unauthenticated requests (limited).');
    return null;
  }

  try {
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`)}`,
        'User-Agent': REDDIT_USER_AGENT
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      console.error('Failed to get Reddit access token:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Reddit access token:', error);
    return null;
  }
}

async function fetchSubredditPosts(subreddit: string, limit: number = 25): Promise<RedditPost[]> {
  try {
    // Try to get access token first
    const accessToken = await getRedditAccessToken();
    
    const url = `https://oauth.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
    console.log(`Fetching from: ${url}`);
    
    const headers: Record<string, string> = {
      'User-Agent': REDDIT_USER_AGENT
    };

    // Add authorization header if we have an access token
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Reddit API error for r/${subreddit}:`, response.status, errorText);
      
      // If we get a 403 and don't have credentials, try the old JSON endpoint as fallback
      if (response.status === 403 && !accessToken) {
        console.log(`Trying fallback JSON endpoint for r/${subreddit}`);
        return await fetchSubredditPostsFallback(subreddit, limit);
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: RedditResponse = await response.json();
    return data.data.children.map(child => child.data);
  } catch (error) {
    console.error(`Error fetching from r/${subreddit}:`, error);
    return [];
  }
}

// Fallback method using the old JSON endpoint (limited functionality)
async function fetchSubredditPostsFallback(subreddit: string, limit: number = 25): Promise<RedditPost[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
    console.log(`Using fallback endpoint: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': REDDIT_USER_AGENT
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: RedditResponse = await response.json();
    return data.data.children.map(child => child.data);
  } catch (error) {
    console.error(`Fallback error fetching from r/${subreddit}:`, error);
    return [];
  }
}

// Add delay between requests to respect rate limits
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function storeRedditPosts(posts: RedditPost[], feedSourceId: string) {
  try {
    const contentItems = posts.map(post => ({
      title: post.title,
      url: post.is_self ? `https://reddit.com${post.permalink}` : post.url,
      description: post.selftext || post.title,
      content_type: 'reddit',
      feed_source_id: feedSourceId,
      published_at: new Date(post.created_utc * 1000).toISOString(),
      author: post.author,
      subreddit: post.subreddit,
      score: post.score,
      num_comments: post.num_comments,
      permalink: post.permalink,
      is_self: post.is_self,
      domain: post.domain
    }));

    const { data, error } = await supabase
      .from('content_items')
      .upsert(contentItems, { 
        onConflict: 'url',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Error storing Reddit posts:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in storeRedditPosts:', error);
    return 0;
  }
}

serve(async (req) => {
  try {
    console.log('Reddit Fetcher started');
    
    // Check if this is an immediate fetch for a specific feed
    const body = await req.json().catch(() => ({}))
    const { feedSourceId, immediate } = body
    
    let feedSources
    let feedsError
    
    if (immediate && feedSourceId) {
      // Fetch specific feed for immediate processing
      console.log(`Immediate fetch requested for feed source: ${feedSourceId}`)
      const result = await supabase
        .from('feed_sources')
        .select('id, name, url')
        .eq('id', feedSourceId)
        .eq('type', 'reddit')
        .eq('is_active', true)
        .single()
      
      feedSources = result.data ? [result.data] : []
      feedsError = result.error
    } else {
      // Get all active Reddit feed sources (scheduled fetch)
      const result = await supabase
        .from('feed_sources')
        .select('id, name, url')
        .eq('type', 'reddit')
        .eq('is_active', true)
      
      feedSources = result.data
      feedsError = result.error
    }

    if (feedsError) {
      console.error('Error fetching Reddit feed sources:', feedsError);
      throw feedsError;
    }

    console.log(`Found ${feedSources?.length || 0} Reddit feed sources`);

    let totalProcessed = 0;
    let totalNewItems = 0;

    // Process each Reddit feed source
    for (const feedSource of feedSources || []) {
      try {
        // Extract subreddit name from URL (e.g., "https://reddit.com/r/technology" -> "technology")
        const subredditMatch = feedSource.url.match(/\/r\/([^\/\?]+)/);
        if (!subredditMatch) {
          console.log(`Invalid Reddit URL for ${feedSource.name}: ${feedSource.url}`);
          continue;
        }

        const subreddit = subredditMatch[1];
        console.log(`Processing subreddit: r/${subreddit}`);

        // Fetch posts from subreddit
        const posts = await fetchSubredditPosts(subreddit, 25);
        console.log(`Fetched ${posts.length} posts from r/${subreddit}`);

        if (posts.length > 0) {
          // Store posts in database
          const newItems = await storeRedditPosts(posts, feedSource.id);
          totalProcessed += posts.length;
          totalNewItems += newItems;
          console.log(`Stored ${newItems} new items from r/${subreddit}`);
        }
        
        // Add delay between requests to respect rate limits (1 second between each subreddit)
        if (feedSources && feedSources.length > 1) {
          await delay(1000);
        }
      } catch (error) {
        console.error(`Error processing ${feedSource.name}:`, error);
      }
    }
    
    return new Response(JSON.stringify({ 
      message: 'Reddit fetch complete',
      processed: totalProcessed,
      newItems: totalNewItems,
      feedSources: feedSources?.length || 0
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Reddit Fetcher error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}) 