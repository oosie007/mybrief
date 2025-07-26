import { ContentItem } from './digestGenerator';

export interface ProcessedContent {
  id: string;
  title: string;
  url: string;
  summary: string;
  relevanceScore: number;
  category: string;
  keyPoints: string[];
  estimatedReadTime: number;
  content_type: string;
  feed_sources: {
    name: string;
    type: string;
  };
}

export interface DailyDigest {
  userId: string;
  date: string;
  summary: string;
  topStories: ProcessedContent[];
  contentByCategory: {
    [category: string]: ProcessedContent[];
  };
  totalItems: number;
  estimatedTotalReadTime: number;
}

/**
 * Process content items using OpenAI GPT-4 for ranking and summarization
 */
export async function processContentWithAI(
  contentItems: ContentItem[],
  userPreferences?: any
): Promise<ProcessedContent[]> {
  try {
    if (!contentItems.length) {
      return [];
    }

    // Prepare content for AI processing
    const contentForAI = contentItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      url: item.url,
      contentType: item.content_type,
      source: item.feed_sources.name,
      publishedAt: item.published_at,
    }));

    // Create AI prompt for content processing
    const prompt = createContentProcessingPrompt(contentForAI, userPreferences);

    // Call OpenAI API (you'll need to add your OpenAI API key to environment variables)
    const response = await callOpenAI(prompt);

    // Parse AI response and map back to content items
    const processedContent = parseAIResponse(response, contentItems);

    return processedContent;
  } catch (error) {
    console.error('Error processing content with AI:', error);
    // Fallback: return content items with basic processing
    return contentItems.map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      summary: item.description.substring(0, 200) + '...',
      relevanceScore: 0.5,
      category: 'General',
      keyPoints: [],
      estimatedReadTime: Math.ceil(item.description.length / 200), // Rough estimate
      content_type: item.content_type,
      feed_sources: item.feed_sources,
    }));
  }
}

/**
 * Create a comprehensive prompt for AI content processing
 */
function createContentProcessingPrompt(contentItems: any[], userPreferences?: any): string {
  const userContext = userPreferences ? 
    `User preferences: ${JSON.stringify(userPreferences)}` : 
    'No specific user preferences provided';

  return `
You are an AI content curator for a daily digest app called "mybrief". Your job is to process, rank, and summarize content items for busy professionals who want to stay informed without information overload.

${userContext}

Please analyze the following content items and provide:
1. A relevance score (0-1) based on importance and user interests
2. A concise summary (2-3 sentences max)
3. A category (e.g., "Technology", "Business", "Startups", "Productivity", "News")
4. 2-3 key points or insights
5. Estimated read time in minutes

Content items to process:
${JSON.stringify(contentItems, null, 2)}

Please respond with a JSON array where each item has:
{
  "id": "content_id",
  "summary": "concise summary",
  "relevanceScore": 0.85,
  "category": "Technology",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "estimatedReadTime": 3
}

Focus on:
- Relevance to busy professionals and tech enthusiasts
- Actionable insights and key takeaways
- Clear, concise summaries
- Appropriate categorization
- Realistic read time estimates

Respond only with the JSON array, no additional text.
`;
}

/**
 * Call OpenAI API (you'll need to implement this with your API key)
 */
async function callOpenAI(prompt: string): Promise<string> {
  // TODO: Implement OpenAI API call
  // You'll need to add OPENAI_API_KEY to your environment variables
  
  // For now, return a mock response
  console.log('OpenAI API call would be made here with prompt:', prompt.substring(0, 200) + '...');
  
  // Mock response for development
  return JSON.stringify([
    {
      id: "mock_id",
      summary: "This is a mock summary for development purposes.",
      relevanceScore: 0.8,
      category: "Technology",
      keyPoints: ["Key insight 1", "Key insight 2"],
      estimatedReadTime: 2
    }
  ]);
}

/**
 * Parse AI response and map back to original content items
 */
function parseAIResponse(aiResponse: string, originalItems: ContentItem[]): ProcessedContent[] {
  try {
    const parsed = JSON.parse(aiResponse);
    
    return parsed.map((processed: any) => {
      const originalItem = originalItems.find(item => item.id === processed.id);
      if (!originalItem) {
        throw new Error(`Original item not found for processed ID: ${processed.id}`);
      }

      return {
        id: processed.id,
        title: originalItem.title,
        url: originalItem.url,
        summary: processed.summary,
        relevanceScore: processed.relevanceScore,
        category: processed.category,
        keyPoints: processed.keyPoints,
        estimatedReadTime: processed.estimatedReadTime,
        content_type: originalItem.content_type,
        feed_sources: originalItem.feed_sources,
      };
    });
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw error;
  }
}

/**
 * Generate a daily digest summary for a user
 */
export async function generateDailyDigest(
  userId: string,
  processedContent: ProcessedContent[],
  date: string
): Promise<DailyDigest> {
  try {
    // Sort by relevance score
    const sortedContent = processedContent.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Get top stories (top 10 most relevant)
    const topStories = sortedContent.slice(0, 10);
    
    // Group by category
    const contentByCategory: { [category: string]: ProcessedContent[] } = {};
    sortedContent.forEach(item => {
      if (!contentByCategory[item.category]) {
        contentByCategory[item.category] = [];
      }
      contentByCategory[item.category].push(item);
    });
    
    // Calculate total read time
    const estimatedTotalReadTime = sortedContent.reduce((total, item) => total + item.estimatedReadTime, 0);
    
    // Generate digest summary using AI
    const digestSummary = await generateDigestSummary(topStories, date);
    
    return {
      userId,
      date,
      summary: digestSummary,
      topStories,
      contentByCategory,
      totalItems: sortedContent.length,
      estimatedTotalReadTime,
    };
  } catch (error) {
    console.error('Error generating daily digest:', error);
    throw error;
  }
}

/**
 * Generate a digest summary using AI
 */
async function generateDigestSummary(topStories: ProcessedContent[], date: string): Promise<string> {
  const prompt = `
Generate a brief, engaging summary for today's daily digest (${date}) based on these top stories:

${topStories.map(story => `- ${story.title}: ${story.summary}`).join('\n')}

The summary should be:
- 2-3 sentences maximum
- Engaging and informative
- Highlight the most important trends or themes
- Written for busy professionals

Respond with just the summary text, no additional formatting.
`;

  try {
    const response = await callOpenAI(prompt);
    return response.replace(/"/g, '').trim();
  } catch (error) {
    console.error('Error generating digest summary:', error);
    return `Your daily digest for ${date} contains ${topStories.length} curated stories to keep you informed.`;
  }
}

/**
 * Filter content based on user preferences and relevance
 */
export function filterContentByRelevance(
  processedContent: ProcessedContent[],
  minRelevanceScore: number = 0.3
): ProcessedContent[] {
  return processedContent.filter(item => item.relevanceScore >= minRelevanceScore);
} 