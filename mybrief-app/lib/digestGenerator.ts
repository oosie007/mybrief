import { supabase } from './supabase';

// Digest configuration constants
const DIGEST_CONFIG = {
  TIME_WINDOW_HOURS: 24, // Last 24 hours
  MAX_ITEMS_PER_FEED: 3, // Max 3 items per individual feed
  TOTAL_MAX_ITEMS: 50, // Max 50 total items
  ENGAGEMENT_WEIGHTS: {
    RECENCY: 2, // Points per hour (0-24 hours)
    REDDIT_UPVOTES: 0.1, // Points per upvote
    REDDIT_COMMENTS: 0.5, // Points per comment
    YOUTUBE_VIEWS: 0.001, // Points per view (when available)
    YOUTUBE_LIKES: 0.1, // Points per like (when available)
  }
} as const;

export interface ContentItem {
  id: string;
  title: string;
  url: string;
  description: string;
  image_url?: string;
  published_at: string;
  content_type: 'rss' | 'reddit' | 'youtube' | 'twitter';
  feed_source_id: string;
  feed_sources: {
    name: string;
    type: string;
    favicon_url?: string;
    category?: string;
  };
  // Reddit-specific fields
  score?: number;
  num_comments?: number;
  author?: string;
  subreddit?: string;
  permalink?: string;
  is_self?: boolean;
  domain?: string;
}

export interface UserDigest {
  userId: string;
  contentItems: ContentItem[];
  digestDate: string;
}

/**
 * Aggregate new content from all user feeds for a specific date
 */
