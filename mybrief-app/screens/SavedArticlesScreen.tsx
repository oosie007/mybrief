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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { LoadingState, ErrorState, NoSavedArticlesState, SearchEmptyState } from '../components/UIStates';
import { getFeedSourceFavicon } from '../lib/faviconService';

interface SavedArticle {
  id: string;
  user_id: string;
  content_item_id: string;
  saved_at: string;
  is_read: boolean;
  content_items: {
    id: string;
    title: string;
    url: string;
    description: string;
    image_url?: string;
    published_at: string;
    content_type: string;
    feed_sources: {
      name: string;
      type: string;
    };
  };
}

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

  useEffect(() => {
    loadSavedArticles();
  }, []);

  const loadSavedArticles = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      
      // Mock data for demo purposes
      const mockSavedArticles = [
        {
          id: '1',
          user_id: 'demo-user',
          content_item_id: '1',
          saved_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          is_read: false,
          content_items: {
            id: '1',
            title: 'The Future of AI in Mobile Development',
            url: 'https://example.com/ai-mobile-dev',
            description: 'Exploring how artificial intelligence is transforming the way we build and use mobile applications.',
            image_url: undefined,
            published_at: new Date(Date.now() - 86400000).toISOString(),
            content_type: 'article',
            feed_sources: {
              name: 'TechCrunch',
              type: 'rss'
            }
          }
        },
        {
          id: '2',
          user_id: 'demo-user',
          content_item_id: '2',
          saved_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          is_read: true,
          content_items: {
            id: '2',
            title: 'Startup Funding Trends in 2024',
            url: 'https://example.com/startup-funding',
            description: 'A comprehensive look at the changing landscape of startup funding and what entrepreneurs need to know.',
            image_url: undefined,
            published_at: new Date(Date.now() - 172800000).toISOString(),
            content_type: 'article',
            feed_sources: {
              name: 'VentureBeat',
              type: 'rss'
            }
          }
        }
      ];
      
      setSavedArticles(mockSavedArticles);
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

  const toggleReadStatus = async (articleId: string, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from('saved_articles')
        .update({ is_read: !isRead })
        .eq('id', articleId);

      if (error) {
        console.error('Error updating read status:', error);
        Alert.alert('Error', 'Failed to update read status');
      } else {
        setSavedArticles(prev =>
          prev.map(article =>
            article.id === articleId
              ? { ...article, is_read: !isRead }
              : article
          )
        );
      }
    } catch (error) {
      console.error('Error updating read status:', error);
      Alert.alert('Error', 'Failed to update read status');
    }
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
    const matchesSearch = article.content_items.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content_items.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !article.is_read) ||
                         (filter === 'read' && article.is_read);
    
    return matchesSearch && matchesFilter;
  });

  const unreadCount = savedArticles.filter(article => !article.is_read).length;
  const readCount = savedArticles.filter(article => article.is_read).length;

  const SavedArticleCard = ({ article }: { article: SavedArticle }) => (
    <View style={[
      styles.articleCard,
      { backgroundColor: theme.cardBg, borderColor: theme.border },
      !article.is_read && { borderLeftWidth: 4, borderLeftColor: theme.accent }
    ]}>
      {isSelectionMode && (
        <TouchableOpacity
          style={styles.selectionCheckbox}
          onPress={() => toggleSelection(article.id)}
        >
          <Ionicons
            name={selectedArticles.includes(article.id) ? 'checkbox' : 'square-outline'}
            size={20}
            color={selectedArticles.includes(article.id) ? theme.accent : theme.textMuted}
          />
        </TouchableOpacity>
      )}

      <View style={styles.articleContent}>
        <View style={styles.articleHeader}>
          <View style={styles.sourceInfo}>
            <Image
              source={{ uri: getSourceIcon(article.content_items.feed_sources?.name || 'Unknown', article.content_items.content_type, article.content_items.url) }}
              style={styles.sourceIcon}
            />
            <Text style={[styles.sourceName, { color: theme.textSecondary }]}>
              {article.content_items.feed_sources?.name || 'Unknown'}
            </Text>
            <Text style={[styles.savedDate, { color: theme.textMuted }]}>
              • {formatDate(article.saved_at)}
            </Text>
          </View>
          <View style={styles.articleActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleReadStatus(article.id, article.is_read)}
            >
              <Ionicons
                name={article.is_read ? 'eye-off' : 'eye'}
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => removeSavedArticle(article.id)}
            >
              <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.articleTitle, { color: theme.text }]} numberOfLines={2}>
          {article.content_items.title}
        </Text>

        <Text style={[styles.articleDescription, { color: theme.textSecondary }]} numberOfLines={2}>
          {article.content_items.description}
        </Text>

        <View style={styles.articleFooter}>
          <View style={styles.readStatus}>
            <Ionicons
              name={article.is_read ? 'checkmark-circle' : 'time'}
              size={14}
              color={article.is_read ? theme.accent : theme.textMuted}
            />
            <Text style={[styles.readStatusText, { color: article.is_read ? theme.accent : theme.textMuted }]}>
              {article.is_read ? 'Read' : 'Unread'}
            </Text>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={14} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
      <View style={[styles.bottomNav, { backgroundColor: theme.headerBg, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home" size={20} color={theme.textSecondary} />
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('FeedManagement')}
        >
          <Ionicons name="list" size={20} color={theme.textSecondary} />
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Feeds</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('SavedArticles')}
        >
          <Ionicons name="bookmark" size={20} color={theme.accentText} />
          <Text style={[styles.navText, { color: theme.accentText }]}>Saved</Text>
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
  articleCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
  },
  selectionCheckbox: {
    marginRight: 12,
    justifyContent: 'center',
  },
  articleContent: {
    flex: 1,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sourceIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 8,
  },
  sourceName: {
    fontSize: 12,
    fontWeight: '500',
  },
  savedDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  articleActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 6,
  },
  articleDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readStatusText: {
    fontSize: 12,
    marginLeft: 4,
  },
  shareButton: {
    padding: 4,
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
});

export default SavedArticlesScreen; 