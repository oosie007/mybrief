import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { getDailyDigest } from '../lib/digestStorage';
import { StoredDigest } from '../lib/digestStorage';
import { LoadingState, ErrorState, NoDigestState } from '../components/UIStates';
import { saveShareService } from '../lib/saveShareService';
import SaveArticleModal from '../components/SaveArticleModal';
import { aggregateUserContent, debugContent } from '../lib/digestGenerator';
import { getFeedSourceFavicon } from '../lib/faviconService';

interface ContentItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  relevanceScore: number;
  category: string;
  keyPoints: string[];
  estimatedReadTime: number;
  content_type: string;
  feed_sources: {
    name: string;
    type: string;
  };
  published_at?: string; // Added for filtering
}

const DigestScreen = ({ navigation }: any) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');
  const [digest, setDigest] = useState<StoredDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ContentItem | null>(null);
  const [displayMode, setDisplayMode] = useState<'minimal' | 'rich'>('minimal');
  const [error, setError] = useState<string | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());

  const categories = ['All', 'Technology', 'Business', 'Startups', 'Productivity', 'News'];

  useEffect(() => {
    loadTodayDigest();
    loadSavedArticles();
  }, []);

  const loadTodayDigest = async () => {
    try {
      setLoading(true);
      setError(null);

      // Debug: Check what content exists in the database
      await debugContent();

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      console.log('Loading digest for user:', userId);

      const today = new Date().toISOString().split('T')[0];
      const contentItems = await aggregateUserContent(userId, today);

      console.log('Found content items:', contentItems?.length || 0);

      if (!contentItems || contentItems.length === 0) {
        // Fallback to demo data
        console.log('No content found, using demo data');
        setDisplayMode('minimal');
        const mockDigest: StoredDigest = {
          id: 'demo-digest',
          user_id: 'demo-user',
          digest_date: today,
          summary: 'Today\'s digest features AI breakthroughs, productivity insights, and startup trends.',
          total_items: 6,
          estimated_read_time: 33,
          created_at: new Date().toISOString(),
          content_items: [
            {
              id: '1',
              digest_id: 'demo-digest',
              content_item_id: 'content-1',
              relevance_score: 95,
              category: 'Technology',
              summary: 'Companies report 40% productivity gains with new AI-assisted development environments.',
              key_points: ['AI integration', 'Productivity gains', 'Development tools'],
              estimated_read_time: 5,
              display_order: 0
            },
            {
              id: '2',
              digest_id: 'demo-digest',
              content_item_id: 'content-2',
              relevance_score: 88,
              category: 'Productivity',
              summary: 'Community highlights focus tools and habit trackers for neurodivergent users.',
              key_points: ['Focus tools', 'Habit tracking', 'Neurodivergent support'],
              estimated_read_time: 4,
              display_order: 1
            },
            {
              id: '3',
              digest_id: 'demo-digest',
              content_item_id: 'content-3',
              relevance_score: 82,
              category: 'Technology',
              summary: 'New wave of collaboration software prioritizes async communication.',
              key_points: ['Collaboration tools', 'Async communication', 'Remote work'],
              estimated_read_time: 6,
              display_order: 2
            },
            {
              id: '4',
              digest_id: 'demo-digest',
              content_item_id: 'content-4',
              relevance_score: 78,
              category: 'Technology',
              summary: 'Deep dive into optimization strategies for mobile app performance.',
              key_points: ['Mobile optimization', 'Performance', 'Development'],
              estimated_read_time: 7,
              display_order: 3
            },
            {
              id: '5',
              digest_id: 'demo-digest',
              content_item_id: 'content-5',
              relevance_score: 85,
              category: 'Business',
              summary: 'Q3 investments in green technology surpass $8.2B.',
              key_points: ['Green tech', 'Investment trends', 'Sustainability'],
              estimated_read_time: 5,
              display_order: 4
            },
            {
              id: '6',
              digest_id: 'demo-digest',
              content_item_id: 'content-6',
              relevance_score: 90,
              category: 'Technology',
              summary: 'How pair programming with AI assistants is changing development.',
              key_points: ['AI assistants', 'Pair programming', 'Development workflow'],
              estimated_read_time: 6,
              display_order: 5
            }
          ]
        };
        setDigest(mockDigest);
      } else {
        // Use the real content items directly
        console.log('Using real content, mapping to digest format');
        const mappedDigest = {
          id: 'live-digest',
          user_id: userId,
          digest_date: today,
          summary: `Your latest articles for today`,
          total_items: contentItems.length,
          estimated_read_time: contentItems.length * 3,
          created_at: new Date().toISOString(),
          content_items: contentItems.map((item, idx) => ({
            id: item.id,
            digest_id: 'live-digest',
            content_item_id: item.id,
            relevance_score: 0,
            category: item.feed_sources?.name || 'General',
            summary: item.title || item.description || '',
            key_points: [],
            estimated_read_time: 3,
            display_order: idx,
            // Add the full content data for display
            content_data: item
          }))
        };
        console.log('Mapped digest:', mappedDigest);
        console.log('Content items in mapped digest:', mappedDigest.content_items.length);
        setDigest(mappedDigest);
      }
    } catch (error) {
      console.error('Error loading digest:', error);
      setError('Failed to load today\'s digest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mock content mapping for demo purposes
  const mockContentMap: { [key: string]: ContentItem } = {
    'content-1': {
      id: 'content-1',
      title: 'The Neural Revolution',
      url: 'https://example.com/neural-revolution',
      summary: 'Companies report 40% productivity gains with new AI-assisted development environments.',
      relevanceScore: 95,
      category: 'Technology',
      keyPoints: ['AI integration', 'Productivity gains', 'Development tools'],
      estimatedReadTime: 5,
      content_type: 'article',
      feed_sources: { name: 'TechCrunch', type: 'rss' },
      published_at: '2023-10-26T10:00:00Z'
    },
    'content-2': {
      id: 'content-2',
      title: 'Mindful Productivity',
      url: 'https://example.com/mindful-productivity',
      summary: 'Community highlights focus tools and habit trackers for neurodivergent users.',
      relevanceScore: 88,
      category: 'Productivity',
      keyPoints: ['Focus tools', 'Habit tracking', 'Neurodivergent support'],
      estimatedReadTime: 4,
      content_type: 'article',
      feed_sources: { name: 'r/productivity', type: 'reddit' },
      published_at: '2023-10-26T11:00:00Z'
    },
    'content-3': {
      id: 'content-3',
      title: 'Quantum Horizons',
      url: 'https://example.com/quantum-horizons',
      summary: 'New wave of collaboration software prioritizes async communication.',
      relevanceScore: 82,
      category: 'Technology',
      keyPoints: ['Collaboration tools', 'Async communication', 'Remote work'],
      estimatedReadTime: 6,
      content_type: 'article',
      feed_sources: { name: 'The Verge', type: 'rss' },
      published_at: '2023-10-26T12:00:00Z'
    },
    'content-4': {
      id: 'content-4',
      title: 'Code & Creativity',
      url: 'https://example.com/code-creativity',
      summary: 'Deep dive into optimization strategies for mobile app performance.',
      relevanceScore: 78,
      category: 'Technology',
      keyPoints: ['Mobile optimization', 'Performance', 'Development'],
      estimatedReadTime: 7,
      content_type: 'video',
      feed_sources: { name: 'Fireship', type: 'youtube' },
      published_at: '2023-10-26T13:00:00Z'
    },
    'content-5': {
      id: 'content-5',
      title: 'Sustainable Innovation',
      url: 'https://example.com/sustainable-innovation',
      summary: 'Q3 investments in green technology surpass $8.2B.',
      relevanceScore: 85,
      category: 'Business',
      keyPoints: ['Green tech', 'Investment trends', 'Sustainability'],
      estimatedReadTime: 5,
      content_type: 'article',
      feed_sources: { name: 'Bloomberg', type: 'rss' },
      published_at: '2023-10-26T14:00:00Z'
    },
    'content-6': {
      id: 'content-6',
      title: 'Biotech Frontiers',
      url: 'https://example.com/biotech-frontiers',
      summary: 'How pair programming with AI assistants is changing development.',
      relevanceScore: 90,
      category: 'Technology',
      keyPoints: ['AI assistants', 'Pair programming', 'Development workflow'],
      estimatedReadTime: 6,
      content_type: 'article',
      feed_sources: { name: 'Wired', type: 'rss' },
      published_at: '2023-10-26T15:00:00Z'
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodayDigest();
    setRefreshing(false);
  };

  const loadSavedArticles = async () => {
    try {
      const savedArticlesData = await saveShareService.getSavedArticles();
      const savedIds = new Set(savedArticlesData.map(article => article.content_item_id));
      setSavedArticles(savedIds);
    } catch (error) {
      console.error('Error loading saved articles:', error);
    }
  };

  const handleSaveArticle = (article: ContentItem) => {
    setSelectedArticle(article);
    setSaveModalVisible(true);
  };

  const handleShareArticle = async (article: ContentItem) => {
    try {
      // For now, just open the URL directly since we don't have a SavedArticle object
      const url = article.url;
      if (url) {
        // Use expo-linking to open the URL
        const Linking = await import('expo-linking');
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error sharing article:', error);
      Alert.alert('Error', 'Failed to share article');
    }
  };

  const handleArticleSaved = () => {
    setSaveModalVisible(false);
    setSelectedArticle(null);
    loadSavedArticles();
  };

  const getSourceIcon = (source: string, type: string, sourceUrl?: string) => {
    // Get the actual favicon URL for this source
    return getFeedSourceFavicon(source, sourceUrl);
  };

  const getSourceColor = (source: string, type: string): string => {
    // Specific colors for known feed sources
    const sourceColors: { [key: string]: string } = {
      'TechCrunch': '#00C851', // TechCrunch green
      'The Verge': '#000000', // The Verge black
      'Wired': '#FF6B35', // Wired orange
      'Ars Technica': '#FF6600', // Ars Technica orange
      'Hacker News': '#FF6600', // HN orange
      'Bloomberg': '#000000', // Bloomberg black
      'Reddit': '#ff4500',
      'YouTube': '#ff0000',
      'Twitter': '#1da1f2',
    };

    // Check if we have a specific color for this source
    if (sourceColors[source]) {
      return sourceColors[source];
    }

    // Fallback to type-based colors
    switch (type) {
      case 'rss':
        return '#ff6600';
      case 'reddit':
        return '#ff4500';
      case 'youtube':
        return '#ff0000';
      case 'twitter':
        return '#1da1f2';
      default:
        return theme.textSecondary;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const ContentCard = ({ item }: { item: any }) => {
    const isSaved = savedArticles.has(item.id);
    // Format the published date
    const formattedDate = item.published_at
      ? new Date(item.published_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      : '';
    
    console.log('ContentCard received item:', {
      title: item.title,
      published_at: item.published_at,
      formattedDate: formattedDate
    });
    
    return (
      <TouchableOpacity style={[styles.contentCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.sourceInfo}>
            <Image
              source={{ uri: getSourceIcon(item.feed_sources?.name || '', item.feed_sources?.type || '', item.url) }}
              style={styles.sourceIcon}
            />
            <Text style={[styles.sourceText, { color: theme.textSecondary }]}>
              {item.feed_sources?.name || 'Unknown'}
            </Text>
            <Text style={[styles.timeText, { color: theme.textMuted }]}>
              {formattedDate || 'Just now'}
            </Text>
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleSaveArticle(item)}
            >
              <Ionicons 
                name={isSaved ? 'bookmark' : 'bookmark-outline'} 
                size={16} 
                color={isSaved ? theme.accent : theme.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleShareArticle(item)}
            >
              <Ionicons name="share-outline" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={3}>
          {item.title}
        </Text>
        
        <Text style={[styles.cardSummary, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.summary}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.decorativeDots}>
            <View style={[styles.dot, { backgroundColor: theme.divider }]} />
            <View style={[styles.dot, { backgroundColor: theme.divider }]} />
            <View style={[styles.dot, { backgroundColor: theme.divider }]} />
          </View>
          <TouchableOpacity 
            style={styles.shareButton} 
            onPress={() => handleShareArticle(item)}
          >
            <Ionicons name="share-outline" size={14} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Debug: Log current state
  console.log('=== RENDER DEBUG ===');
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('Digest:', digest ? `Has digest with ${digest.content_items?.length || 0} items` : 'No digest');
  console.log('Display mode:', displayMode);
  console.log('Selected category:', activeCategory);
  console.log('===================');

  if (loading) {
    return <LoadingState message="Loading your daily digest..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load digest"
        message={error}
        onRetry={loadTodayDigest}
      />
    );
  }



  // Get content items with full data from mock content map
  const getContentItems = () => {
    if (!digest?.content_items) return [];
    
    return digest.content_items
      .map(digestItem => {
        // For real content, use the content_data field
        if ((digestItem as any).content_data) {
          const contentItem: ContentItem = {
            id: (digestItem as any).content_data.id,
            title: (digestItem as any).content_data.title || 'Untitled',
            url: (digestItem as any).content_data.url || '',
            summary: (digestItem as any).content_data.description || (digestItem as any).content_data.title || '',
            relevanceScore: digestItem.relevance_score || 0,
            category: (digestItem as any).content_data.feed_sources?.name || 'General',
            keyPoints: digestItem.key_points || [],
            estimatedReadTime: digestItem.estimated_read_time || 3,
            content_type: (digestItem as any).content_data.content_type || 'article',
            feed_sources: (digestItem as any).content_data.feed_sources || {
              name: 'Unknown',
              type: 'rss'
            },
            published_at: (digestItem as any).content_data.published_at || ''
          };
          
          console.log('Content item with published_at:', {
            title: contentItem.title,
            published_at: contentItem.published_at,
            formatted: contentItem.published_at ? new Date(contentItem.published_at).toLocaleDateString() : 'No date'
          });
          
          // Filter by category if not "All"
          if (activeCategory !== 'All' && contentItem.category !== activeCategory) {
            return null;
          }
          
          return contentItem;
        }
        
        return null;
      })
      .filter(Boolean) as ContentItem[];
  };

  const filteredContent = getContentItems();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { backgroundColor: theme.accent }]}>
              <View style={[styles.logoInner, { backgroundColor: theme.background }]} />
            </View>
            <Text style={[styles.appTitle, { color: theme.text }]}>mybrief</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={toggleTheme}>
              <Ionicons 
                name={isDarkMode ? 'sunny' : 'moon'} 
                size={18} 
                color={theme.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="search" size={18} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={18} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryPill,
                activeCategory === category 
                  ? { backgroundColor: theme.accent }
                  : { backgroundColor: theme.pill }
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                activeCategory === category 
                  ? { color: theme.accentText }
                  : { color: theme.pillText }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {digest ? (
          <>
            {filteredContent.length > 0 ? (
              filteredContent.map((item: any, index: number) => (
                <ContentCard key={item.id || index} item={item} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No content available for {activeCategory}
                </Text>
              </View>
            )}
            
            <View style={styles.endDivider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
            </View>
          </>
        ) : (
          <NoDigestState onRefresh={onRefresh} />
        )}
      </ScrollView>

      {/* Save Article Modal */}
      <SaveArticleModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        contentItemId={selectedArticle?.id || ''}
        articleTitle={selectedArticle?.title || ''}
        onSave={handleArticleSaved}
      />

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: theme.headerBg, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home" size={20} color={theme.accentText} />
          <Text style={[styles.navText, { color: theme.accentText }]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('FeedManagement')}
        >
          <Ionicons name="list" size={20} color={theme.textSecondary} />
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Feeds</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('SavedArticles')}
        >
          <Ionicons name="bookmark" size={20} color={theme.textSecondary} />
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Saved</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings" size={20} color={theme.textSecondary} />
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingTop: 50, // Safe area
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Georgia',
    letterSpacing: -0.7,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  categoryContent: {
    paddingRight: 16,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
    marginLeft: 4,
    marginRight: 8,
  },
  timeText: {
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 8,
    fontFamily: 'Georgia',
    letterSpacing: -0.7,
    fontStyle: 'normal',
  },
  cardSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#6B7280', // Light gray like in your reference
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  readTime: {
    fontSize: 11,
  },
  decorativeDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  shareButton: {
    padding: 4,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  endDivider: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  dividerLine: {
    width: 40,
    height: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 20, // Safe area
    paddingTop: 12,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  publishedDate: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'center',
    fontWeight: '500',
  },
  sourceIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 4,
  },
});

export default DigestScreen; 