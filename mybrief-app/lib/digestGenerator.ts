import { supabase } from './supabase';

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
      articles_per_feed: 10,
      total_articles: 100, // Increased from 50 to 100
      time_window_hours: 24,
      use_time_window: false,
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
          type
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
      // Use time window: last 7 days to include more content
      startDate.setDate(startDate.getDate() - 7);
      console.log('Using time window: last 7 days to include more content');
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
          type
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
        type: (item.feed_sources as any)?.type || 'rss'
      },
      author: item.author,
      score: item.score,
      num_comments: item.num_comments,
      subreddit: item.subreddit,
      permalink: item.permalink,
      is_self: item.is_self,
      domain: item.domain
    }));

    // Apply balanced content limits by type
    let limitedItems = mappedItems;

    if (!userFeedConfig.use_time_window) {
      // Group items by content type first, then by feed source
      const itemsByType: { [contentType: string]: ContentItem[] } = {};
      mappedItems.forEach(item => {
        const type = item.content_type || 'rss';
        if (!itemsByType[type]) {
          itemsByType[type] = [];
        }
        itemsByType[type].push(item);
      });

      // Group each type by feed source and limit per feed
      const limitedByType: { [contentType: string]: ContentItem[] } = {};
      Object.entries(itemsByType).forEach(([type, items]) => {
        const itemsByFeed: { [feedId: string]: ContentItem[] } = {};
        items.forEach(item => {
          if (!itemsByFeed[item.feed_source_id]) {
            itemsByFeed[item.feed_source_id] = [];
          }
          itemsByFeed[item.feed_source_id].push(item);
        });

        // Limit to 10 articles per feed for each type
        const limitedByFeed: ContentItem[] = [];
        Object.values(itemsByFeed).forEach(feedItems => {
          const limited = feedItems.slice(0, 10); // Max 10 per feed
          limitedByFeed.push(...limited);
        });

        // Sort by published date (newest first) and limit to 10 per type
        limitedByFeed.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
        limitedByType[type] = limitedByFeed.slice(0, 10); // Max 10 per type
      });

      // Combine all types and limit total
      const allLimited: ContentItem[] = [];
      Object.values(limitedByType).forEach(items => {
        allLimited.push(...items);
      });

      // Sort by published date (newest first) and limit total
      allLimited.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
      limitedItems = allLimited.slice(0, userFeedConfig.total_articles);

      console.log(`Limited to 10 articles per feed, 10 per type, ${userFeedConfig.total_articles} total`);
      
      // Log breakdown by type
      Object.entries(limitedByType).forEach(([type, items]) => {
        console.log(`${type}: ${items.length} items`);
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
          type
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
          type
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