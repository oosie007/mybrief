# Reddit Fetcher Edge Function

This Supabase Edge Function fetches posts from Reddit subreddits and stores them in your database.

## Setup

### 1. Create a Reddit App

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill in the details:
   - **Name**: `mybrief-app` (or any name you prefer)
   - **App type**: Select "web app"
   - **Description**: Brief description of your app
   - **About URL**: Your app's URL (can be placeholder)
   - **Redirect URI**: `http://localhost:8080` (for development)

### 2. Get Your Credentials

After creating the app, you'll get:
- **Client ID**: The string under your app name (e.g., `abc123def456`)
- **Client Secret**: The "secret" field (e.g., `ghi789jkl012`)

### 3. Set Environment Variables

Set these environment variables in your Supabase project:

```bash
# Required for Reddit API access
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here

# Optional: Custom User-Agent (recommended)
REDDIT_USER_AGENT=mybrief-app/1.0 (by /u/your_username)
```

### 4. Deploy the Function

```bash
supabase functions deploy redditFetcher
```

## How It Works

1. **Authentication**: The function uses Reddit's OAuth2 client credentials flow to get an access token
2. **API Calls**: Makes authenticated requests to Reddit's OAuth API endpoint
3. **Fallback**: If credentials aren't configured, falls back to the old JSON endpoint (limited functionality)
4. **Rate Limiting**: Respects Reddit's rate limits automatically

## Troubleshooting

### 403 Errors
- Ensure your Reddit app credentials are correctly set
- Check that your User-Agent is properly formatted
- Verify your Reddit app is configured as a "web app"

### Rate Limiting
- Reddit has strict rate limits (60 requests per minute for authenticated requests)
- The function includes automatic retry logic and fallback mechanisms

### No Posts Retrieved
- Check if the subreddit exists and is public
- Verify the subreddit name in your feed_sources table
- Check the function logs for specific error messages

## Testing

You can test the function locally:

```bash
supabase functions serve redditFetcher --env-file .env.local
```

Then call it with:

```bash
curl -X POST http://localhost:54321/functions/v1/redditFetcher
``` 