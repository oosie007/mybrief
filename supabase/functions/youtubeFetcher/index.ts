import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

// YouTube API credentials
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  channelId: string;
  thumbnails: {
    default?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    high?: { url: string; width: number; height: number };
  };
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
  duration?: string;
  tags?: string[];
}

interface YouTubeResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
}

// Get YouTube channel ID from various URL formats
function extractChannelId(url: string): string | null {
  // Handle different YouTube URL formats
  const patterns = [
    /youtube\.com\/channel\/([^\/\?]+)/,
    /youtube\.com\/c\/([^\/\?]+)/,
    /youtube\.com\/user\/([^\/\?]+)/,
    /youtube\.com\/@([^\/\?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Get channel ID using channel username (using search instead of deprecated forUsername)
async function getChannelIdFromUsername(username: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured');
    return null;
  }

  try {
    console.log(`Looking up channel ID for username: ${username}`);
    
    // Use search API instead of deprecated forUsername parameter
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(username)}&type=channel&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      console.error('Failed to get channel ID:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log(`Channel search response for ${username}:`, data);
    
    if (data.items && data.items.length > 0) {
      // Find the best match (exact username match)
      const exactMatch = data.items.find((item: any) => 
        item.snippet.channelTitle.toLowerCase() === username.toLowerCase() ||
        item.snippet.channelTitle.toLowerCase().includes(username.toLowerCase())
      );
      
      const channelId = exactMatch?.snippet?.channelId || data.items[0]?.snippet?.channelId;
      if (channelId) {
        console.log(`Found channel ID for ${username}: ${channelId}`);
        return channelId;
      }
    }
    
    console.log(`No channel ID found for username: ${username}`);
    return null;
  } catch (error) {
    console.error('Error getting channel ID:', error);
    return null;
  }
}

// Fetch videos from a YouTube channel
async function fetchChannelVideos(channelId: string, maxResults: number = 25): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured. Cannot fetch videos.');
    return [];
  }

  try {
    // First, get the uploads playlist ID for the channel
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );

    if (!channelResponse.ok) {
      console.error('Failed to get channel details:', channelResponse.status);
      return [];
    }

    const channelData = await channelResponse.json();
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      console.error('Could not find uploads playlist for channel:', channelId);
      return [];
    }

    // Get videos from the uploads playlist
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
    );

    if (!videosResponse.ok) {
      console.error('Failed to get videos:', videosResponse.status);
      return [];
    }

    const videosData = await videosResponse.json();
    const videoIds = videosData.items?.map((item: any) => item.contentDetails.videoId).join(',') || '';

    if (!videoIds) {
      return [];
    }

    // Get detailed video information
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    if (!detailsResponse.ok) {
      console.error('Failed to get video details:', detailsResponse.status);
      return [];
    }

    const detailsData = await detailsResponse.json();
    return detailsData.items?.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      thumbnails: item.snippet.thumbnails,
      viewCount: item.statistics?.viewCount,
      likeCount: item.statistics?.likeCount,
      commentCount: item.statistics?.commentCount,
      duration: item.contentDetails?.duration,
      tags: item.snippet?.tags || []
    })) || [];

  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

// Add delay between requests to respect rate limits
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req) => {
  try {
    console.log('YouTube Fetcher started')

    // Get all active YouTube feed sources
    const { data: feeds, error } = await supabase
      .from('feed_sources')
      .select('*')
      .eq('type', 'youtube')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching feeds:', error)
      return new Response(JSON.stringify({ error: 'Error fetching feeds' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${feeds?.length || 0} YouTube feeds to process`)

    if (!feeds || feeds.length === 0) {
      return new Response(JSON.stringify({ message: 'No YouTube feeds found' }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let totalProcessed = 0
    let totalNewItems = 0

    for (const feed of feeds) {
      try {
        console.log(`Processing YouTube feed: ${feed.name} (${feed.url})`)
        
        // Extract channel ID from URL
        let channelId = extractChannelId(feed.url);
        console.log(`Extracted channel ID from URL: ${channelId}`);
        
        // If we extracted a username (not a channel ID), convert it
        if (channelId && !channelId.startsWith('UC')) {
          console.log(`Extracted value "${channelId}" appears to be a username, converting to channel ID`);
          const tempUsername = channelId;
          channelId = await getChannelIdFromUsername(tempUsername);
        }
        
        if (!channelId) {
          // Try to extract username and get channel ID
          const usernameMatch = feed.url.match(/youtube\.com\/(?:@|c\/|user\/)([^\/\?]+)/);
          if (usernameMatch) {
            console.log(`Trying username extraction: ${usernameMatch[1]}`);
            channelId = await getChannelIdFromUsername(usernameMatch[1]);
          }
        }

        if (!channelId) {
          console.error(`Could not extract channel ID from URL: ${feed.url}`);
          continue;
        }

        console.log(`Channel ID for ${feed.name}: ${channelId}`);

        const videos = await fetchChannelVideos(channelId, 25);
        console.log(`Found ${videos.length} videos for ${feed.name}`);

        for (const video of videos) {
          try {
            // Insert video into content_items
            const { error: insertError } = await supabase
              .from('content_items')
              .upsert({
                feed_source_id: feed.id,
                title: video.title || 'Untitled Video',
                url: `https://www.youtube.com/watch?v=${video.id}`,
                description: video.description || '',
                image_url: video.thumbnails?.medium?.url || video.thumbnails?.default?.url || null,
                published_at: video.publishedAt,
                content_type: 'youtube',
                raw_content: video,
                author: video.channelTitle,
                // YouTube-specific fields
                score: parseInt(video.viewCount || '0'),
                num_comments: parseInt(video.commentCount || '0'),
                subreddit: video.channelId, // Using channelId as subreddit equivalent
                permalink: video.id,
                is_self: false,
                domain: 'youtube.com'
              }, { onConflict: 'url' })

            if (insertError) {
              console.error(`Error inserting video from ${feed.name}:`, insertError)
            } else {
              totalNewItems++
            }
          } catch (itemError) {
            console.error(`Error processing video from ${feed.name}:`, itemError)
          }
        }
        
        totalProcessed++
        
        // Add delay between feeds to respect rate limits
        if (feeds.length > 1) {
          await delay(1000);
        }
      } catch (feedError) {
        console.error(`Error processing YouTube feed ${feed.name}:`, feedError)
      }
    }

    console.log(`YouTube Fetcher completed. Processed ${totalProcessed} feeds, added ${totalNewItems} new items`)
    
    return new Response(JSON.stringify({ 
      message: 'YouTube fetch complete',
      processed: totalProcessed,
      newItems: totalNewItems
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('YouTube Fetcher error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}) 