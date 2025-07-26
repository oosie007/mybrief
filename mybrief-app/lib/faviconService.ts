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

  // Check if we have a known source
  if (knownSources[sourceName]) {
    return knownSources[sourceName];
  }

  // Fallback to Google's favicon service using the URL
  if (sourceUrl) {
    return getFaviconUrl(sourceUrl);
  }

  // Default fallback
  return 'https://www.google.com/s2/favicons?domain=example.com&sz=32';
}; 