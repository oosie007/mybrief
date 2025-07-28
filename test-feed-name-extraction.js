// Test feed name extraction for YouTube URLs
const testUrls = [
  'https://www.youtube.com/@aliabdaal',
  'https://www.youtube.com/@techcrunch',
  'https://www.youtube.com/@theverge',
  'https://www.youtube.com/@wired'
];

const formatChannelName = (id) => {
  // Handle common patterns
  if (id === 'aliabdaal') return 'Ali Abdaal';
  if (id === 'techcrunch') return 'TechCrunch';
  if (id === 'theverge') return 'The Verge';
  if (id === 'wired') return 'WIRED';
  
  // Generic conversion for other cases
  return id
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .replace(/\s+/g, ' ') // Clean up multiple spaces
    .trim();
};

const extractFeedNameFromUrl = (url, type) => {
  if (!url.trim()) return '';
  
  try {
    const urlObj = new URL(url);
    
    switch (type) {
      case 'youtube':
        const youtubeMatch = url.match(/youtube\.com\/@([^\/\?]+)/);
        if (youtubeMatch) {
          const channelId = youtubeMatch[1];
          return formatChannelName(channelId);
        }
        break;
      case 'reddit':
        const redditMatch = url.match(/reddit\.com\/r\/([^\/\?]+)/);
        if (redditMatch) {
          return `r/${redditMatch[1]}`;
        }
        break;
      case 'rss':
        return urlObj.hostname.replace('www.', '').split('.')[0];
    }
  } catch (error) {
    console.error('Error parsing URL:', error);
  }
  
  return '';
};

console.log('Testing feed name extraction:');
testUrls.forEach(url => {
  const name = extractFeedNameFromUrl(url, 'youtube');
  console.log(`${url} -> "${name}"`);
}); 