import { supabase } from './supabase';

export interface SavedArticle {
  id: string;
  user_id: string;
  content_item_id: string;
  saved_at: string;
  read_at?: string | null;
  reminder_shown_at?: string | null;
  content_data?: {
    id: string;
    title: string;
    url: string;
    description: string;
    image_url?: string;
    published_at: string;
    content_type: string;
    feed_sources?: {
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
  };
}

export const savedArticlesService = {
  // Save an article
  async saveArticle(contentItemId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      // Check if the article is already saved
      const { data: existingSaved } = await supabase
        .from('saved_articles')
        .select('read_at, saved_at')
        .eq('user_id', user.id)
        .eq('content_item_id', contentItemId)
        .maybeSingle();

      let readAt = existingSaved?.read_at || null;

      // If not already saved, check if it was read in the main feed (tracked with saved_at = null)
      if (!existingSaved?.saved_at && !readAt) {
        try {
          const { data: readData } = await supabase
            .from('saved_articles')
            .select('read_at')
            .eq('user_id', user.id)
            .eq('content_item_id', contentItemId)
            .is('saved_at', null)
            .not('read_at', 'is', null)
            .maybeSingle();

          if (readData?.read_at) {
            readAt = readData.read_at;
          }
        } catch (readError) {
          // No read status found
        }
      }

      // Prepare the saved article data
      const savedArticleData: any = {
        user_id: user.id,
        content_item_id: contentItemId,
        saved_at: new Date().toISOString(), // Mark as properly saved
      };

      // If the article was already read, preserve the read status
      if (readAt) {
        savedArticleData.read_at = readAt;
      }

      console.log('=== SAVING ARTICLE ===');
      console.log('Content Item ID:', contentItemId);
      console.log('Saved At:', savedArticleData.saved_at);
      console.log('Existing Saved:', !!existingSaved);
      console.log('=====================');

      let error;
      if (existingSaved) {
        // Update existing entry
        const { error: updateError } = await supabase
          .from('saved_articles')
          .update(savedArticleData)
          .eq('user_id', user.id)
          .eq('content_item_id', contentItemId);
        error = updateError;
      } else {
        // Insert new entry
        const { error: insertError } = await supabase
          .from('saved_articles')
          .insert(savedArticleData);
        error = insertError;
      }

      if (error) {
        console.error('Error saving article:', error);
        return false;
      }

      console.log('Article saved successfully');
      return true;
    } catch (error) {
      console.error('Error in saveArticle:', error);
      return false;
    }
  },

