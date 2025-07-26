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
}

export interface UserDigest {
  userId: string;
  contentItems: ContentItem[];
  digestDate: string;
}

/**
 * Aggregate new content from all user feeds for a specific date
 */
export async function aggregateUserContent(userId: string, date: string): Promise<ContentItem[]> {
  try {
    console.log('Aggregating content for user:', userId, 'date:', date);
    
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
      console.log('No user feeds found');
      return [];
    }

    const feedSourceIds = userFeeds.map(feed => feed.feed_source_id);
    console.log('Feed source IDs:', feedSourceIds);

    // Get content items from the last 7 days for these feeds (instead of just today)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    console.log('Searching for content between:', startDate.toISOString(), 'and', endDate.toISOString());

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
        )
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
    
    // Map to ContentItem format
    const mappedItems = (contentItems || []).map(item => ({
      id: item.id,
      title: item.title || 'Untitled',
      url: item.url || '',
      description: item.description || '',
      image_url: item.image_url,
      published_at: item.published_at,
      content_type: item.content_type || 'article',
      feed_source_id: item.feed_source_id,
      feed_sources: {
        name: (item.feed_sources as any)?.name || 'Unknown',
        type: (item.feed_sources as any)?.type || 'rss'
      }
    }));
    
    return mappedItems;
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
        )
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