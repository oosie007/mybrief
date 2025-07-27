// Test script to check RSS author information
// Run this with: node test-rss-authors.js

const testFeeds = [
  'https://techcrunch.com/feed/',
  'https://www.theverge.com/rss/index.xml',
  'https://www.wired.com/feed/rss',
  'https://feeds.arstechnica.com/arstechnica/index',
  'https://dev.to/feed/'
];

async function testRSSFeed(url) {
  try {
    console.log(`\n=== Testing: ${url} ===`);
    const response = await fetch(url);
    const xmlText = await response.text();
    
    // Look for author patterns
    const authorPatterns = [
      /<author[^>]*>([^<]+)<\/author>/gi,
      /<dc:creator[^>]*>([^<]+)<\/dc:creator>/gi,
      /<itunes:author[^>]*>([^<]+)<\/itunes:author>/gi,
      /<dc:contributor[^>]*>([^<]+)<\/dc:contributor>/gi
    ];
    
    let foundAuthors = [];
    authorPatterns.forEach((pattern, index) => {
      const matches = xmlText.match(pattern);
      if (matches) {
        foundAuthors.push(...matches.map(match => {
          const authorMatch = match.match(/<[^>]*>([^<]+)<\/[^>]*>/);
          return authorMatch ? authorMatch[1].trim() : match;
        }));
      }
    });
    
    if (foundAuthors.length > 0) {
      console.log(`✅ Found ${foundAuthors.length} author entries:`);
      foundAuthors.slice(0, 5).forEach((author, i) => {
        console.log(`  ${i + 1}. ${author}`);
      });
      if (foundAuthors.length > 5) {
        console.log(`  ... and ${foundAuthors.length - 5} more`);
      }
    } else {
      console.log(`❌ No author information found`);
    }
    
    // Also check for item-level authors
    const itemPattern = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let itemMatch;
    let itemAuthors = [];
    
    while ((itemMatch = itemPattern.exec(xmlText)) !== null) {
      const itemXml = itemMatch[1];
      
      const authorMatch = itemXml.match(/<author[^>]*>([^<]+)<\/author>/i);
      const dcCreatorMatch = itemXml.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
      const itunesAuthorMatch = itemXml.match(/<itunes:author[^>]*>([^<]+)<\/itunes:author>/i);
      
      const author = authorMatch ? authorMatch[1].trim() : 
                    dcCreatorMatch ? dcCreatorMatch[1].trim() : 
                    itunesAuthorMatch ? itunesAuthorMatch[1].trim() : '';
      
      if (author && !itemAuthors.includes(author)) {
        itemAuthors.push(author);
      }
    }
    
    if (itemAuthors.length > 0) {
      console.log(`📝 Found ${itemAuthors.length} unique item-level authors:`);
      itemAuthors.slice(0, 3).forEach((author, i) => {
        console.log(`  ${i + 1}. ${author}`);
      });
    }
    
  } catch (error) {
    console.error(`❌ Error testing ${url}:`, error.message);
  }
}

async function runTests() {
  console.log('🔍 Testing RSS feeds for author information...\n');
  
  for (const feed of testFeeds) {
    await testRSSFeed(feed);
  }
  
  console.log('\n✅ Testing complete!');
}

runTests(); 