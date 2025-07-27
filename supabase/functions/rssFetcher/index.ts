import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

interface RSSItem {
  title: string
  link: string
  contentSnippet: string
  summary: string
  cleanedContentSnippet: string
  cleanedSummary: string
  pubDate: string
  enclosure: { url: string } | null
  author?: string
  dcCreator?: string
  itunesAuthor?: string
}

async function parseRSS(url: string): Promise<{ items: RSSItem[] }> {
  try {
    console.log(`Fetching RSS from: ${url}`)
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const xmlText = await response.text()
    console.log(`Received ${xmlText.length} characters of XML`)
    
    // Parse the XML to extract RSS items
    const items: RSSItem[] = []
    
    // Extract items using regex patterns
    const itemPattern = /<item[^>]*>([\s\S]*?)<\/item>/gi
    let itemMatch
    
    while ((itemMatch = itemPattern.exec(xmlText)) !== null) {
      const itemXml = itemMatch[1]
      
      // Extract title
      const titleMatch = itemXml.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : ''
      
      // Extract link
      const linkMatch = itemXml.match(/<link[^>]*>([^<]+)<\/link>/i)
      const link = linkMatch ? linkMatch[1].trim() : ''
      
      // Extract description/content
      const descriptionMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i)
      const contentMatch = itemXml.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)
      const summaryMatch = itemXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)
      
      const contentSnippet = descriptionMatch ? descriptionMatch[1].trim() : ''
      const summary = contentMatch ? contentMatch[1].trim() : (summaryMatch ? summaryMatch[1].trim() : contentSnippet)
      
      // Clean HTML content
      const cleanContent = (text: string): string => {
        if (!text) return '';
        
        // Decode HTML entities
        let cleaned = text
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/&hellip;/g, '...');
        
        // Remove HTML tags
        cleaned = cleaned.replace(/<[^>]*>/g, '');
        
        // Remove extra whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        return cleaned;
      };
      
      const cleanedContentSnippet = cleanContent(contentSnippet);
      const cleanedSummary = cleanContent(summary);
      
      // Extract publication date
      const pubDateMatch = itemXml.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i)
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : ''
      
      // Extract author information (try multiple common RSS author fields)
      const authorMatch = itemXml.match(/<author[^>]*>([^<]+)<\/author>/i)
      const dcCreatorMatch = itemXml.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i)
      const itunesAuthorMatch = itemXml.match(/<itunes:author[^>]*>([^<]+)<\/itunes:author>/i)
      
      const author = authorMatch ? authorMatch[1].trim() : 
                    dcCreatorMatch ? dcCreatorMatch[1].trim() : 
                    itunesAuthorMatch ? itunesAuthorMatch[1].trim() : ''
      
      // Extract enclosure (image)
      const enclosureMatch = itemXml.match(/<enclosure[^>]*url="([^"]+)"[^>]*>/i)
      const enclosure = enclosureMatch ? { url: enclosureMatch[1] } : null
      
      if (title && link) {
        items.push({
          title,
          link,
          contentSnippet,
          summary,
          cleanedContentSnippet,
          cleanedSummary,
          pubDate,
          enclosure,
          author
        })
      }
    }
    
    console.log(`Parsed ${items.length} items from RSS feed`)
    return { items }
  } catch (error) {
    console.error(`Error fetching RSS from ${url}:`, error)
    throw error
  }
}

serve(async (req) => {
  try {
    console.log('RSS Fetcher started')
    
    // 1. Get all active RSS feed sources
    const { data: feeds, error } = await supabase
      .from('feed_sources')
      .select('*')
      .eq('type', 'rss')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching feeds:', error)
      return new Response(JSON.stringify({ error: 'Error fetching feeds' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${feeds?.length || 0} RSS feeds to process`)

    if (!feeds || feeds.length === 0) {
      return new Response(JSON.stringify({ message: 'No RSS feeds found' }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 2. For each feed, fetch and parse RSS
    let totalProcessed = 0
    let totalNewItems = 0

    for (const feed of feeds) {
      try {
        console.log(`Processing feed: ${feed.name} (${feed.url})`)
        const content = await parseRSS(feed.url)
        
        for (const item of content.items) {
          try {
            // Log author information for debugging
            if (item.author) {
              console.log(`Found author for "${item.title}": ${item.author}`)
            }
            
            // 3. Insert new content into content_items (deduplicate by url)
            const { error: insertError } = await supabase
              .from('content_items')
              .upsert({
                feed_source_id: feed.id,
                title: item.title || 'Untitled',
                url: item.link || '',
                description: item.cleanedContentSnippet || item.cleanedSummary || '',
                image_url: item.enclosure?.url || null,
                published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                content_type: 'article',
                raw_content: item,
                author: item.author || null,
              }, { onConflict: 'url' })

            if (insertError) {
              console.error(`Error inserting item from ${feed.name}:`, insertError)
            } else {
              totalNewItems++
            }
          } catch (itemError) {
            console.error(`Error processing item from ${feed.name}:`, itemError)
          }
        }
        
        totalProcessed++
      } catch (feedError) {
        console.error(`Error processing feed ${feed.name}:`, feedError)
      }
    }

    console.log(`RSS Fetcher completed. Processed ${totalProcessed} feeds, added ${totalNewItems} new items`)
    
    return new Response(JSON.stringify({ 
      message: 'RSS fetch complete',
      processed: totalProcessed,
      newItems: totalNewItems
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('RSS Fetcher error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}) 