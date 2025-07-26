import { supabase } from './supabase';

export interface ContentError {
  feed_source_id: string;
  error_type: 'fetch_error' | 'parse_error' | 'rate_limit' | 'auth_error' | 'unknown';
  error_message: string;
  timestamp: string;
  retry_count: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingContentId?: string;
  similarityScore?: number;
}

/**
 * Check if content is a duplicate based on URL and title similarity
 */
export async function checkForDuplicates(
  url: string,
  title: string,
  feedSourceId: string
): Promise<DuplicateCheckResult> {
  try {
    // First, check for exact URL match
    const { data: exactMatch, error: exactError } = await supabase
      .from('content_items')
      .select('id, title')
      .eq('url', url)
      .eq('feed_source_id', feedSourceId)
      .single();

    if (exactMatch) {
      return {
        isDuplicate: true,
        existingContentId: exactMatch.id,
        similarityScore: 1.0,
      };
    }

    // Check for similar titles (fuzzy matching)
    const { data: similarTitles, error: similarError } = await supabase
      .from('content_items')
      .select('id, title')
      .eq('feed_source_id', feedSourceId)
      .ilike('title', `%${title.substring(0, 20)}%`)
      .limit(5);

    if (similarError) {
      console.error('Error checking for similar titles:', similarError);
      return { isDuplicate: false };
    }

    if (similarTitles && similarTitles.length > 0) {
      // Calculate similarity score for the most similar title
      const mostSimilar = similarTitles.reduce((best, current) => {
        const score = calculateTitleSimilarity(title, current.title);
        return score > best.score ? { id: current.id, score } : best;
      }, { id: '', score: 0 });

      if (mostSimilar.score > 0.8) {
        return {
          isDuplicate: true,
          existingContentId: mostSimilar.id,
          similarityScore: mostSimilar.score,
        };
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return { isDuplicate: false };
  }
}

/**
 * Calculate similarity between two titles using simple string comparison
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = title1.toLowerCase().split(/\s+/);
  const words2 = title2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return commonWords.length / totalWords;
}

/**
 * Store content error for monitoring and debugging
 */
export async function storeContentError(error: ContentError): Promise<void> {
  try {
    const { error: insertError } = await supabase
      .from('content_errors')
      .insert({
        feed_source_id: error.feed_source_id,
        error_type: error.error_type,
        error_message: error.error_message,
        timestamp: error.timestamp,
        retry_count: error.retry_count,
      });

    if (insertError) {
      console.error('Error storing content error:', insertError);
    }
  } catch (error) {
    console.error('Error storing content error:', error);
  }
}

/**
 * Get recent errors for a feed source
 */
export async function getFeedErrors(feedSourceId: string, limit: number = 10): Promise<ContentError[]> {
  try {
    const { data: errors, error } = await supabase
      .from('content_errors')
      .select('*')
      .eq('feed_source_id', feedSourceId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching feed errors:', error);
      return [];
    }

    return errors || [];
  } catch (error) {
    console.error('Error getting feed errors:', error);
    return [];
  }
}

/**
 * Check if a feed source should be temporarily disabled due to repeated errors
 */
export async function shouldDisableFeedSource(feedSourceId: string): Promise<boolean> {
  try {
    const recentErrors = await getFeedErrors(feedSourceId, 5);
    
    // If more than 3 errors in the last 5 attempts, disable the feed
    if (recentErrors.length >= 3) {
      const recentErrorCount = recentErrors.filter(error => {
        const errorTime = new Date(error.timestamp);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return errorTime > oneHourAgo;
      }).length;
      
      return recentErrorCount >= 3;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if feed should be disabled:', error);
    return false;
  }
}

/**
 * Clean up old content items to prevent database bloat
 */
export async function cleanupOldContent(daysToKeep: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('content_items')
      .delete()
      .lt('published_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up old content:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error cleaning up old content:', error);
    return 0;
  }
}

/**
 * Clean up old error logs
 */
export async function cleanupOldErrors(daysToKeep: number = 7): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('content_errors')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up old errors:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error cleaning up old errors:', error);
    return 0;
  }
}

/**
 * Get content source health statistics
 */
export async function getContentSourceHealth(): Promise<{
  totalSources: number;
  activeSources: number;
  errorSources: number;
  lastFetchTime: string;
}> {
  try {
    // Get total feed sources
    const { data: totalSources, error: totalError } = await supabase
      .from('feed_sources')
      .select('id', { count: 'exact' });

    if (totalError) {
      console.error('Error getting total sources:', totalError);
      return {
        totalSources: 0,
        activeSources: 0,
        errorSources: 0,
        lastFetchTime: new Date().toISOString(),
      };
    }

    // Get sources with recent errors
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: errorSources, error: errorError } = await supabase
      .from('content_errors')
      .select('feed_source_id')
      .gte('timestamp', oneDayAgo.toISOString());

    if (errorError) {
      console.error('Error getting error sources:', errorError);
    }

    // Count unique feed sources with errors
    const uniqueErrorSources = new Set(errorSources?.map(e => e.feed_source_id) || []);
    const errorSourceCount = uniqueErrorSources.size;
    const totalSourceCount = totalSources?.length || 0;
    const activeSourceCount = totalSourceCount - errorSourceCount;

    return {
      totalSources: totalSourceCount,
      activeSources: activeSourceCount,
      errorSources: errorSourceCount,
      lastFetchTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting content source health:', error);
    return {
      totalSources: 0,
      activeSources: 0,
      errorSources: 0,
      lastFetchTime: new Date().toISOString(),
    };
  }
} 