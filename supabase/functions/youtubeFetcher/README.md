# YouTube Fetcher Edge Function

This Edge Function fetches videos from YouTube channels using the YouTube Data API v3.

## Setup

### 1. Get YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Copy your API key

### 2. Set Environment Variables

In your Supabase project dashboard:

1. Go to Settings → Edge Functions
2. Add the following environment variable:
   - `YOUTUBE_API_KEY`: Your YouTube Data API v3 key

### 3. Add YouTube Feed Sources

Add YouTube channels to your `feed_sources` table:

```sql
INSERT INTO feed_sources (name, url, type, is_active) VALUES
  ('TechCrunch', 'https://www.youtube.com/@TechCrunch', 'youtube', true),
  ('The Verge', 'https://www.youtube.com/@TheVerge', 'youtube', true),
  ('Wired', 'https://www.youtube.com/@WIRED', 'youtube', true);
```

## Supported URL Formats

The fetcher supports various YouTube URL formats:

- `https://www.youtube.com/@channelname`
- `https://www.youtube.com/c/channelname`
- `https://www.youtube.com/user/username`
- `https://www.youtube.com/channel/CHANNEL_ID`

## Features

- **Channel Detection**: Automatically extracts channel IDs from various URL formats
- **Video Metadata**: Fetches title, description, thumbnails, view counts, etc.
- **Rate Limiting**: Respects YouTube API quotas with delays between requests
- **Error Handling**: Graceful handling of API errors and missing data
- **Deduplication**: Prevents duplicate videos using URL-based conflict resolution

## API Usage

The function uses the YouTube Data API v3 to:

1. **Get Channel Details**: Retrieves channel information and uploads playlist
2. **Fetch Videos**: Gets recent videos from the uploads playlist
3. **Video Details**: Retrieves comprehensive video metadata including statistics

## Rate Limits

- YouTube Data API v3 has a quota of 10,000 units per day
- Each API call uses different quota units:
  - Channels API: 1 unit
  - PlaylistItems API: 1 unit
  - Videos API: 1 unit per video ID
- The function includes delays between feed processing to respect quotas

## Troubleshooting

### Common Issues

1. **"YouTube API key not configured"**
   - Ensure `YOUTUBE_API_KEY` is set in Supabase environment variables

2. **"Could not extract channel ID from URL"**
   - Check that the YouTube URL is in a supported format
   - Try using the channel ID directly in the URL

3. **"Failed to get channel details"**
   - Verify the channel exists and is public
   - Check that your API key has the necessary permissions

4. **"Could not find uploads playlist"**
   - Some channels may not have public uploads playlists
   - Try a different channel or contact the channel owner

### Testing

Test the function with curl:

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/youtubeFetcher" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Data Structure

Videos are stored in the `content_items` table with:

- `content_type`: 'youtube'
- `title`: Video title
- `url`: YouTube video URL
- `description`: Video description
- `image_url`: Video thumbnail URL
- `author`: Channel name
- `score`: View count
- `num_comments`: Comment count
- `subreddit`: Channel ID (for consistency with Reddit structure)
- `domain`: 'youtube.com'
- `raw_content`: Full video metadata as JSON 