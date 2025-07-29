# Daily Digest Strategy: Optimal Content Curation

## 🎯 **Recommended Approach**

### **1. Time Window: 24 Hours**
- **Why**: Fresh, relevant content only
- **Benefit**: Prevents information overload
- **Implementation**: `startDate.setHours(startDate.getHours() - 24)`

### **2. Per Feed Limits: 3 Items**
- **Why**: Prevents high-volume feeds from dominating
- **Benefit**: Ensures maximum diversity across all feeds
- **Implementation**: `slice(0, 3)` per feed

### **3. Engagement-Based Sorting**
- **Why**: Quality over quantity
- **Benefit**: Shows most engaging content first
- **Implementation**: Multi-factor scoring system

## 📊 **Engagement Scoring System**

### **Base Score (Recency)**
```typescript
const hoursAgo = (Date.now() - published_at) / (1000 * 60 * 60);
score += Math.max(0, 24 - hoursAgo) * 2; // 0-48 points
```

### **Reddit-Specific**
```typescript
score += upvotes * 0.1;      // 10 upvotes = 1 point
score += comments * 0.5;      // 2 comments = 1 point
```

### **YouTube-Specific** (Future)
```typescript
score += views * 0.001;       // 1000 views = 1 point
score += likes * 0.1;         // 10 likes = 1 point
```

### **RSS/News**
- Prioritize by recency
- Could add source reputation scoring

## 🔧 **Configuration Constants**

```typescript
const DIGEST_CONFIG = {
  TIME_WINDOW_HOURS: 24,        // Last 24 hours
  MAX_ITEMS_PER_FEED: 3,        // Max 3 items per individual feed
  TOTAL_MAX_ITEMS: 50,          // Max 50 total items
  ENGAGEMENT_WEIGHTS: {
    RECENCY: 2,                 // Points per hour
    REDDIT_UPVOTES: 0.1,       // Points per upvote
    REDDIT_COMMENTS: 0.5,      // Points per comment
    YOUTUBE_VIEWS: 0.001,      // Points per view
    YOUTUBE_LIKES: 0.1,        // Points per like
  }
}
```

## 📈 **Benefits of This Approach**

### **For Users**
- ✅ **Fresh content**: Only today's most relevant items
- ✅ **Diverse sources**: No single feed dominates (including dev.to)
- ✅ **Quality curation**: Engagement-based ranking
- ✅ **Readable length**: 50 items max (vs 100+ before)
- ✅ **Daily rhythm**: Matches natural reading habits

### **For Performance**
- ✅ **Faster queries**: 24-hour window vs 7 days
- ✅ **Reduced processing**: Fewer items to rank
- ✅ **Better caching**: Smaller data sets
- ✅ **Lower bandwidth**: Less content to transfer

### **For Content Quality**
- ✅ **Engagement signals**: Uses community feedback
- ✅ **Recency bias**: Prioritizes fresh content
- ✅ **Source diversity**: Prevents echo chambers
- ✅ **Balanced mix**: RSS, Reddit, YouTube, etc.
- ✅ **Feed equality**: Each feed gets equal representation

## 🚀 **Implementation Status**

### **✅ Completed**
- [x] 24-hour time window
- [x] 3 items per individual feed limit
- [x] 50 total items limit
- [x] Engagement scoring system
- [x] Reddit upvotes/comments integration
- [x] Configuration constants
- [x] Per-feed limiting (not per-type)

### **🔄 Future Enhancements**
- [ ] YouTube view/like count integration
- [ ] Source reputation scoring
- [ ] User preference learning
- [ ] A/B testing framework
- [ ] Analytics dashboard

## 📊 **Expected Results**

### **Before (7-day window, 10 per feed type)**
- Time window: 7 days
- Items per feed type: 10 (dev.to could dominate RSS section)
- Total items: 100+
- Sorting: Date only
- **Issues**: Overwhelming, stale content, feed domination within types

### **After (24-hour window, 3 per individual feed)**
- Time window: 24 hours
- Items per individual feed: 3 (dev.to limited to 3 items max)
- Total items: 50 max
- Sorting: Engagement + recency
- **Benefits**: Fresh, curated, diverse, no feed domination

## 🎯 **Key Metrics to Track**

1. **User engagement**: Time spent reading, save rate
2. **Content diversity**: Sources represented per digest
3. **Freshness**: Average age of content
4. **Quality**: User feedback, engagement scores
5. **Performance**: Load times, cache hit rates

## 🔧 **Tuning Recommendations**

### **For High-Volume Feeds (dev.to, etc.)**
- Already limited to 3 items per feed
- Increase engagement weight for comments
- Add source-specific reputation scoring

### **For Low-Volume Feeds**
- Keep `MAX_ITEMS_PER_FEED` at 3
- Ensure minimum representation
- Consider "best of week" for slow feeds

### **For Engagement-Heavy Platforms (Reddit)**
- Increase comment weight (0.5 → 0.8)
- Add subreddit-specific scoring
- Consider post type (text vs link)

### **For Video Content (YouTube)**
- Add view count when available
- Consider watch time vs view count
- Weight by channel reputation

This strategy balances freshness, quality, and diversity while preventing information overload and ensuring the best content rises to the top. 