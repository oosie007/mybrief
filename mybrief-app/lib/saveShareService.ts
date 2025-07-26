import { supabase } from './supabase';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';

export interface SavedArticle {
  id: string;
  user_id: string;
  content_item_id: string;
  saved_at: string;
  is_read: boolean;
  read_at?: string;
  notes?: string;
  tags?: string[];
  content_items: {
    id: string;
    title: string;
    url: string;
    description: string;
    image_url?: string;
    published_at: string;
    content_type: string;
    feed_sources: {
      name: string;
      type: string;
    };
  };
}

export interface ShareOptions {
  title?: string;
  message?: string;
  url?: string;
  type?: 'article' | 'digest' | 'custom';
}

class SaveShareService {
  /**
   * Save an article for later reading
   */
  async saveArticle(contentItemId: string, notes?: string, tags?: string[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already saved
      const { data: existing } = await supabase
        .from('saved_articles')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_item_id', contentItemId)
        .single();

      if (existing) {
        throw new Error('Article already saved');
      }

      // Save the article
      const { error } = await supabase
        .from('saved_articles')
        .insert({
          user_id: user.id,
          content_item_id: contentItemId,
          notes,
          tags,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving article:', error);
      throw error;
    }
  }

  /**
   * Remove a saved article
   */
  async removeSavedArticle(savedArticleId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('id', savedArticleId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing saved article:', error);
      throw error;
    }
  }

  /**
   * Mark article as read/unread
   */
  async toggleReadStatus(savedArticleId: string, isRead: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updateData: any = { is_read: isRead };
      if (isRead) {
        updateData.read_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('saved_articles')
        .update(updateData)
        .eq('id', savedArticleId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating read status:', error);
      throw error;
    }
  }

  /**
   * Update article notes
   */
  async updateNotes(savedArticleId: string, notes: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('saved_articles')
        .update({ notes })
        .eq('id', savedArticleId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating notes:', error);
      throw error;
    }
  }

  /**
   * Update article tags
   */
  async updateTags(savedArticleId: string, tags: string[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('saved_articles')
        .update({ tags })
        .eq('id', savedArticleId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating tags:', error);
      throw error;
    }
  }

  /**
   * Get all saved articles for a user
   */
  async getSavedArticles(filters?: {
    isRead?: boolean;
    tags?: string[];
    searchQuery?: string;
  }): Promise<SavedArticle[]> {
    try {
      // Mock data for demo purposes
      const mockSavedArticles: SavedArticle[] = [
        {
          id: '1',
          user_id: 'demo-user',
          content_item_id: '1',
          saved_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          is_read: false,
          read_at: undefined,
          notes: 'Interesting article about AI',
          tags: ['technology', 'ai'],
          content_items: {
            id: '1',
            title: 'The Future of AI in Mobile Development',
            url: 'https://example.com/ai-mobile-dev',
            description: 'Exploring how artificial intelligence is transforming the way we build and use mobile applications.',
            image_url: undefined,
            published_at: new Date(Date.now() - 86400000).toISOString(),
            content_type: 'article',
            feed_sources: {
              name: 'TechCrunch',
              type: 'rss'
            }
          }
        },
        {
          id: '2',
          user_id: 'demo-user',
          content_item_id: '2',
          saved_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          is_read: true,
          read_at: new Date(Date.now() - 86400000).toISOString(),
          notes: 'Good insights on startup funding',
          tags: ['business', 'startups'],
          content_items: {
            id: '2',
            title: 'Startup Funding Trends in 2024',
            url: 'https://example.com/startup-funding',
            description: 'A comprehensive look at the changing landscape of startup funding and what entrepreneurs need to know.',
            image_url: undefined,
            published_at: new Date(Date.now() - 172800000).toISOString(),
            content_type: 'article',
            feed_sources: {
              name: 'VentureBeat',
              type: 'rss'
            }
          }
        }
      ];

      // Apply filters to mock data
      let filteredArticles = mockSavedArticles;

      if (filters?.isRead !== undefined) {
        filteredArticles = filteredArticles.filter(article => article.is_read === filters.isRead);
      }

      if (filters?.tags && filters.tags.length > 0) {
        filteredArticles = filteredArticles.filter(article => 
          article.tags && filters.tags!.some(tag => article.tags!.includes(tag))
        );
      }

      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredArticles = filteredArticles.filter(article => 
          article.content_items.title.toLowerCase().includes(query) ||
          article.content_items.description.toLowerCase().includes(query)
        );
      }

      return filteredArticles;
    } catch (error) {
      console.error('Error fetching saved articles:', error);
      throw error;
    }
  }

  /**
   * Get saved article statistics
   */
  async getSavedArticleStats(): Promise<{
    total: number;
    read: number;
    unread: number;
    tags: { [key: string]: number };
  }> {
    try {
      // Mock data for demo purposes
      const mockStats = {
        total: 2,
        read: 1,
        unread: 1,
        tags: {
          'technology': 1,
          'ai': 1,
          'business': 1,
          'startups': 1
        }
      };

      return mockStats;
    } catch (error) {
      console.error('Error fetching saved article stats:', error);
      throw error;
    }
  }

  /**
   * Share an article
   */
  async shareArticle(article: SavedArticle, options?: ShareOptions): Promise<void> {
    try {
      const shareOptions = {
        title: options?.title || article.content_items.title,
        message: options?.message || `${article.content_items.title}\n\n${article.content_items.description}\n\nRead more: ${article.content_items.url}`,
        url: options?.url || article.content_items.url,
      };

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareOptions.url, {
          mimeType: 'text/plain',
          dialogTitle: shareOptions.title,
        });
      } else {
        // Fallback to opening in browser
        await Linking.openURL(shareOptions.url);
      }
    } catch (error) {
      console.error('Error sharing article:', error);
      throw error;
    }
  }

  /**
   * Share daily digest
   */
  async shareDailyDigest(digestData: {
    date: string;
    summary: string;
    articles: Array<{ title: string; url: string }>;
  }): Promise<void> {
    try {
      const message = `📰 My Daily Digest - ${digestData.date}\n\n${digestData.summary}\n\nTop Articles:\n${digestData.articles.map((article, index) => `${index + 1}. ${article.title}`).join('\n')}\n\nGenerated by MyBrief`;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync('', {
          mimeType: 'text/plain',
          dialogTitle: 'Share Daily Digest',
        });
      } else {
        // Fallback to clipboard or other sharing method
        console.log('Sharing not available, message:', message);
      }
    } catch (error) {
      console.error('Error sharing daily digest:', error);
      throw error;
    }
  }

