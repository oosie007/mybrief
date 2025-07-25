# Daily Digest App - Complete Architecture & Development Plan

## 🏗️ System Architecture Overview

### Tech Stack Recommendation
- **Frontend**: React Native with Expo (best for solo dev, cross-platform, great push notifications)
- **Backend**: Supabase (PostgreSQL + real-time + auth + edge functions)
- **AI**: OpenAI GPT-4 for summaries and content ranking
- **Content Processing**: Supabase Edge Functions (Deno runtime)
- **Push Notifications**: Expo Push Notifications
- **Scheduling**: GitHub Actions or Supabase Cron (pg_cron)

### High-Level Architecture

```
[Mobile App] ↔ [Supabase API] ↔ [Content Processors] ↔ [External APIs]
     ↓              ↓                    ↓                   ↓
[Local Cache]  [PostgreSQL]      [AI Processing]    [RSS/Reddit/YouTube]
     ↓              ↓                    ↓
[Push Service] [Edge Functions]   [Content Ranking]
```

## 📊 Database Schema Design

### Core Tables

**users**
```sql
- id (uuid, primary key)
- email (text, unique)
- timezone (text, default 'UTC')
- digest_time (time, default '07:00')
- created_at (timestamp)
- subscription_tier (text, default 'free')
- onboarding_completed (boolean, default false)
```

**feed_sources**
```sql
- id (uuid, primary key)
- type (text) -- 'rss', 'reddit', 'youtube', 'podcast'
- name (text)
- url (text)
- icon_url (text)
- category (text) -- 'tech', 'startup', 'general', etc.
- is_template (boolean, default false)
- created_at (timestamp)
```

**user_feeds**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- feed_source_id (uuid, foreign key)
- is_active (boolean, default true)
- added_at (timestamp)
```

**template_packs**
```sql
- id (uuid, primary key)
- name (text) -- 'Tech Entrepreneur', 'Startup Founder'
- description (text)
- feed_source_ids (jsonb) -- array of feed_source ids
- created_at (timestamp)
```

**content_items**
```sql
- id (uuid, primary key)
- feed_source_id (uuid, foreign key)
- title (text)
- url (text)
- description (text)
- image_url (text)
- published_at (timestamp)
- popularity_score (integer)
- ai_ranking_score (float)
- content_type (text)
- raw_content (jsonb)
- created_at (timestamp)
```

**daily_digests**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- digest_date (date)
- content_items (jsonb) -- selected items for this digest
- daily_summary (text) -- AI-generated day summary
- status (text) -- 'pending', 'generated', 'sent'
- created_at (timestamp)
```