  // Unsave an article
  async unsaveArticle(contentItemId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('user_id', user.id)
        .eq('content_item_id', contentItemId);

      if (error) {
        console.error('Error unsaving article:', error);
        return false;
      }

      console.log('Article unsaved successfully');
      return true;
    } catch (error) {
      console.error('Error in unsaveArticle:', error);
      return false;
    }
  },

  // Check if an article is saved
  async isArticleSaved(contentItemId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('saved_articles')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_item_id', contentItemId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking if article is saved:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isArticleSaved:', error);
      return false;
    }
  },

  // Mark article as read
  async markAsRead(contentItemId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const readAt = new Date().toISOString();

      // Update saved_articles if the article is saved
      const { error: savedError } = await supabase
        .from('saved_articles')
        .update({ read_at: readAt })
        .eq('user_id', user.id)
        .eq('content_item_id', contentItemId);

      if (savedError && savedError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error marking saved article as read:', savedError);
      }

      // Also track read status for unsaved articles
      // First check if an entry already exists
      const { data: existingEntry } = await supabase
        .from('saved_articles')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_item_id', contentItemId)
        .maybeSingle();

      if (existingEntry) {
        // Entry exists, just update read_at
        const { error: updateError } = await supabase
          .from('saved_articles')
          .update({ read_at: readAt })
          .eq('user_id', user.id)
          .eq('content_item_id', contentItemId);

        if (updateError) {
          console.error('Error updating read status:', updateError);
        }
      } else {
        // Entry doesn't exist, create new one for read tracking
        const { error: insertError } = await supabase
          .from('saved_articles')
          .insert({
            user_id: user.id,
            content_item_id: contentItemId,
            read_at: readAt,
            saved_at: null // This indicates it's only tracked for read status
          });

        if (insertError) {
          console.error('Error tracking read status:', insertError);
        }
      }

      console.log('Article marked as read successfully');
      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  },

  // Mark article as unread
  async markAsUnread(contentItemId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('saved_articles')
        .update({ read_at: null })
        .eq('user_id', user.id)
        .eq('content_item_id', contentItemId);

      if (error) {
        console.error('Error marking article as unread:', error);
        return false;
      }

      console.log('Article marked as unread successfully');
      return true;
    } catch (error) {
      console.error('Error in markAsUnread:', error);
      return false;
    }
  },

  // Check if an article is read
  async isArticleRead(contentItemId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('saved_articles')
        .select('read_at')
        .eq('user_id', user.id)
        .eq('content_item_id', contentItemId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking if article is read:', error);
        return false;
      }

      return !!data?.read_at;
    } catch (error) {
      console.error('Error in isArticleRead:', error);
      return false;
    }
  },

  // Clean up articles with null saved_at values
  async cleanupNullSavedAt(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, get all articles with null saved_at
      const { data: nullSavedArticles, error: fetchError } = await supabase
        .from('saved_articles')
        .select('id, content_item_id')
        .eq('user_id', user.id)
        .is('saved_at', null);

      if (fetchError) {
        console.error('Error fetching articles with null saved_at:', fetchError);
        return;
      }

      if (nullSavedArticles && nullSavedArticles.length > 0) {
        console.log(`Found ${nullSavedArticles.length} articles with null saved_at, updating them...`);
        
        // Update each article with a different timestamp (older than current time)
        const baseTime = new Date();
        baseTime.setMinutes(baseTime.getMinutes() - nullSavedArticles.length); // Start from older time
        
        for (let i = 0; i < nullSavedArticles.length; i++) {
          const timestamp = new Date(baseTime.getTime() + (i * 1000)); // Add 1 second for each article
          
          const { error } = await supabase
            .from('saved_articles')
            .update({ saved_at: timestamp.toISOString() })
            .eq('id', nullSavedArticles[i].id);

          if (error) {
            console.error(`Error updating article ${nullSavedArticles[i].id}:`, error);
          }
        }
        
        console.log('Cleaned up articles with null saved_at');
      }
    } catch (error) {
      console.error('Error in cleanupNullSavedAt:', error);
    }
  },

  // Get all saved articles for a user
  async getSavedArticles(): Promise<SavedArticle[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return [];
      }

      console.log('=== FETCHING SAVED ARTICLES ===');
      
      // First, clean up any articles with null saved_at
      await this.cleanupNullSavedAt();
      
      const { data: savedArticles, error } = await supabase
        .from('saved_articles')
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
            ),
            author,
            score,
            num_comments,
            subreddit,
            permalink,
            is_self,
            domain
          )
        `)
        .eq('user_id', user.id)
        .not('saved_at', 'is', null) // Only get articles that are properly saved
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved articles:', error);
        return [];
      }

      console.log('Fetched saved articles:', savedArticles?.length || 0);
      
      // Debug: Log the first few articles with their saved_at dates
      if (savedArticles && savedArticles.length > 0) {
        console.log('=== SAVED ARTICLES ORDER ===');
        savedArticles.slice(0, 5).forEach((article, index) => {
          console.log(`${index + 1}. "${article.content_items?.title}" - Saved: ${article.saved_at} - Published: ${article.content_items?.published_at}`);
        });
        console.log('============================');
      }
      
      // Map the data to match the interface structure
      const mappedArticles = (savedArticles || []).map(article => ({
        ...article,
        content_data: article.content_items // Map content_items to content_data
      }));
      
      console.log('Mapped articles:', mappedArticles.length);
      return mappedArticles;
    } catch (error) {
      console.error('Error in getSavedArticles:', error);
      return [];
    }
  },

  // Get saved article IDs for a user (for checking save state)
  async getSavedArticleIds(): Promise<Set<string>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return new Set();
      }

      const { data, error } = await supabase
        .from('saved_articles')
        .select('content_item_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching saved article IDs:', error);
        return new Set();
      }

      const savedIds = new Set(data?.map(item => item.content_item_id) || []);
      console.log('Saved article IDs:', savedIds.size);
      return savedIds;
    } catch (error) {
      console.error('Error in getSavedArticleIds:', error);
      return new Set();
    }
  }
}; 