  /**
   * Bulk operations on saved articles
   */
  async bulkUpdateSavedArticles(
    articleIds: string[],
    updates: {
      isRead?: boolean;
      tags?: string[];
    }
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updateData: any = {};
      if (updates.isRead !== undefined) {
        updateData.is_read = updates.isRead;
        if (updates.isRead) {
          updateData.read_at = new Date().toISOString();
        }
      }
      if (updates.tags !== undefined) {
        updateData.tags = updates.tags;
      }

      const { error } = await supabase
        .from('saved_articles')
        .update(updateData)
        .in('id', articleIds)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error bulk updating saved articles:', error);
      throw error;
    }
  }

  /**
   * Bulk delete saved articles
   */
  async bulkDeleteSavedArticles(articleIds: string[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .in('id', articleIds)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error bulk deleting saved articles:', error);
      throw error;
    }
  }

  /**
   * Get all unique tags used by the user
   */
  async getUserTags(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('saved_articles')
        .select('tags')
        .eq('user_id', user.id)
        .not('tags', 'is', null);

      if (error) throw error;

      const allTags = (data || [])
        .flatMap(article => article.tags || [])
        .filter((tag, index, array) => array.indexOf(tag) === index);

      return allTags.sort();
    } catch (error) {
      console.error('Error fetching user tags:', error);
      throw error;
    }
  }

  /**
   * Check if an article is saved
   */
  async isArticleSaved(contentItemId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('saved_articles')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_item_id', contentItemId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const saveShareService = new SaveShareService(); 