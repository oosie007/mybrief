import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js'
import RSSParser from 'https://esm.sh/rss-parser'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

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
    const parser = new RSSParser()
    let totalProcessed = 0
    let totalNewItems = 0

    for (const feed of feeds) {
      try {
        console.log(`Processing feed: ${feed.name} (${feed.url})`)
        const content = await parser.parseURL(feed.url)
        
        for (const item of content.items) {
          try {
            // 3. Insert new content into content_items (deduplicate by url)
            const { error: insertError } = await supabase
              .from('content_items')
              .upsert({
                feed_source_id: feed.id,
                title: item.title || 'Untitled',
                url: item.link || '',
                description: item.contentSnippet || item.summary || '',
                image_url: item.enclosure?.url || null,
                published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                content_type: 'article',
                raw_content: item,
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