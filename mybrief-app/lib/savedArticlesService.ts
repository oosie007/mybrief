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

      // Check if the article is already saved and read
      let readAt = null;
      
      try {
        const { data: savedReadData } = await supabase
          .from('saved_articles')
          .select('read_at')
          .eq('user_id', user.id)
          .eq('content_item_id', contentItemId)
          .single();

        if (savedReadData?.read_at) {
          readAt = savedReadData.read_at;
        }
      } catch (savedError) {
        // Article not found in saved_articles, which is expected for new saves
      }

      // Prepare the saved article data
      const savedArticleData: any = {
        user_id: user.id,
        content_item_id: contentItemId,
      };

      // If the article was already read, preserve the read status
      if (readAt) {
        savedArticleData.read_at = readAt;
      }

      const { error } = await supabase
        .from('saved_articles')
        .insert(savedArticleData);

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

      // Try to update read_articles table if it exists
      // We'll skip this for now since the table doesn't exist
      // and the saved_articles table is sufficient for tracking read status
      
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

  // Get all saved articles for a user
  async getSavedArticles(): Promise<SavedArticle[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return [];
      }

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
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved articles:', error);
        return [];
      }

      console.log('Fetched saved articles:', savedArticles?.length || 0);
      
      // Debug: Log the first article structure
      if (savedArticles && savedArticles.length > 0) {
        console.log('First saved article structure:', JSON.stringify(savedArticles[0], null, 2));
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