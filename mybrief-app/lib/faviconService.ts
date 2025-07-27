import { Image } from 'react-native';

interface FaviconCache {
  [url: string]: string;
}

// Cache to avoid refetching the same favicons
const faviconCache: FaviconCache = {};

/**
 * Get the favicon URL for a given website URL
 * Uses multiple fallback methods to find the best favicon
 */
export const getFaviconUrl = (url: string): string => {
  // Check cache first
  if (faviconCache[url]) {
    return faviconCache[url];
  }

  try {
    // Extract domain from URL
    const domain = extractDomain(url);
    
    // Method 1: Google's favicon service (most reliable)
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    
    // Method 2: Direct favicon path (common locations)
    const directFaviconUrl = `https://${domain}/favicon.ico`;
    
    // Method 3: Apple touch icon (often higher quality)
    const appleTouchIconUrl = `https://${domain}/apple-touch-icon.png`;
    
    // For now, use Google's service as it's most reliable
    // In the future, we could implement a fallback chain
    const faviconUrl = googleFaviconUrl;
    
    // Cache the result
    faviconCache[url] = faviconUrl;
    
    return faviconUrl;
  } catch (error) {
    console.error('Error getting favicon URL:', error);
    // Return a default icon
    return 'https://www.google.com/s2/favicons?domain=example.com&sz=32';
  }
};

/**
 * Extract domain from URL
 */