export async function aggregateUserContent(
  userId: string, 
  date: string, 
  feedConfig?: {
    articles_per_feed?: number;
    total_articles?: number;
    time_window_hours?: number;
    use_time_window?: boolean;
  }
): Promise<ContentItem[]> {
  try {
    console.log('Aggregating content for user:', userId, 'date:', date, 'config:', feedConfig);
    
    // Get user's feed configuration
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('feed_config')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user config:', userError);
    }

    const userFeedConfig = userData?.feed_config || feedConfig || {
      articles_per_feed: DIGEST_CONFIG.MAX_ITEMS_PER_FEED,
      total_articles: DIGEST_CONFIG.TOTAL_MAX_ITEMS,
      time_window_hours: DIGEST_CONFIG.TIME_WINDOW_HOURS,
      use_time_window: false, // Default to 24-hour window
    };

    console.log('Using feed config:', userFeedConfig);
    
    // Get all active feeds for the user
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
      throw feedsError;
    }

    console.log('User feeds found:', userFeeds?.length || 0);

    if (!userFeeds || userFeeds.length === 0) {
      console.log('=== DEBUG: No user feeds found ===');
      console.log('User ID:', userId);
      console.log('This means the user has no subscribed feeds');
      console.log('The app will fall back to demo data');
      console.log('==========================================');
      return [];
    }

    const feedSourceIds = userFeeds.map(feed => feed.feed_source_id);
    console.log('Feed source IDs:', feedSourceIds);

    // Calculate date range based on user configuration
    const startDate = new Date();
    const endDate = new Date();
    
    if (userFeedConfig.use_time_window) {
      // Use time window: last X hours
      startDate.setHours(startDate.getHours() - userFeedConfig.time_window_hours);
      console.log(`Using time window: last ${userFeedConfig.time_window_hours} hours`);
      console.log(`Time window: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    } else {
      // Use time window: last 24 hours for daily digest
      startDate.setHours(startDate.getHours() - 24);
      console.log('Using time window: last 24 hours for daily digest');
      console.log(`Time window: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    }

    console.log('Searching for content between:', startDate.toISOString(), 'and', endDate.toISOString());
    console.log('Current time:', new Date().toISOString());

    const { data: contentItems, error: contentError } = await supabase
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
          type,
          favicon_url,
          category
        ),
        author,
        score,
        num_comments,
        subreddit,
        permalink,
        is_self,
        domain
      `)
      .in('feed_source_id', feedSourceIds)
      .gte('published_at', startDate.toISOString())
      .lte('published_at', endDate.toISOString())
      .order('published_at', { ascending: false });

    if (contentError) {
      console.error('Error fetching content items:', contentError);
      return [];
    }

    console.log('Content items found:', contentItems?.length || 0);
    
    // Log article ages for debugging
    if (contentItems && contentItems.length > 0) {
      const now = new Date();
      contentItems.forEach((item, index) => {
        const publishedDate = new Date(item.published_at);
        const hoursAgo = Math.round((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
        console.log(`Article ${index + 1}: "${item.title}" - ${hoursAgo} hours ago`);
      });
    }

    // Map to ContentItem format
    const mappedItems: ContentItem[] = (contentItems || []).map(item => ({
      id: item.id,
      title: item.title || 'Untitled',
      url: item.url || '',
      description: item.description || '',
      image_url: item.image_url || undefined,
      published_at: item.published_at,
      content_type: item.content_type || 'article',
      feed_source_id: item.feed_source_id,
      feed_sources: {
        name: (item.feed_sources as any)?.name || 'Unknown',
        type: (item.feed_sources as any)?.type || 'rss',
        favicon_url: (item.feed_sources as any)?.favicon_url || undefined,
        category: (item.feed_sources as any)?.category || undefined
      },
      author: item.author,
      score: item.score,
      num_comments: item.num_comments,
      subreddit: item.subreddit,
      permalink: item.permalink,
      is_self: item.is_self,
      domain: item.domain
    }));

    // Apply balanced content limits per individual feed
    let limitedItems = mappedItems;

    if (!userFeedConfig.use_time_window) {
      // Group items by individual feed source (not by content type)
      const itemsByFeed: { [feedId: string]: ContentItem[] } = {};
      mappedItems.forEach(item => {
        if (!itemsByFeed[item.feed_source_id]) {
          itemsByFeed[item.feed_source_id] = [];
        }
        itemsByFeed[item.feed_source_id].push(item);
      });

      console.log(`Found ${Object.keys(itemsByFeed).length} unique feeds with content`);

      // Limit per individual feed and sort by engagement
      const limitedByFeed: ContentItem[] = [];
      Object.entries(itemsByFeed).forEach(([feedId, feedItems]) => {
        // Sort by engagement score first, then take top 3-5 per feed
        const sortedByEngagement = sortByEngagement(feedItems);
        const limited = sortedByEngagement.slice(0, DIGEST_CONFIG.MAX_ITEMS_PER_FEED);
        limitedByFeed.push(...limited);
        
        console.log(`Feed ${feedId}: ${feedItems.length} items → ${limited.length} selected`);
      });

      // Sort all items by engagement score and limit total
      const finalSorted = sortByEngagement(limitedByFeed);
      limitedItems = finalSorted.slice(0, userFeedConfig.total_articles);

      console.log(`Limited to ${DIGEST_CONFIG.MAX_ITEMS_PER_FEED} articles per individual feed, ${userFeedConfig.total_articles} total (sorted by engagement)`);
      
      // Log breakdown by feed source
      const byFeed: { [key: string]: number } = {};
      limitedItems.forEach(item => {
        const feedName = item.feed_sources?.name || 'Unknown';
        byFeed[feedName] = (byFeed[feedName] || 0) + 1;
      });
      
      console.log('Content by feed source:');
      Object.entries(byFeed).forEach(([feedName, count]) => {
        console.log(`- ${feedName}: ${count} items`);
      });
    }

    console.log('Final content items:', limitedItems.length);
    
    // Debug: Show content by type
    const byType: { [key: string]: number } = {};
    limitedItems.forEach(item => {
      const type = item.content_type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });
    
    console.log('Content by type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`- ${type}: ${count} items`);
    });
    
    return limitedItems;
  } catch (error) {
    console.error('Error aggregating user content:', error);
    throw error;
  }
}

/**
 * Get content items that haven't been included in a digest yet
 */
export async function getUndigestedContent(userId: string): Promise<ContentItem[]> {
  try {
    // Get all active feeds for the user
    const { data: userFeeds, error: feedsError } = await supabase
      .from('user_feeds')
      .select('feed_source_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (feedsError) {
      console.error('Error fetching user feeds:', feedsError);
      throw feedsError;
    }

    if (!userFeeds || userFeeds.length === 0) {
      return [];
    }

    const feedSourceIds = userFeeds.map(feed => feed.feed_source_id);

    // Get content items that haven't been included in any digest
    const { data: contentItems, error: contentError } = await supabase
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
          type,
          favicon_url
        ),
        author,
        score,
        num_comments,
        subreddit,
        permalink,
        is_self,
        domain
      `)
      .in('feed_source_id', feedSourceIds)
      .not('id', 'in', `(
        SELECT DISTINCT content_item_id 
        FROM daily_digests 
        WHERE user_id = '${userId}'
      )`)
      .order('published_at', { ascending: false })
      .limit(50); // Limit to prevent overwhelming the AI

    if (contentError) {
      console.error('Error fetching undigested content:', contentError);
      throw contentError;
    }

    return (contentItems || []) as unknown as ContentItem[];
  } catch (error) {
    console.error('Error getting undigested content:', error);
    throw error;
  }
}