**saved_articles**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- content_item_id (uuid, foreign key)
- saved_at (timestamp)
- read_at (timestamp, nullable)
- reminder_shown_at (timestamp, nullable)
```

## 🔄 Content Processing Pipeline

### 1. Content Fetchers (Supabase Edge Functions)

**RSS/News Fetcher**
```javascript
// Runs every 2 hours
async function fetchRSSFeeds() {
  const rssFeeds = await supabase
    .from('feed_sources')
    .select('*')
    .eq('type', 'rss');
    
  for (const feed of rssFeeds) {
    const parser = new RSSParser();
    const content = await parser.parseURL(feed.url);
    
    // Process and store new items
    await processAndStoreItems(content.items, feed.id);
  }
}
```

**Reddit Fetcher**
```javascript
// Runs every 3 hours
async function fetchRedditPosts() {
  const redditFeeds = await supabase
    .from('feed_sources')
    .select('*')
    .eq('type', 'reddit');
    
  for (const feed of redditFeeds) {
    const response = await fetch(`${feed.url}/hot.json?limit=20`);
    const data = await response.json();
    
    // Process Reddit posts
    await processRedditPosts(data.data.children, feed.id);
  }
}
```

**YouTube Fetcher**
```javascript
// Runs every 4 hours using YouTube Data API
async function fetchYouTubeVideos() {
  const youtubeFeeds = await supabase
    .from('feed_sources')
    .select('*')
    .eq('type', 'youtube');
    
  for (const feed of youtubeFeeds) {
    // Extract channel ID from URL
    const channelId = extractChannelId(feed.url);
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&order=date&maxResults=10&key=${YOUTUBE_API_KEY}`
    );
    
    await processYouTubeVideos(response.data.items, feed.id);
  }
}
```

### 2. AI Content Ranking & Processing

**Content Ranking Algorithm**
```javascript
async function rankContent(contentItems, userPreferences) {
  // Combine popularity score + recency + AI relevance
  const rankedItems = await Promise.all(
    contentItems.map(async (item) => {
      const aiScore = await getAIRelevanceScore(item, userPreferences);
      const timeDecay = calculateTimeDecay(item.published_at);
      const popularityNormalized = item.popularity_score / 100;
      
      const finalScore = (aiScore * 0.4) + (timeDecay * 0.3) + (popularityNormalized * 0.3);
      
      return { ...item, ai_ranking_score: finalScore };
    })
  );
  
  return rankedItems.sort((a, b) => b.ai_ranking_score - a.ai_ranking_score);
}
```

### 3. Daily Digest Generator

**Main Digest Creation Function**
```javascript
async function generateDailyDigest(userId) {
  // Get user's active feeds
  const userFeeds = await getUserActiveFeeds(userId);
  
  // Get recent content from each feed type
  const newsItems = await getTopContentByType('rss', userFeeds, 5);
  const redditItems = await getTopContentByType('reddit', userFeeds, 3);
  const youtubeItems = await getTopContentByType('youtube', userFeeds, 3);
  
  // Generate daily summary using AI
  const dailySummary = await generateDailySummary([...newsItems, ...redditItems, ...youtubeItems]);
  
  // Create digest record
  const digest = await supabase
    .from('daily_digests')
    .insert({
      user_id: userId,
      digest_date: new Date().toISOString().split('T')[0],
      content_items: {
        news: newsItems,
        reddit: redditItems,
        youtube: youtubeItems
      },
      daily_summary: dailySummary,
      status: 'generated'
    });
    
  return digest;
}
```

## 📱 Mobile App Structure

### App Navigation Structure
```
TabNavigator
├── Home (Daily Digest)
├── Saved Articles
├── Feed Management
└── Settings

Stack Navigators:
├── HomeStack
│   ├── DigestScreen
│   ├── ArticleWebView
│   └── ArticleDetails
├── SavedStack
│   ├── SavedArticles
│   └── ArticleWebView
└── FeedsStack
    ├── FeedsList
    ├── AddFeed
    ├── TemplatePacks
    └── SearchFeeds
```

### Key React Native Components

**DigestScreen.js**
```javascript
const DigestScreen = () => {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadTodaysDigest();
  }, []);
  
  const loadTodaysDigest = async () => {
    const { data } = await supabase
      .from('daily_digests')
      .select('*')
      .eq('user_id', user.id)
      .eq('digest_date', today)
      .single();
      
    setDigest(data);
    setLoading(false);
  };
  
  return (
    <ScrollView style={styles.container}>
      <DailySummary summary={digest?.daily_summary} />
      <ContentSection title="📰 News" items={digest?.content_items?.news} />
      <ContentSection title="🔥 Reddit" items={digest?.content_items?.reddit} />
      <ContentSection title="📺 YouTube" items={digest?.content_items?.youtube} />
    </ScrollView>
  );
};
```

## 🔔 Push Notification System

### Notification Scheduling
```javascript
// Supabase Edge Function - runs daily at 6 AM UTC
async function scheduleDigestNotifications() {
  const users = await supabase
    .from('users')
    .select('id, timezone, digest_time, expo_push_token');
    
  for (const user of users) {
    const userTime = convertToUserTimezone(user.timezone, user.digest_time);
    
    if (shouldSendNotificationNow(userTime)) {
      await sendDigestNotification(user);
    }
  }
}

async function sendDigestNotification(user) {
  const message = {
    to: user.expo_push_token,
    sound: 'default',
    title: '🌅 Your Daily Digest is Ready',
    body: 'Fresh insights from your favorite sources await!',
    data: { screen: 'digest' }
  };
  
  await expo.sendPushNotificationsAsync([message]);
}
```

## 🎯 Smart Reminders for Saved Articles

### Reminder Logic
```javascript
async function generateSmartReminders(userId) {
  const savedArticles = await getSavedUnreadArticles(userId);
  const todaysDigest = await getTodaysDigest(userId);
  
  for (const savedArticle of savedArticles) {
    // Check if today's digest has related content
    const relatedContent = await findRelatedContent(
      savedArticle.content_item,
      todaysDigest.content_items
    );
    
    if (relatedContent.length > 0) {
      await createReminder(userId, savedArticle.id, relatedContent);
    }
  }
}
```

## 🚀 Development Roadmap

### Phase 1: MVP Foundation (Weeks 1-3)
**Week 1: Project Setup**
- [ ] Set up React Native Expo project
- [ ] Configure Supabase project and database
- [ ] Set up basic authentication flow
- [ ] Create database schema and migrations
- [ ] Set up basic navigation structure

**Week 2: Core Content Pipeline**
- [ ] Build RSS feed fetcher edge function
- [ ] Build Reddit content fetcher
- [ ] Build YouTube content fetcher  
- [ ] Create content storage and ranking system
- [ ] Set up basic AI integration for content ranking

**Week 3: Basic UI & Digest Generation**
- [ ] Create main digest screen with minimal design
- [ ] Build content item components
- [ ] Implement daily digest generation logic
- [ ] Add pull-to-refresh functionality
- [ ] Create basic article webview

### Phase 2: Core Features (Weeks 4-6)
**Week 4: Feed Management**
- [ ] Build feed management screens
- [ ] Create template packs system
- [ ] Add search and add custom feeds
- [ ] Implement user feed preferences

**Week 5: Saved Articles & Smart Features**
- [ ] Build saved articles functionality
- [ ] Create smart reminders system
- [ ] Add AI-powered daily summaries
- [ ] Implement basic content filtering

**Week 6: Push Notifications & Scheduling**
- [ ] Set up Expo push notifications
- [ ] Build notification scheduling system
- [ ] Add timezone handling
- [ ] Create user preference settings

### Phase 3: Polish & Launch Prep (Weeks 7-8)
**Week 7: UI/UX Polish**
- [ ] Implement haptic.md inspired minimalist design
- [ ] Add smooth animations and transitions
- [ ] Optimize performance and caching
- [ ] Add loading states and error handling

**Week 8: Testing & Launch**
- [ ] Comprehensive testing on iOS
- [ ] Beta testing with friends/family
- [ ] App Store submission preparation
- [ ] Set up analytics and monitoring

### Phase 4: Post-Launch Iterations (Weeks 9-12)
- [ ] Android version development
- [ ] Newsletter integration
- [ ] Podcast feed integration
- [ ] Advanced AI features (YouTube summaries)
- [ ] User feedback implementation

## 💡 ADHD-Friendly Development Tips

### Focus Strategies
1. **Time-box each task**: Set 2-3 hour focused coding sessions
2. **Single feature completion**: Finish one complete feature before moving to next
3. **Daily progress tracking**: Keep a simple checklist of daily accomplishments
4. **Break complex tasks**: Each checklist item should be completable in one session

### Code Organization
- Use clear, descriptive folder structure
- Comment your code heavily for future you
- Create reusable components early
- Use TypeScript for better autocomplete and error catching

### Testing Strategy
- Test each feature immediately after building
- Use Expo Go for rapid testing on device
- Keep a test user account with sample data

## 🔧 Technical Implementation Details

### Environment Setup
```bash
# 1. Create Expo project
npx create-expo-app DailyDigest --template blank-typescript

# 2. Install core dependencies
npm install @supabase/supabase-js
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install expo-notifications expo-constants expo-device
npm install react-native-webview
npm install @expo/vector-icons

# 3. Install development dependencies
npm install --save-dev @types/react @types/react-native
```

### Key Configuration Files

**supabase.ts**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**app.config.js**
```javascript
export default {
  expo: {
    name: "Daily Digest",
    slug: "daily-digest",
    platforms: ["ios", "android"],
    notification: {
      icon: "./assets/notification-icon.png",
      color: "#ffffff"
    }
  }
};
```

## 📈 Success Metrics & Analytics

### Key Metrics to Track
- Daily active users
- Digest open rates
- Article save rates
- User retention (7-day, 30-day)
- Average time spent in app
- Push notification click-through rates

### Analytics Implementation
```javascript
// Using Expo Analytics or simple Supabase logging
const trackEvent = async (eventName, properties) => {
  await supabase
    .from('analytics_events')
    .insert({
      user_id: user.id,
      event_name: eventName,
      properties: properties,
      timestamp: new Date().toISOString()
    });
};
```

This architecture gives you a solid foundation to build your ADHD-friendly daily digest app. The modular approach means you can tackle one piece at a time without getting overwhelmed, and the tech stack choices optimize for solo development speed while maintaining scalability for future growth.