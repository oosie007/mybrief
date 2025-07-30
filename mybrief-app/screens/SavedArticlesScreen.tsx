import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { LoadingState, ErrorState, NoSavedArticlesState, SearchEmptyState, SkeletonLoadingState } from '../components/UIStates';
import { getFeedSourceFavicon } from '../lib/faviconService';
import ArticleViewer from '../components/ArticleViewer';
import { savedArticlesService, SavedArticle } from '../lib/savedArticlesService';
import { cleanContentForDisplay, cleanTitle } from '../lib/contentCleaner';
import SharedLayout from '../components/SharedLayout';

const SavedArticlesScreen = ({ navigation }: any) => {
  const { theme, isDarkMode } = useTheme();
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showArticleViewer, setShowArticleViewer] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<SavedArticle | null>(null);

  // Caching state
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasCachedContent, setHasCachedContent] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0); // Track when articles were saved

  // Cache duration: 1 hour in milliseconds (saved articles change less frequently)
  const CACHE_DURATION = 1 * 60 * 60 * 1000;

  const shouldRefreshContent = () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    return timeSinceLastRefresh > CACHE_DURATION;
  };

  useEffect(() => {
    loadSavedArticles();
  }, []);

  // Listen for navigation parameter changes (when articles are saved from other screens)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState().routes.find((route: any) => route.name === 'SavedArticles')?.params;
      if (params?.refreshSaved) {
        // Clear the parameter to avoid repeated refreshes
        navigation.setParams({ refreshSaved: undefined });
        // Force refresh saved articles
        loadSavedArticles(true);
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Background refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Always refresh saved articles when screen comes into focus
      // This ensures newly saved articles appear immediately
      if (hasCachedContent) {
        // Check if we should refresh based on time or if there might be new saves
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTime;
        const timeSinceLastSave = now - lastSaveTime;
        
        // Refresh if content is stale OR if there might be new saves (within last 5 minutes)
        if (timeSinceLastRefresh > CACHE_DURATION || timeSinceLastSave < 5 * 60 * 1000) {
          loadSavedArticles(true); // Force refresh to get latest saved articles
        }
      }
    });

    return unsubscribe;
  }, [navigation, hasCachedContent, lastRefreshTime, lastSaveTime]);

  const loadSavedArticles = async (forceRefresh = false) => {
    try {
      // If we have cached content and it's not time to refresh, show cached content immediately
      if (!forceRefresh && hasCachedContent && !shouldRefreshContent()) {
        setLoading(false);
        return;
      }

      // Only show loading on initial load or forced refresh
      if (isInitialLoad || forceRefresh) {
        setLoading(true);
      }
      setLoadError(null);
      
      const articles = await savedArticlesService.getSavedArticles();
      setSavedArticles(articles);

      // Update cache state
      setLastRefreshTime(Date.now());
      setHasCachedContent(true);
      setIsInitialLoad(false);
      setLoading(false);
    } catch (error) {
      console.error('Error loading saved articles:', error);
      setLoadError('Failed to load saved articles');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedArticles(true); // Force refresh
    setRefreshing(false);
  };

  const removeSavedArticle = async (articleId: string) => {
    Alert.alert(
      'Remove Article',
      'Are you sure you want to remove this article from your saved list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('saved_articles')
                .delete()
                .eq('content_item_id', articleId);

              if (error) {
                console.error('Error removing saved article:', error);
                Alert.alert('Error', 'Failed to remove article');
              } else {
                setSavedArticles(prev => prev.filter(article => article.content_item_id !== articleId));
              }
            } catch (error) {
              console.error('Error removing saved article:', error);
              Alert.alert('Error', 'Failed to remove article');
            }
          },
        },
      ]
    );
  };

  const handleOpenArticle = async (article: SavedArticle) => {
    if (!article.content_data?.url) {
      Alert.alert('Error', 'No URL available for this article');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(article.content_data.url);
      
      if (supported) {
        setCurrentArticle(article);
        setShowArticleViewer(true);
        // Mark the article as read
        await savedArticlesService.markAsRead(article.content_item_id);
        // Update UI state
        setSavedArticles(prev => 
          prev.map(item => 
            item.content_item_id === article.content_item_id 
              ? { ...item, read_at: new Date().toISOString() }
              : item
          )
        );
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      console.error('Error opening article:', error);
      Alert.alert('Error', 'Failed to open article');
    }
  };

  const handleSaveArticle = async (article: SavedArticle) => {
    try {
      // Since this is already a saved article, we'll remove it from saved
      await savedArticlesService.unsaveArticle(article.content_item_id);
      
      // Update UI state
      setSavedArticles(prev => prev.filter(item => item.content_item_id !== article.content_item_id));
      
      // Close the article viewer
      setShowArticleViewer(false);
      setCurrentArticle(null);
      
      Alert.alert('Success', 'Article removed from saved items');
    } catch (error) {
      console.error('Error removing saved article:', error);
      Alert.alert('Error', 'Failed to remove article from saved items');
    }
  };

  const handleShareArticle = async (article: SavedArticle) => {
    try {
      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: article.content_data?.title || 'Article',
          text: `${article.content_data?.title || 'Article'}\n\n${article.content_data?.url || ''}`,
          url: article.content_data?.url || '',
        });
      } else {
        // For Expo Go, show a custom share sheet
        Alert.alert(
          'Share Article',
          `${article.content_data?.title || 'Article'}\n\n${article.content_data?.url || ''}`,
          [
            { 
              text: 'Copy Link', 
              onPress: async () => {
                const Clipboard = await import('expo-clipboard');
                await Clipboard.setStringAsync(`${article.content_data?.title || 'Article'}\n\n${article.content_data?.url || ''}`);
                Alert.alert('Copied!', 'Article link copied to clipboard');
              }
            },
            { 
              text: 'Open in Browser', 
              onPress: async () => {
                const Linking = await import('expo-linking');
                await Linking.openURL(article.content_data?.url || '');
              }
            },
            { 
              text: 'Share via Messages', 
              onPress: async () => {
                const Linking = await import('expo-linking');
                const message = encodeURIComponent(`${article.content_data?.title || 'Article'}\n\n${article.content_data?.url || ''}`);
                await Linking.openURL(`sms:&body=${message}`);
              }
            },
            { 
              text: 'Share via Mail', 
              onPress: async () => {
                const Linking = await import('expo-linking');
                const subject = encodeURIComponent(article.content_data?.title || 'Article');
                const body = encodeURIComponent(`${article.content_data?.title || 'Article'}\n\n${article.content_data?.url || ''}`);
                await Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Error sharing article:', error);
      Alert.alert('Error', 'Failed to share article');
    }
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
    if (type === 'rss') {
      if (source.includes('techcrunch')) return '#10b981';
      if (source.includes('theverge')) return '#9333ea';
      if (source.includes('bloomberg')) return '#1e3a8a';
      if (source.includes('wired')) return '#000000';
    }
    
    if (type === 'reddit') return '#f97316';
    if (type === 'youtube') return '#ef4444';
    if (type === 'twitter') return '#1da1f2';
    
    return '#9ca3af';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredArticles = savedArticles.filter(article => {
    const matchesSearch = (article.content_data?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (article.content_data?.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !article.read_at) ||
                         (filter === 'read' && article.read_at);
    
    return matchesSearch && matchesFilter;
  });

  const unreadCount = savedArticles.filter(article => !article.read_at).length;
  const readCount = savedArticles.filter(article => article.read_at).length;

  const SavedArticleCard = ({ article }: { article: SavedArticle }) => {
    // Format the published date to match main digest format
    const formattedDate = article.content_data?.published_at
      ? new Date(article.content_data.published_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      : '';

    // Get feed source name with better fallback
    const feedSourceName = article.content_data?.feed_sources?.name || 
                          article.content_data?.feed_sources?.type || 
                          'Unknown';

    const isRead = !!article.read_at;

    return (
      <TouchableOpacity
        style={[
          styles.contentCard,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
          isRead && { opacity: 0.7 } // Dim read articles slightly like main feed
        ]}
        onPress={() => handleOpenArticle(article)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.sourceInfo}>
            <Image
              source={{ uri: getSourceIcon(feedSourceName, article.content_data?.content_type || '', article.content_data?.url || '') }}
              style={styles.sourceIcon}
            />
            <Text style={[styles.sourceText, { color: theme.textSecondary }]}>
              {feedSourceName}
            </Text>
            {isRead && (
              <View style={styles.readIndicator}>
                <Ionicons name="checkmark-circle" size={12} color={theme.accent} />
                <Text style={[styles.readText, { color: theme.accent }]}>Read</Text>
              </View>
            )}
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => removeSavedArticle(article.content_item_id)}
            >
              <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text 
          style={[
            styles.cardTitle, 
            { color: theme.text },
            isRead && { fontWeight: '400' } // Lighter font weight for read articles like main feed
          ]} 
          numberOfLines={3}
        >
          {cleanTitle(article.content_data?.title || '')}
        </Text>

        <Text style={[styles.cardSummary, { color: theme.textSecondary }]} numberOfLines={2}>
          {cleanContentForDisplay(article.content_data?.description || '')}
        </Text>

        <View style={styles.cardFooter}>
          {/* Author/Reddit Metrics on the left */}
          <View style={styles.footerLeft}>
            {article.content_data?.content_type !== 'reddit' ? (
              <Text style={[styles.authorText, { color: theme.textMuted }]}>
                {article.content_data?.author || 'Unknown Author'}
              </Text>
            ) : (
              <View style={styles.redditMetrics}>
                <View style={styles.redditMetric}>
                  <Ionicons name="arrow-up" size={12} color={theme.textMuted} />
                  <Text style={[styles.redditMetricText, { color: theme.textMuted }]}>
                    {article.content_data?.score || 0}
                  </Text>
                </View>
                <View style={styles.redditMetric}>
                  <Ionicons name="chatbubble-outline" size={12} color={theme.textMuted} />
                  <Text style={[styles.redditMetricText, { color: theme.textMuted }]}>
                    {article.content_data?.num_comments || 0}
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Published Date on the right */}
          <View style={styles.footerRight}>
            <Text style={[styles.publishedText, { color: theme.textMuted }]}>
              {article.content_data?.published_at ? new Date(article.content_data.published_at).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              }) : 'Unknown Date'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loadError) {
    return (
      <ErrorState
        title="Failed to load saved articles"
        message={loadError}
        onRetry={loadSavedArticles}
      />
    );
  }

  return (
    <>
      <SharedLayout
        navigation={navigation}
        currentScreen="saved"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search saved articles..."
        activeCategory={filter}
        onCategoryChange={(category) => setFilter(category as 'all' | 'unread' | 'read')}
        categories={[
          { key: 'all', label: 'All', count: savedArticles.length },
          { key: 'unread', label: 'Unread', count: unreadCount },
          { key: 'read', label: 'Read', count: readCount },
        ]}
        showFilters={true}
      >
        {/* Content */}
        {loading ? (
          <ScrollView 
            style={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <SkeletonLoadingState />
          </ScrollView>
        ) : (
          <FlatList
            data={filteredArticles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SavedArticleCard article={item} />}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              searchQuery ? (
                <SearchEmptyState query={searchQuery} />
              ) : (
                <NoSavedArticlesState onAddFeeds={() => navigation.navigate('FeedManagement')} />
              )
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SharedLayout>

      {/* Article Viewer - Outside SharedLayout */}
      {showArticleViewer && currentArticle && (
        <ArticleViewer
          url={currentArticle.content_data?.url || ''}
          title={currentArticle.content_data?.title || ''}
          onClose={() => {
            setShowArticleViewer(false);
            setCurrentArticle(null);
          }}
          onSave={(article) => handleSaveArticle(currentArticle)}
          onShare={(article) => handleShareArticle(currentArticle)}
          isSaved={true}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  contentContainer: {
    flex: 1,
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
  sourceIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 4,
  },
  sourceText: {
    fontSize: 12,
    marginLeft: 4,
    marginRight: 8,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  footerRight: {
    alignItems: 'flex-end',
  },

  shareButton: {
    padding: 4,
  },
  readIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  readText: {
    fontSize: 11,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 34, // Increased safe area padding
    paddingTop: 12, // Reduced top padding
    paddingHorizontal: 8, // Add horizontal padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8, // Reduced padding
    borderRadius: 8,
    marginHorizontal: 4, // Increased margin
    minHeight: 40, // Reduced height
  },
  redditMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  redditMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  redditMetricText: {
    fontSize: 11,
  },
  authorText: {
    fontSize: 11,
  },
  publishedText: {
    fontSize: 11,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default SavedArticlesScreen; 