/**
 * Group content items by type for better organization
 */
export function groupContentByType(contentItems: ContentItem[]) {
  const grouped = {
    rss: [] as ContentItem[],
    reddit: [] as ContentItem[],
    youtube: [] as ContentItem[],
    twitter: [] as ContentItem[],
  };

  contentItems.forEach(item => {
    if (grouped[item.content_type]) {
      grouped[item.content_type].push(item);
    }
  });

  return grouped;
}

/**
 * Filter content based on user preferences (to be implemented)
 */
export function filterContentByPreferences(
  contentItems: ContentItem[],
  userPreferences: any
): ContentItem[] {
  // TODO: Implement filtering based on user preferences
  // - Content type preferences
  // - Source preferences
  // - Content length preferences
  // - Topic preferences
  
  return contentItems;
} 

/**
 * Debug function to check what content exists in the database
 */
export async function debugContent() {
  try {
    console.log('=== DEBUG: Checking database content ===');
    
    // Check total content items
    const { data: totalContent, error: totalError } = await supabase
      .from('content_items')
      .select('id', { count: 'exact' });
    
    console.log('Total content items in database:', totalContent?.length || 0);
    
    // Check recent content items
    const { data: recentContent, error: recentError } = await supabase
      .from('content_items')
      .select(`
        id,
        title,
        published_at,
        feed_source_id,
        feed_sources (
          name,
          type,
          favicon_url
        )
      `)
      .order('published_at', { ascending: false })
      .limit(10);
    
    if (recentError) {
      console.error('Error fetching recent content:', recentError);
    } else {
      console.log('Recent content items:');
      recentContent?.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} (${(item.feed_sources as any)?.name}) - ${item.published_at}`);
      });
    }
    
    // Check feed sources
    const { data: feedSources, error: feedError } = await supabase
      .from('feed_sources')
      .select('*');
    
    if (feedError) {
      console.error('Error fetching feed sources:', feedError);
    } else {
      console.log('Feed sources:', feedSources?.length || 0);
      feedSources?.forEach((feed: any) => {
        console.log(`- ${feed.name} (${feed.type}) - Active: ${feed.is_active}`);
      });
    }
    
    console.log('=== END DEBUG ===');
  } catch (error) {
    console.error('Debug error:', error);
  }
} 

/**
 * Calculate engagement score for content ranking
 */
function calculateEngagementScore(item: ContentItem): number {
  let score = 0;
  
  // Base score from published date (newer = higher score)
  const hoursAgo = (Date.now() - new Date(item.published_at).getTime()) / (1000 * 60 * 60);
  score += Math.max(0, DIGEST_CONFIG.TIME_WINDOW_HOURS - hoursAgo) * DIGEST_CONFIG.ENGAGEMENT_WEIGHTS.RECENCY;
  
  // Reddit-specific engagement
  if (item.content_type === 'reddit') {
    score += (item.score || 0) * DIGEST_CONFIG.ENGAGEMENT_WEIGHTS.REDDIT_UPVOTES;
    score += (item.num_comments || 0) * DIGEST_CONFIG.ENGAGEMENT_WEIGHTS.REDDIT_COMMENTS;
  }
  
  // YouTube-specific engagement
  if (item.content_type === 'youtube') {
    // You could add view count, like count here when available
    // score += (item.view_count || 0) * DIGEST_CONFIG.ENGAGEMENT_WEIGHTS.YOUTUBE_VIEWS;
    // score += (item.like_count || 0) * DIGEST_CONFIG.ENGAGEMENT_WEIGHTS.YOUTUBE_LIKES;
  }
  
  // RSS/News: prioritize by recency and source reputation
  if (item.content_type === 'rss') {
    // Could add source reputation scoring here
    // score += getSourceReputationScore(item.feed_sources?.name);
  }
  
  return score;
}

/**
 * Sort content by engagement score (highest first)
 */
function sortByEngagement(items: ContentItem[]): ContentItem[] {
  return items.sort((a, b) => {
    const scoreA = calculateEngagementScore(a);
    const scoreB = calculateEngagementScore(b);
    return scoreB - scoreA; // Highest score first
  });
} 