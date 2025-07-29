import { supabase } from './supabase';

export interface FeedCategorization {
  category: string;
  confidence: number;
  method: 'keyword' | 'ai' | 'default';
}

// Predefined categories
export const FEED_CATEGORIES = [
  'Technology',
  'Business',
  'Startups',
  'Productivity',
  'News',
  'Communities',
  'Science',
  'Health',
  'Finance',
  'Entertainment',
  'Education',
  'Politics',
  'Sports',
  'Lifestyle'
] as const;

export type FeedCategory = typeof FEED_CATEGORIES[number];

// Keyword-based categorization rules
const CATEGORY_KEYWORDS: Record<FeedCategory, string[]> = {
  Technology: [
    'tech', 'technology', 'programming', 'software', 'ai', 'artificial intelligence',
    'machine learning', 'data science', 'cybersecurity', 'blockchain', 'crypto',
    'webdev', 'react', 'javascript', 'python', 'startup', 'entrepreneur',
    'techcrunch', 'wired', 'ars technica', 'hacker news', 'verge'
  ],
  Business: [
    'business', 'entrepreneur', 'startup', 'venture', 'capital', 'funding',
    'investment', 'strategy', 'management', 'leadership', 'corporate',
    'forbes', 'bloomberg', 'wsj', 'economist', 'inc'
  ],
  Startups: [
    'startup', 'entrepreneur', 'founder', 'venture', 'funding', 'pitch',
    'accelerator', 'incubator', 'seed', 'series', 'unicorn', 'scale',
    'y combinator', 'techstars', '500 startups'
  ],
  Productivity: [
    'productivity', 'time management', 'focus', 'habits', 'efficiency',
    'workflow', 'tools', 'apps', 'software', 'automation', 'organization',
    'getting things done', 'gtd', 'pomodoro'
  ],
  News: [
    'news', 'current events', 'politics', 'world', 'breaking', 'latest',
    'cnn', 'bbc', 'reuters', 'ap', 'npr', 'pbs'
  ],
  Communities: [
    'reddit', 'discussion', 'forum', 'network', 'social media', 'twitter',
    'facebook', 'instagram', 'linkedin'
  ],
  Science: [
    'science', 'research', 'study', 'discovery', 'innovation', 'breakthrough',
    'nature', 'science magazine', 'scientific american', 'research'
  ],
  Health: [
    'health', 'medical', 'wellness', 'fitness', 'nutrition', 'medicine',
    'healthcare', 'doctor', 'patient', 'treatment', 'therapy'
  ],
  Finance: [
    'finance', 'money', 'investment', 'trading', 'stock', 'market',
    'economy', 'financial', 'wealth', 'retirement', 'savings'
  ],
  Entertainment: [
    'entertainment', 'movie', 'film', 'tv', 'show', 'celebrity',
    'hollywood', 'netflix', 'streaming', 'music', 'gaming'
  ],
  Education: [
    'education', 'learning', 'course', 'tutorial', 'study', 'academic',
    'university', 'college', 'school', 'teaching', 'training'
  ],
  Politics: [
    'politics', 'government', 'policy', 'election', 'democracy', 'republican',
    'democrat', 'congress', 'senate', 'president', 'political'
  ],
  Sports: [
    'sports', 'athletic', 'game', 'team', 'player', 'coach',
    'football', 'basketball', 'baseball', 'soccer', 'olympics'
  ],
  Lifestyle: [
    'lifestyle', 'life', 'living', 'personal', 'wellness', 'mindfulness',
    'happiness', 'relationships', 'family', 'home', 'travel'
  ]
};

/**
 * Categorize a feed using keyword matching
 */
export function categorizeFeedByKeywords(feedName: string, feedUrl: string): FeedCategorization {
  const searchText = `${feedName} ${feedUrl}`.toLowerCase();
  
  // Find the category with the most keyword matches
  let bestCategory: FeedCategory = 'Technology'; // Default
  let bestScore = 0;
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(keyword => 
      searchText.includes(keyword.toLowerCase())
    ).length;
    
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as FeedCategory;
    }
  }
  
  const confidence = bestScore > 0 ? Math.min(bestScore / 3, 1) : 0.1;
  
  return {
    category: bestCategory,
    confidence,
    method: bestScore > 0 ? 'keyword' : 'default'
  };
}

/**
 * Categorize a feed using AI (OpenAI GPT-4)
 */
export async function categorizeFeedWithAI(feedName: string, feedUrl: string): Promise<FeedCategorization> {
  try {
    // This would use OpenAI API to categorize the feed
    // For now, we'll use a simple prompt-based approach
    const prompt = `Categorize this feed into one of these categories: ${FEED_CATEGORIES.join(', ')}
    
Feed Name: ${feedName}
Feed URL: ${feedUrl}

Respond with only the category name.`;

    // In a real implementation, you'd call OpenAI API here
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   messages: [{ role: "user", content: prompt }]
    // });
    
    // For now, fall back to keyword categorization
    return categorizeFeedByKeywords(feedName, feedUrl);
  } catch (error) {
    console.error('Error categorizing feed with AI:', error);
    return categorizeFeedByKeywords(feedName, feedUrl);
  }
}

/**
 * Main function to categorize a feed
 */
export async function categorizeFeed(feedName: string, feedUrl: string): Promise<FeedCategorization> {
  // First try keyword-based categorization
  const keywordResult = categorizeFeedByKeywords(feedName, feedUrl);
  
  // If confidence is high enough, use keyword result
  if (keywordResult.confidence > 0.7) {
    return keywordResult;
  }
  
  // Otherwise, try AI categorization
  return await categorizeFeedWithAI(feedName, feedUrl);
}

/**
 * Update feed source category in database
 */
export async function updateFeedCategory(feedSourceId: string, category: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('feed_sources')
      .update({ category })
      .eq('id', feedSourceId);
    
    if (error) {
      console.error('Error updating feed category:', error);
      return false;
    }
    
    console.log(`Updated feed category to: ${category}`);
    return true;
  } catch (error) {
    console.error('Error updating feed category:', error);
    return false;
  }
}

/**
 * Categorize all uncategorized feeds
 */
export async function categorizeAllFeeds(): Promise<void> {
  try {
    // Get all feeds without categories
    const { data: feeds, error } = await supabase
      .from('feed_sources')
      .select('id, name, url, category')
      .or('category.is.null,category.eq.');
    
    if (error) {
      console.error('Error fetching feeds:', error);
      return;
    }
    
    console.log(`Found ${feeds?.length || 0} uncategorized feeds`);
    
    // Categorize each feed
    for (const feed of feeds || []) {
      const categorization = await categorizeFeed(feed.name, feed.url);
      await updateFeedCategory(feed.id, categorization.category);
    }
    
    console.log('Finished categorizing all feeds');
  } catch (error) {
    console.error('Error categorizing feeds:', error);
  }
} 