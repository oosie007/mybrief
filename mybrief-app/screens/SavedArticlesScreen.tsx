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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { LoadingState, ErrorState, NoSavedArticlesState, SearchEmptyState } from '../components/UIStates';
import { getFeedSourceFavicon } from '../lib/faviconService';
import ArticleViewer from '../components/ArticleViewer';
import { savedArticlesService, SavedArticle } from '../lib/savedArticlesService';
import { cleanContentForDisplay, cleanTitle } from '../lib/contentCleaner';

const SavedArticlesScreen = ({ navigation }: any) => {
  const { theme, isDarkMode } = useTheme();
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showArticleViewer, setShowArticleViewer] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<SavedArticle | null>(null);

  useEffect(() => {
    loadSavedArticles();
  }, []);

  const loadSavedArticles = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      
      const articles = await savedArticlesService.getSavedArticles();
      setSavedArticles(articles);
    } catch (error) {
      console.error('Error loading saved articles:', error);
      setLoadError('Failed to load saved articles');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedArticles();
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
                .eq('id', articleId);

              if (error) {
                console.error('Error removing saved article:', error);
                Alert.alert('Error', 'Failed to remove article');
              } else {
                setSavedArticles(prev => prev.filter(article => article.id !== articleId));
                setSelectedArticles(prev => prev.filter(id => id !== articleId));
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

  const removeMultipleArticles = async () => {
    Alert.alert(
      'Remove Articles',
      `Are you sure you want to remove ${selectedArticles.length} articles from your saved list?`,
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
                .in('id', selectedArticles);

              if (error) {
                console.error('Error removing saved articles:', error);
                Alert.alert('Error', 'Failed to remove articles');
              } else {
                setSavedArticles(prev => prev.filter(article => !selectedArticles.includes(article.id)));
                setSelectedArticles([]);
                setIsSelectionMode(false);
              }
            } catch (error) {
              console.error('Error removing saved articles:', error);
              Alert.alert('Error', 'Failed to remove articles');
            }
          },
        },
      ]
    );
  };

  const toggleSelection = (articleId: string) => {
    setSelectedArticles(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedArticles([]);
  };

  const handleOpenArticle = async (article: SavedArticle) => {
    if (!article.content_data?.url) {
      Alert.alert('Error', 'No URL available for this article');
      return;
    }

    setCurrentArticle(article);
    setShowArticleViewer(true);
    
    // Mark as read if not already read
    if (!article.read_at) {
      await savedArticlesService.markAsRead(article.content_item_id);
      // Update local state
      setSavedArticles(prev =>
        prev.map(a =>
          a.id === article.id
            ? { ...a, read_at: new Date().toISOString() }
            : a
        )
      );
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
              onPress={() => removeSavedArticle(article.id)}
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

  if (loading) {
    return <LoadingState message="Loading saved articles..." />;
  }

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Saved Articles</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={toggleSelectionMode}>
              <Ionicons
                name={isSelectionMode ? 'close' : 'checkbox-outline'}
                size={20}
                color={theme.text}
              />
            </TouchableOpacity>
            {isSelectionMode && selectedArticles.length > 0 && (
              <TouchableOpacity style={styles.headerButton} onPress={removeMultipleArticles}>
                <Ionicons name="trash" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.cardBg }]}>
          <Ionicons name="search" size={16} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search saved articles..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {[
            { key: 'all', label: 'All', count: savedArticles.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'read', label: 'Read', count: readCount },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                filter === tab.key && { backgroundColor: theme.accent }
              ]}
              onPress={() => setFilter(tab.key as any)}
            >
              <Text style={[
                styles.filterTabText,
                filter === tab.key ? { color: theme.accentText } : { color: theme.pillText }
              ]}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
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
      
      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('FeedManagement')}
        >
          <Ionicons name="list-outline" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: theme.hover }]}
          onPress={() => navigation.navigate('SavedArticles')}
        >
          <Ionicons name="heart-outline" size={24} color={theme.accent} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {/* Article Viewer */}
      {showArticleViewer && currentArticle && (
        <ArticleViewer
          url={currentArticle.content_data?.url || ''}
          title={currentArticle.content_data?.title || ''}
          onClose={() => {
            setShowArticleViewer(false);
            setCurrentArticle(null);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginLeft: 4,
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
});

export default SavedArticlesScreen; 