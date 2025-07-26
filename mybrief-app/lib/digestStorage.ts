import { supabase } from './supabase';
import { DailyDigest, ProcessedContent } from './aiContentProcessor';

export interface StoredDigest {
  id: string;
  user_id: string;
  digest_date: string;
  summary: string;
  total_items: number;
  estimated_read_time: number;
  created_at: string;
  content_items: StoredDigestItem[];
}

export interface StoredDigestItem {
  id: string;
  digest_id: string;
  content_item_id: string;
  relevance_score: number;
  category: string;
  summary: string;
  key_points: string[];
  estimated_read_time: number;
  display_order: number;
}

/**
 * Store a daily digest in the database
 */
export async function storeDailyDigest(digest: DailyDigest): Promise<string> {
  try {
    // Insert the main digest record
    const { data: digestData, error: digestError } = await supabase
      .from('daily_digests')
      .insert({
        user_id: digest.userId,
        digest_date: digest.date,
        summary: digest.summary,
        total_items: digest.totalItems,
        estimated_read_time: digest.estimatedTotalReadTime,
      })
      .select('id')
      .single();

    if (digestError) {
      console.error('Error storing digest:', digestError);
      throw digestError;
    }

    const digestId = digestData.id;

    // Store digest items
    const digestItems = digest.topStories.map((item, index) => ({
      digest_id: digestId,
      content_item_id: item.id,
      relevance_score: item.relevanceScore,
      category: item.category,
      summary: item.summary,
      key_points: item.keyPoints,
      estimated_read_time: item.estimatedReadTime,
      display_order: index,
    }));

    const { error: itemsError } = await supabase
      .from('daily_digest_items')
      .insert(digestItems);

    if (itemsError) {
      console.error('Error storing digest items:', itemsError);
      throw itemsError;
    }

    return digestId;
  } catch (error) {
    console.error('Error storing daily digest:', error);
    throw error;
  }
}

/**
 * Get a user's daily digest for a specific date
 */
export async function getDailyDigest(userId: string, date: string): Promise<StoredDigest | null> {
  try {
    // Get the main digest record
    const { data: digest, error: digestError } = await supabase
      .from('daily_digests')
      .select('*')
      .eq('user_id', userId)
      .eq('digest_date', date)
      .single();

    if (digestError) {
      if (digestError.code === 'PGRST116') {
        // No digest found for this date
        return null;
      }
      console.error('Error fetching digest:', digestError);
      throw digestError;
    }

    // Get the digest items with content details
    const { data: items, error: itemsError } = await supabase
      .from('daily_digest_items')
      .select(`
        *,
        content_items (
          id,
          title,
          url,
          description,
          image_url,
          published_at,
          content_type,
          feed_sources (
            name,
            type
          )
        )
      `)
      .eq('digest_id', digest.id)
      .order('display_order');

    if (itemsError) {
      console.error('Error fetching digest items:', itemsError);
      throw itemsError;
    }

    return {
      ...digest,
      content_items: items || [],
    };
  } catch (error) {
    console.error('Error getting daily digest:', error);
    throw error;
  }
}

/**
 * Get a user's recent digests (last 7 days)
 */
export async function getRecentDigests(userId: string, limit: number = 7): Promise<StoredDigest[]> {
  try {
    const { data: digests, error: digestError } = await supabase
      .from('daily_digests')
      .select('*')
      .eq('user_id', userId)
      .order('digest_date', { ascending: false })
      .limit(limit);

    if (digestError) {
      console.error('Error fetching recent digests:', digestError);
      throw digestError;
    }

    return digests || [];
  } catch (error) {
    console.error('Error getting recent digests:', error);
    throw error;
  }
}

/**
 * Check if a digest exists for a user on a specific date
 */
export async function digestExists(userId: string, date: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('daily_digests')
      .select('id')
      .eq('user_id', userId)
      .eq('digest_date', date)
      .single();

    if (error && error.code === 'PGRST116') {
      return false;
    }

    if (error) {
      console.error('Error checking digest existence:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking digest existence:', error);
    throw error;
  }
}

/**
 * Delete a digest and its items
 */
export async function deleteDigest(digestId: string): Promise<void> {
  try {
    // Delete digest items first (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from('daily_digest_items')
      .delete()
      .eq('digest_id', digestId);

    if (itemsError) {
      console.error('Error deleting digest items:', itemsError);
      throw itemsError;
    }

    // Delete the main digest record
    const { error: digestError } = await supabase
      .from('daily_digests')
      .delete()
      .eq('id', digestId);

    if (digestError) {
      console.error('Error deleting digest:', digestError);
      throw digestError;
    }
  } catch (error) {
    console.error('Error deleting digest:', error);
    throw error;
  }
}

/**
 * Get digest statistics for a user
 */
export async function getDigestStats(userId: string): Promise<{
  totalDigests: number;
  averageItemsPerDigest: number;
  averageReadTime: number;
  mostActiveCategory: string;
}> {
  try {
    const { data: digests, error } = await supabase
      .from('daily_digests')
      .select('total_items, estimated_read_time')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching digest stats:', error);
      throw error;
    }

    if (!digests || digests.length === 0) {
      return {
        totalDigests: 0,
        averageItemsPerDigest: 0,
        averageReadTime: 0,
        mostActiveCategory: 'None',
      };
    }

    const totalDigests = digests.length;
    const averageItemsPerDigest = digests.reduce((sum, d) => sum + d.total_items, 0) / totalDigests;
    const averageReadTime = digests.reduce((sum, d) => sum + d.estimated_read_time, 0) / totalDigests;

    // TODO: Implement most active category calculation
    const mostActiveCategory = 'Technology'; // Placeholder

    return {
      totalDigests,
      averageItemsPerDigest: Math.round(averageItemsPerDigest),
      averageReadTime: Math.round(averageReadTime),
      mostActiveCategory,
    };
  } catch (error) {
    console.error('Error getting digest stats:', error);
    throw error;
  }
} 