const extractDomain = (url: string): string => {
  try {
    // Remove protocol
    let domain = url.replace(/^https?:\/\//, '');
    // Remove path and query parameters
    domain = domain.split('/')[0];
    // Remove port if present
    domain = domain.split(':')[0];
    return domain;
  } catch (error) {
    console.error('Error extracting domain:', error);
    return 'example.com';
  }
};

/**
 * Preload favicons for better performance
 */
export const preloadFavicons = async (urls: string[]): Promise<void> => {
  const uniqueUrls = [...new Set(urls)];
  
  for (const url of uniqueUrls) {
    try {
      const faviconUrl = getFaviconUrl(url);
      // Preload the image
      await new Promise((resolve, reject) => {
        Image.prefetch(faviconUrl)
          .then(() => resolve(undefined))
          .catch(reject);
      });
    } catch (error) {
      console.error('Error preloading favicon:', error);
    }
  }
};

/**
 * Get favicon URL for a feed source by name (for known sources)
 */
export const getFeedSourceFavicon = (sourceName: string, sourceUrl?: string): string => {
  // Known feed sources with their actual favicon URLs
  const knownSources: { [key: string]: string } = {
    'TechCrunch': 'https://www.google.com/s2/favicons?domain=techcrunch.com&sz=32',
    'The Verge': 'https://www.google.com/s2/favicons?domain=theverge.com&sz=32',
    'Wired': 'https://www.google.com/s2/favicons?domain=wired.com&sz=32',
    'Ars Technica': 'https://www.google.com/s2/favicons?domain=arstechnica.com&sz=32',
    'Hacker News': 'https://www.google.com/s2/favicons?domain=news.ycombinator.com&sz=32',
    'Bloomberg': 'https://www.google.com/s2/favicons?domain=bloomberg.com&sz=32',
  };

  // Reddit subreddit favicons
  const redditSubreddits: { [key: string]: string } = {
    'r/technology': 'https://www.google.com/s2/favicons?domain=reddit.com/r/technology&sz=32',
    'r/programming': 'https://www.google.com/s2/favicons?domain=reddit.com/r/programming&sz=32',
    'r/webdev': 'https://www.google.com/s2/favicons?domain=reddit.com/r/webdev&sz=32',
    'r/javascript': 'https://www.google.com/s2/favicons?domain=reddit.com/r/javascript&sz=32',
    'r/reactjs': 'https://www.google.com/s2/favicons?domain=reddit.com/r/reactjs&sz=32',
    'r/node': 'https://www.google.com/s2/favicons?domain=reddit.com/r/node&sz=32',
    'r/Python': 'https://www.google.com/s2/favicons?domain=reddit.com/r/Python&sz=32',
    'r/aws': 'https://www.google.com/s2/favicons?domain=reddit.com/r/aws&sz=32',
    'r/docker': 'https://www.google.com/s2/favicons?domain=reddit.com/r/docker&sz=32',
    'r/kubernetes': 'https://www.google.com/s2/favicons?domain=reddit.com/r/kubernetes&sz=32',
    'r/startups': 'https://www.google.com/s2/favicons?domain=reddit.com/r/startups&sz=32',
    'r/entrepreneur': 'https://www.google.com/s2/favicons?domain=reddit.com/r/entrepreneur&sz=32',
    'r/business': 'https://www.google.com/s2/favicons?domain=reddit.com/r/business&sz=32',
    'r/investing': 'https://www.google.com/s2/favicons?domain=reddit.com/r/investing&sz=32',
    'r/finance': 'https://www.google.com/s2/favicons?domain=reddit.com/r/finance&sz=32',
    'r/worldnews': 'https://www.google.com/s2/favicons?domain=reddit.com/r/worldnews&sz=32',
    'r/news': 'https://www.google.com/s2/favicons?domain=reddit.com/r/news&sz=32',
    'r/science': 'https://www.google.com/s2/favicons?domain=reddit.com/r/science&sz=32',
    'r/Futurology': 'https://www.google.com/s2/favicons?domain=reddit.com/r/Futurology&sz=32',
    'r/space': 'https://www.google.com/s2/favicons?domain=reddit.com/r/space&sz=32',
    'r/productivity': 'https://www.google.com/s2/favicons?domain=reddit.com/r/productivity&sz=32',
    'r/getdisciplined': 'https://www.google.com/s2/favicons?domain=reddit.com/r/getdisciplined&sz=32',
    'r/selfimprovement': 'https://www.google.com/s2/favicons?domain=reddit.com/r/selfimprovement&sz=32',
    'r/books': 'https://www.google.com/s2/favicons?domain=reddit.com/r/books&sz=32',
    'r/learnprogramming': 'https://www.google.com/s2/favicons?domain=reddit.com/r/learnprogramming&sz=32',
    'r/MachineLearning': 'https://www.google.com/s2/favicons?domain=reddit.com/r/MachineLearning&sz=32',
    'r/artificial': 'https://www.google.com/s2/favicons?domain=reddit.com/r/artificial&sz=32',
    'r/OpenAI': 'https://www.google.com/s2/favicons?domain=reddit.com/r/OpenAI&sz=32',
    'r/StableDiffusion': 'https://www.google.com/s2/favicons?domain=reddit.com/r/StableDiffusion&sz=32',
    'r/LocalLLaMA': 'https://www.google.com/s2/favicons?domain=reddit.com/r/LocalLLaMA&sz=32',
    'r/gaming': 'https://www.google.com/s2/favicons?domain=reddit.com/r/gaming&sz=32',
    'r/pcgaming': 'https://www.google.com/s2/favicons?domain=reddit.com/r/pcgaming&sz=32',
    'r/PS5': 'https://www.google.com/s2/favicons?domain=reddit.com/r/PS5&sz=32',
    'r/xboxone': 'https://www.google.com/s2/favicons?domain=reddit.com/r/xboxone&sz=32',
    'r/NintendoSwitch': 'https://www.google.com/s2/favicons?domain=reddit.com/r/NintendoSwitch&sz=32',
  };

  // Check if it's a known source first
  if (knownSources[sourceName]) {
    return knownSources[sourceName];
  }

  // Check if it's a Reddit subreddit
  if (redditSubreddits[sourceName]) {
    return redditSubreddits[sourceName];
  }

  // Check if it's a Reddit URL but not in our known list
  if (sourceUrl && sourceUrl.includes('reddit.com')) {
    return 'https://www.google.com/s2/favicons?domain=reddit.com&sz=32';
  }

  // Fallback to generic favicon service
  if (sourceUrl) {
    return getFaviconUrl(sourceUrl);
  }

  // Final fallback
  return 'https://www.google.com/s2/favicons?domain=example.com&sz=32';
}; 