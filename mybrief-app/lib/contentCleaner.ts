/**
 * Content cleaning utilities for removing HTML markup and decoding entities
 */

/**
 * Decode HTML entities like &lt; to < and &gt; to >
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  const htmlEntities: { [key: string]: string } = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&hellip;': '...',
    '&mdash;': '—',
    '&ndash;': '–',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
  };

  let decoded = text;
  
  // Replace HTML entities
  Object.entries(htmlEntities).forEach(([entity, replacement]) => {
    decoded = decoded.replace(new RegExp(entity, 'g'), replacement);
  });

  return decoded;
}

/**
 * Remove HTML tags from text content
 */
export function stripHtmlTags(text: string): string {
  if (!text) return '';
  
  // First decode HTML entities
  let cleaned = decodeHtmlEntities(text);
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Clean content for display - removes HTML and limits length
 */
export function cleanContentForDisplay(content: string, maxLength: number = 200): string {
  if (!content) return '';
  
  // Strip HTML tags and decode entities
  let cleaned = stripHtmlTags(content);
  
  // Truncate if too long
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength).trim();
    // Try to end at a word boundary
    const lastSpace = cleaned.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      cleaned = cleaned.substring(0, lastSpace);
    }
    cleaned += '...';
  }
  
  return cleaned;
}

/**
 * Clean title for display
 */
export function cleanTitle(title: string): string {
  if (!title) return '';
  
  // Decode HTML entities but keep basic formatting
  let cleaned = decodeHtmlEntities(title);
  
  // Remove any remaining HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
} 