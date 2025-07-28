# Content Fetching System

## Overview

The MyBrief app uses a **hybrid content fetching system** that combines scheduled background fetches with immediate on-demand fetching for optimal user experience.

## Fetching Schedule

### Scheduled Fetches (Background)
- **Frequency**: Every 2 hours
- **Trigger**: GitHub Actions cron jobs
- **Purpose**: Keep content fresh and up-to-date
- **Coverage**: All active feeds of all types

### Immediate Fetches (On-Demand)
- **Trigger**: When user adds a new feed
- **Purpose**: Get content immediately for new feeds
- **Coverage**: Only the newly added feed

## Content Types & Timing

### RSS Feeds
- **Scheduled**: Every 2 hours
- **Immediate**: When feed is added
- **Content**: Articles, blog posts, news
- **Typical Delay**: 0-2 hours for new content

### YouTube Channels
- **Scheduled**: Every 2 hours
- **Immediate**: When channel is added
- **Content**: Videos, live streams, shorts
- **Typical Delay**: 0-2 hours for new videos

### Reddit Subreddits
- **Scheduled**: Every 2 hours
- **Immediate**: When subreddit is added
- **Content**: Posts, comments, discussions
- **Typical Delay**: 0-2 hours for new posts

## User Experience Flow

### Adding a New Feed
1. **User adds feed** → Feed is saved to database
2. **Immediate fetch triggered** → Content fetched right away
3. **Loading indicator shown** → "Fetching..." appears for 3 seconds
4. **Content appears** → New content shows up in digest
5. **Background sync continues** → Scheduled fetches keep content fresh

### Content Availability Timeline
```
User adds feed → Immediate fetch (0-30 seconds) → Content appears
                ↓
            Scheduled fetches (every 2 hours) → Content stays fresh
```

## Technical Implementation

### Edge Functions
- **RSS Fetcher**: `supabase/functions/rssFetcher/index.ts`
- **YouTube Fetcher**: `supabase/functions/youtubeFetcher/index.ts`
- **Reddit Fetcher**: `supabase/functions/redditFetcher/index.ts`

### Immediate Fetch Logic
```typescript
// Check if this is an immediate fetch for a specific feed
const body = await req.json().catch(() => ({}))
const { feedSourceId, immediate } = body

if (immediate && feedSourceId) {
  // Fetch specific feed for immediate processing
  const result = await supabase
    .from('feed_sources')
    .select('*')
    .eq('id', feedSourceId)
    .eq('type', 'rss')
    .eq('is_active', true)
    .single()
  
  feeds = result.data ? [result.data] : []
} else {
  // Get all active feeds (scheduled fetch)
  const result = await supabase
    .from('feed_sources')
    .select('*')
    .eq('type', 'rss')
    .eq('is_active', true)
  
  feeds = result.data
}
```

### Loading States
- **Feed Management**: Shows "Fetching..." indicator for 3 seconds
- **Digest Screen**: Content appears as soon as it's fetched
- **Background Process**: No user interruption

## GitHub Actions Schedule

```yaml
# RSS Fetcher
- cron: '0 */2 * * *'  # Every 2 hours

# YouTube Fetcher  
- cron: '0 */2 * * *'  # Every 2 hours

# Reddit Fetcher
- cron: '0 */2 * * *'  # Every 2 hours
```

## Content Processing Pipeline

1. **Fetch Content** → Edge functions fetch from external APIs
2. **Process & Clean** → Parse, clean, and format content
3. **Store in Database** → Save to `content_items` table
4. **Update Feed Metadata** → Update favicons, names, etc.
5. **Deduplicate** → Avoid duplicate content by URL
6. **Rank & Filter** → AI-powered content ranking

## Performance Considerations

### Rate Limiting
- **RSS**: No rate limits, fetch all feeds
- **YouTube**: API quota management, 25 videos per channel
- **Reddit**: Respect rate limits, 1 second delay between subreddits

### Error Handling
- **Graceful Degradation**: Failed fetches don't break the app
- **Retry Logic**: Automatic retries for transient errors
- **Fallback Content**: Show existing content if fetch fails

### Database Optimization
- **Indexes**: Optimized for content queries
- **Deduplication**: Unique constraints on URLs
- **Cleanup**: Old content automatically archived

## Monitoring & Debugging

### Logs
- **Edge Function Logs**: Available in Supabase dashboard
- **GitHub Actions Logs**: Available in GitHub repository
- **App Logs**: Console logs for debugging

### Metrics
- **Content Count**: Number of items fetched per run
- **Success Rate**: Percentage of successful fetches
- **Response Time**: How long fetches take

## Future Improvements

### Potential Enhancements
1. **Real-time Updates**: WebSocket connections for instant updates
2. **Smart Scheduling**: Adaptive fetch intervals based on content frequency
3. **Content Prioritization**: Fetch high-priority feeds more frequently
4. **User Preferences**: Allow users to set custom fetch intervals
5. **Offline Support**: Cache content for offline reading

### Scalability Considerations
- **Horizontal Scaling**: Multiple edge function instances
- **Database Sharding**: Distribute content across multiple databases
- **CDN Integration**: Cache content closer to users
- **Queue System**: Background job processing for large-scale operations 