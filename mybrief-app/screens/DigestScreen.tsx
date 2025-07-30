import React, { useState, useEffect, useRef } from 'react';
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
  Linking,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { getDailyDigest } from '../lib/digestStorage';
import { StoredDigest } from '../lib/digestStorage';
import { LoadingState, ErrorState, NoDigestState, SkeletonLoadingState } from '../components/UIStates';
import { aggregateUserContent, debugContent } from '../lib/digestGenerator';
import { getFeedSourceFavicon } from '../lib/faviconService';
import ArticleViewer from '../components/ArticleViewer';
import { savedArticlesService, SavedArticle } from '../lib/savedArticlesService';
import { cleanContentForDisplay, cleanTitle } from '../lib/contentCleaner';
import SharedLayout from '../components/SharedLayout';

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
    category?: string;
  };
  published_at?: string; // Added for filtering
  author?: string; // Added for RSS content
  // Reddit-specific fields
  score?: number;
  num_comments?: number;
  subreddit?: string;
  permalink?: string;
  is_self?: boolean;
  domain?: string;
}

const DigestScreen = ({ navigation }: any) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');
  const [digest, setDigest] = useState<StoredDigest | null>(null);
  const [loading, setLoading] = useState(false); // Changed from true to false
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ContentItem | null>(null);
  const [displayMode, setDisplayMode] = useState<'minimal' | 'rich'>('minimal');
  const [error, setError] = useState<string | null>(null);
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
  const [articleViewerVisible, setArticleViewerVisible] = useState(false);
  const [savedUnreadArticles, setSavedUnreadArticles] = useState<SavedArticle[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>(['All', 'Technology', 'Business', 'News', 'Communities']);
  
  // Collapsible UI states
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Animated values for smooth transitions
  const filtersAnimation = useRef(new Animated.Value(0)).current;
  const searchAnimation = useRef(new Animated.Value(0)).current;

  // Caching state
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasCachedContent, setHasCachedContent] = useState(false);

  // Add category caching state
  const [categoriesLastUpdated, setCategoriesLastUpdated] = useState<number>(0);
  const [isRefreshingCategories, setIsRefreshingCategories] = useState(false);
  const CATEGORY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const shouldRefreshCategories = () => {
    const now = Date.now();
    const timeSinceLastUpdate = now - categoriesLastUpdated;
    return timeSinceLastUpdate > CATEGORY_CACHE_DURATION;
  };

  // Cache duration: 2 hours in milliseconds
  const CACHE_DURATION = 2 * 60 * 60 * 1000;
  // Loading timeout: 3 seconds
  const LOADING_TIMEOUT = 3000;

  // Cache keys
  const CACHE_KEY = 'digest_cache';
  const CACHE_TIMESTAMP_KEY = 'digest_cache_timestamp';

  const shouldRefreshContent = () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    return timeSinceLastRefresh > CACHE_DURATION;
  };

  // Save digest to cache
  const saveDigestToCache = async (digestData: StoredDigest) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(digestData));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('Digest saved to cache');
    } catch (error) {
      console.error('Error saving digest to cache:', error);
    }
  };

  // Load digest from cache
  const loadDigestFromCache = async (): Promise<StoredDigest | null> => {
    try {
      const cachedDigest = await AsyncStorage.getItem(CACHE_KEY);
      const cacheTimestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedDigest && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp);
        const now = Date.now();
        
        // Check if cache is still valid (within 2 hours)
        if (now - timestamp < CACHE_DURATION) {
          console.log('Loading digest from cache');
          return JSON.parse(cachedDigest);
        } else {
          console.log('Cache expired, clearing');
          await AsyncStorage.removeItem(CACHE_KEY);
          await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading digest from cache:', error);
      return null;
    }
  };

  const toggleFilters = () => {
    const toValue = filtersVisible ? 0 : 1;
    setFiltersVisible(!filtersVisible);
    Animated.timing(filtersAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const toggleSearch = () => {
    const toValue = searchVisible ? 0 : 1;
    setSearchVisible(!searchVisible);
    Animated.timing(searchAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    const initializeScreen = async () => {
      console.log('=== INITIALIZING SCREEN ===');
      
      // Set loading to true initially to prevent flash
      setLoading(true);
      
      // Try to load from cache first
      const cachedDigest = await loadDigestFromCache();
      if (cachedDigest) {
        console.log('Found cached digest, setting it immediately');
        setDigest(cachedDigest);
        setHasCachedContent(true);
        setLoading(false);
        setIsInitialLoad(false);
      } else {
        console.log('No cached digest found, will load fresh data');
        // Keep loading true until we get fresh data
      }
      
      // Always load fresh data in background
      loadTodayDigest();
      loadSavedArticles();
      loadReadArticles();
      loadSavedUnreadArticles();
    };
    
    initializeScreen();
  }, []);

  // Ensure loading is false when we have digest content
  useEffect(() => {
    if (digest && loading) {
      console.log('Found digest content, setting loading to false');
      setLoading(false);
      setHasCachedContent(true);
    }
  }, [digest, loading]);

  // Reset active category if it's not available
  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [availableCategories, activeCategory]);

  // Background refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('=== FOCUS LISTENER DEBUG ===');
      console.log('hasCachedContent:', hasCachedContent);
      console.log('loading:', loading);
      console.log('digest exists:', !!digest);
      console.log('shouldRefreshContent():', shouldRefreshContent());
      console.log('shouldRefreshCategories():', shouldRefreshCategories());
      console.log('================================');
      
      // If we have digest content, ensure loading is false and preserve content
      if (digest) {
        console.log('Setting loading to false from focus listener');
        setLoading(false);
        setHasCachedContent(true);
        // If content is stale, refresh in background without clearing existing content
        if (shouldRefreshContent()) {
          console.log('Content is stale, refreshing in background');
          // Don't clear existing digest, just refresh in background
          loadTodayDigest(true);
        }
        // Only refresh categories if cache is expired
        if (shouldRefreshCategories()) {
          console.log('Categories cache expired, refreshing categories');
          refreshCategories();
        } else {
          console.log('Categories cache is still valid, skipping refresh');
        }
      } else {
        // If no digest, try to load from cache first
        loadDigestFromCache().then(cachedDigest => {
          if (cachedDigest) {
            console.log('Found cached digest on focus, setting it');
            setDigest(cachedDigest);
            setHasCachedContent(true);
            setLoading(false);
          }
        });
      }
    });

    return unsubscribe;
  }, [navigation, hasCachedContent, lastRefreshTime, digest, categoriesLastUpdated]);

  const loadReadArticles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_articles')
        .select('content_item_id')
        .eq('user_id', user.id)
        .not('read_at', 'is', null);

      if (error) {
        console.error('Error loading read articles:', error);
        return;
      }

      const readIds = new Set(data?.map(item => item.content_item_id) || []);
      setReadArticles(readIds);
    } catch (error) {
      console.error('Error loading read articles:', error);
    }
  };

  const loadSavedUnreadArticles = async () => {
    try {
      const articles = await savedArticlesService.getSavedUnreadArticles(3);
      setSavedUnreadArticles(articles);
    } catch (error) {
      console.error('Error loading saved unread articles:', error);
    }
  };

  const refreshCategories = async () => {
    try {
      // Prevent multiple simultaneous refreshes
      if (isRefreshingCategories) {
        console.log('Categories refresh already in progress, skipping');
        return;
      }
      
      // Only refresh categories if cache is expired
      if (!shouldRefreshCategories()) {
        console.log('Categories cache is still valid, skipping refresh');
        return;
      }
      
      console.log('Refreshing categories...');
      setIsRefreshingCategories(true);
      
      // Get content items to determine categories
      const contentItems = getContentItems();
      await determineAvailableCategories(contentItems);
      setCategoriesLastUpdated(Date.now());
    } catch (error) {
      console.error('Error refreshing categories:', error);
    } finally {
      setIsRefreshingCategories(false);
    }
  };

  const determineAvailableCategories = async (contentItems: ContentItem[]) => {
    const allCategories = new Set<string>(['All']);
    
    // Extract categories from content items
    contentItems.forEach(item => {
      const feedCategory = item.feed_sources?.category || item.category;
      console.log(`Content item "${item.title}" - Feed category: ${feedCategory}, Content type: ${item.content_type}`);
      
      if (feedCategory && feedCategory !== 'General') {
        allCategories.add(feedCategory);
      }
      
      // Special handling for Communities category
      if (['reddit', 'twitter', 'social'].includes(item.content_type)) {
        allCategories.add('Communities');
      }
    });
    
    // Only check user's active feeds if we don't have enough categories from content
    // This reduces database queries significantly
    if (allCategories.size <= 2) { // Only 'All' and maybe one other category
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userFeeds } = await supabase
            .from('user_feeds')
            .select(`
              feed_sources (
                category,
                type
              )
            `)
            .eq('user_id', user.id)
            .eq('is_active', true);

          if (userFeeds) {
            userFeeds.forEach(userFeed => {
              const feedCategory = (userFeed.feed_sources as any)?.category;
              const feedType = (userFeed.feed_sources as any)?.type;
              
              if (feedCategory && feedCategory !== 'General') {
                allCategories.add(feedCategory);
              }
              
              // Special handling for Communities category
              if (['reddit', 'twitter', 'social'].includes(feedType || '')) {
                allCategories.add('Communities');
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user feeds for categories:', error);
      }
    }
    
    // Convert to array and sort
    const categories = Array.from(allCategories).sort((a, b) => {
      if (a === 'All') return -1;
      if (b === 'All') return 1;
      return a.localeCompare(b);
    });
    
    // Ensure we always have at least 'All' category
    if (categories.length === 0) {
      categories.push('All');
    }
    
    console.log('Available categories:', categories);
    setAvailableCategories(categories);
    
    // If current active category is not available, reset to 'All'
    if (!categories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  };

  const loadTodayDigest = async (forceRefresh = false) => {
    try {
      console.log('=== LOAD TODAY DIGEST DEBUG ===');
      console.log('forceRefresh:', forceRefresh);
      console.log('hasCachedContent:', hasCachedContent);
      console.log('shouldRefreshContent():', shouldRefreshContent());
      console.log('isInitialLoad:', isInitialLoad);
      console.log('loading:', loading);
      console.log('digest exists:', !!digest);
      console.log('================================');

      // If we have digest content and it's not a forced refresh, show it immediately
      if (!forceRefresh && digest) {
        console.log('Using existing digest content, setting loading to false');
        setLoading(false);
        setHasCachedContent(true);
        return;
      }

      // Only show loading on initial load or forced refresh, and only if we don't have content
      if ((isInitialLoad || forceRefresh) && !digest) {
        console.log('Setting loading to true');
        setLoading(true);
        
        // Set a timeout to prevent loading from taking too long
        setTimeout(() => {
          if (loading) {
            console.log('Loading timeout reached, setting loading to false');
            setLoading(false);
          }
        }, LOADING_TIMEOUT);
      } else if (forceRefresh && digest) {
        // For background refreshes when we have content, don't show loading and preserve existing content
        console.log('Background refresh with existing content, not showing loading');
        setLoading(false);
        // Don't clear the digest, just update it in the background
      }
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

      console.log('=== DEBUG: User Authentication ===');
      console.log('Current user ID:', userId);
      console.log('User email:', user?.email);
      console.log('================================');

      const today = new Date().toISOString().split('T')[0];
      const contentItems = await aggregateUserContent(userId, today);

      console.log('Found content items:', contentItems?.length || 0);

      // Set loading to false immediately when we have content
      if (contentItems && contentItems.length > 0) {
        console.log('Content found, setting loading to false immediately');
        setLoading(false);
        setHasCachedContent(true);
      }

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
              category: 'Business',
              summary: 'Startup funding trends show increased focus on sustainable business models.',
              key_points: ['Funding trends', 'Sustainability', 'Business models'],
              estimated_read_time: 4,
              display_order: 3
            },
            {
              id: '5',
              digest_id: 'demo-digest',
              content_item_id: 'content-5',
              relevance_score: 75,
              category: 'News',
              summary: 'Global markets respond to new regulatory frameworks in tech sector.',
              key_points: ['Market response', 'Regulations', 'Tech sector'],
              estimated_read_time: 3,
              display_order: 4
            },
            {
              id: '6',
              digest_id: 'demo-digest',
              content_item_id: 'content-6',
              relevance_score: 72,
              category: 'Communities',
              summary: 'Online communities discuss the future of remote work and digital nomadism.',
              key_points: ['Remote work', 'Digital nomadism', 'Online communities'],
              estimated_read_time: 5,
              display_order: 5
            }
          ]
        };
        setDigest(mockDigest);
        await saveDigestToCache(mockDigest);
        // Determine available categories from demo content
        const demoContentItems: ContentItem[] = Object.values(mockContentMap);
        await determineAvailableCategories(demoContentItems);
      } else {
        // Create digest from real content
        const mockDigest: StoredDigest = {
          id: 'real-digest',
          user_id: userId,
          digest_date: today,
          summary: `Today's digest features ${contentItems.length} articles from your feeds.`,
          total_items: contentItems.length,
          estimated_read_time: contentItems.reduce((total, item) => total + 3, 0), // Default 3 minutes per article
          created_at: new Date().toISOString(),
          content_items: contentItems.map((item, index) => ({
            id: `real-${index}`,
            digest_id: 'real-digest',
            content_item_id: item.id,
            relevance_score: 0, // Default relevance score
            category: item.feed_sources?.name || 'General',
            summary: item.description || item.title || '',
            key_points: [], // No key points from raw content
            estimated_read_time: 3, // Default 3 minutes
            display_order: index,
            content_data: item
          }))
        };
        setDigest(mockDigest);
        await saveDigestToCache(mockDigest);
        // Determine available categories from real content
        const mappedContentItems: ContentItem[] = contentItems.map(item => ({
          id: item.id,
          title: item.title,
          url: item.url,
          summary: item.description,
          relevanceScore: 0,
          category: item.feed_sources?.category || 'General',
          keyPoints: [],
          estimatedReadTime: 3,
          content_type: item.content_type,
          feed_sources: item.feed_sources,
          published_at: item.published_at,
          author: item.author,
          score: item.score,
          num_comments: item.num_comments,
          subreddit: item.subreddit,
          permalink: item.permalink,
          is_self: item.is_self,
          domain: item.domain
        }));
        await determineAvailableCategories(mappedContentItems);
      }

      // Update cache state
      setLastRefreshTime(Date.now());
      setHasCachedContent(true);
      setIsInitialLoad(false);
      setLoading(false);
    } catch (error) {
      console.error('Error loading digest:', error);
      setError('Failed to load digest');
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
    await loadTodayDigest(true); // Force refresh
    await loadSavedArticles();
    await loadReadArticles();
    await loadSavedUnreadArticles();
    setRefreshing(false);
  };

  const loadSavedArticles = async () => {
    try {
      const savedIds = await savedArticlesService.getSavedArticleIds();
      setSavedArticles(savedIds);
    } catch (error) {
      console.error('Error loading saved articles:', error);
    }
  };

  const handleSaveArticle = async (article: ContentItem) => {
    try {
      const isCurrentlySaved = savedArticles.has(article.id);
      
      if (isCurrentlySaved) {
        // Unsave the article
        const success = await savedArticlesService.unsaveArticle(article.id);
        if (success) {
          setSavedArticles(prev => {
            const newSet = new Set(prev);
            newSet.delete(article.id);
            return newSet;
          });
          // Trigger refresh of saved articles screen
          navigation.setParams({ refreshSaved: Date.now() });
          // Refresh saved unread articles
          loadSavedUnreadArticles();
        } else {
          console.error('Failed to remove article from saved items');
        }
      } else {
        // Save the article
        const success = await savedArticlesService.saveArticle(article.id);
        if (success) {
          setSavedArticles(prev => new Set([...prev, article.id]));
          // Trigger refresh of saved articles screen
          navigation.setParams({ refreshSaved: Date.now() });
          // Refresh saved unread articles
          loadSavedUnreadArticles();
        } else {
          console.error('Failed to save article');
        }
      }
    } catch (error) {
      console.error('Error handling save/unsave:', error);
    }
  };

  const handleShareArticle = async (article: ContentItem) => {
    try {
      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: `${article.title}\n\n${article.url}`,
          url: article.url,
        });
      } else {
        // For Expo Go, show a custom share sheet
        Alert.alert(
          'Share Article',
          `${article.title}\n\n${article.url}`,
          [
            { 
              text: 'Copy Link', 
              onPress: async () => {
                const Clipboard = await import('expo-clipboard');
                await Clipboard.setStringAsync(`${article.title}\n\n${article.url}`);
                Alert.alert('Copied!', 'Article link copied to clipboard');
              }
            },
            { 
              text: 'Open in Browser', 
              onPress: async () => {
                const Linking = await import('expo-linking');
                await Linking.openURL(article.url);
              }
            },
            { 
              text: 'Share via Messages', 
              onPress: async () => {
                const Linking = await import('expo-linking');
                const message = encodeURIComponent(`${article.title}\n\n${article.url}`);
                await Linking.openURL(`sms:&body=${message}`);
              }
            },
            { 
              text: 'Share via Mail', 
              onPress: async () => {
                const Linking = await import('expo-linking');
                const subject = encodeURIComponent(article.title);
                const body = encodeURIComponent(`${article.title}\n\n${article.url}`);
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

  const handleOpenArticle = async (article: ContentItem) => {
    if (!article.url) {
      Alert.alert('Error', 'No URL available for this article');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(article.url);
      
      if (supported) {
        setSelectedArticle(article);
        setArticleViewerVisible(true);
        // Mark the article as read
        await savedArticlesService.markAsRead(article.id);
        // Update UI state
        setReadArticles(prev => new Set([...prev, article.id]));
        // Refresh saved unread articles since this article is now read
        loadSavedUnreadArticles();
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      console.error('Error opening article:', error);
      Alert.alert('Error', 'Failed to open article');
    }
  };

  const getSourceIcon = (source: string, type: string, sourceUrl?: string) => {
    // For YouTube videos, use the stored profile picture from the database
    if (type === 'youtube') {
      // Force YouTube to use the stored profile picture
      // If no stored favicon, fallback to favicon service
      return getFeedSourceFavicon(source, sourceUrl);
    }
    
    // For other content types, get the actual favicon URL for this source
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

  const ContentCard = ({ item, isReminder = false }: { item: any; isReminder?: boolean }) => {
    const isSaved = savedArticles.has(item.id);
    const isRead = readArticles.has(item.id);
    
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
      formattedDate: formattedDate,
      isRead: isRead
    });
    
    return (
      <TouchableOpacity 
        style={[
          styles.contentCard, 
          { backgroundColor: theme.cardBg, borderColor: theme.border },
          isRead && { opacity: 0.7 }, // Dim read articles slightly
          isReminder && { borderLeftWidth: 4, borderLeftColor: theme.accent } // Highlight reminder cards
        ]} 
        onPress={() => handleOpenArticle(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.sourceInfo}>
            <Image
              source={{ 
                uri: item.feed_sources?.type === 'youtube' && item.feed_sources?.favicon_url 
                  ? item.feed_sources.favicon_url 
                  : getSourceIcon(item.feed_sources?.name || '', item.feed_sources?.type || '', item.url) 
              }}
              style={styles.sourceIcon}
              onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
              onLoad={() => console.log('Image loaded successfully for:', item.feed_sources?.name)}
            />

            <Text style={[styles.sourceText, { color: theme.textSecondary }]}>
              {item.feed_sources?.name || 'Unknown'}
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
              onPress={() => handleSaveArticle(item)}
            >
              <Ionicons 
                name={isSaved ? 'heart' : 'heart-outline'} 
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

        <Text 
          style={[
            styles.cardTitle, 
            { color: theme.text },
            isRead && { fontWeight: '400' } // Lighter font weight for read articles
          ]} 
          numberOfLines={3}
        >
          {cleanTitle(item.title)}
        </Text>
        
        <Text style={[styles.cardSummary, { color: theme.textSecondary }]} numberOfLines={2}>
          {cleanContentForDisplay(item.summary)}
        </Text>

        <View style={styles.cardFooter}>
          {/* Author/Reddit Metrics on the left */}
          <View style={styles.footerLeft}>
            {item.content_type !== 'reddit' ? (
              <Text style={[styles.authorText, { color: theme.textMuted }]}>
                {item.author || 'Unknown Author'}
              </Text>
            ) : (
              <View style={styles.redditMetrics}>
                <View style={styles.redditMetric}>
                  <Ionicons name="arrow-up" size={12} color={theme.textMuted} />
                  <Text style={[styles.redditMetricText, { color: theme.textMuted }]}>
                    {item.score || 0}
                  </Text>
                </View>
                <View style={styles.redditMetric}>
                  <Ionicons name="chatbubble-outline" size={12} color={theme.textMuted} />
                  <Text style={[styles.redditMetricText, { color: theme.textMuted }]}>
                    {item.num_comments || 0}
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Published Date on the right */}
          <View style={styles.footerRight}>
            <Text style={[styles.publishedText, { color: theme.textMuted }]}>
              {item.published_at ? new Date(item.published_at).toLocaleString('en-US', { 
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

  const YouTubeCard = ({ item, isReminder = false }: { item: any; isReminder?: boolean }) => {
    const isSaved = savedArticles.has(item.id);
    const isRead = readArticles.has(item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.contentCard, 
          { backgroundColor: theme.cardBg, borderColor: theme.border },
          isRead && { opacity: 0.7 },
          isReminder && { borderLeftWidth: 4, borderLeftColor: theme.accent } // Highlight reminder cards
        ]} 
        onPress={() => handleOpenArticle(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.sourceInfo}>
            <Image
              source={{ 
                uri: item.feed_sources?.favicon_url || 
                      getSourceIcon(item.feed_sources?.name || '', 'youtube', item.url) 
              }}
              style={styles.sourceIcon}
            />
            <Text style={[styles.sourceText, { color: theme.textSecondary }]}>
              {item.feed_sources?.name || 'Unknown'}
            </Text>
            {isRead && (
              <View style={styles.readIndicator}>
                <Ionicons name="checkmark-circle" size={12} color={theme.accent} />
                <Text style={[styles.readText, { color: theme.accent }]}>Watched</Text>
              </View>
            )}
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleSaveArticle(item)}
            >
              <Ionicons 
                name={isSaved ? 'heart' : 'heart-outline'} 
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

        {/* Video Thumbnail */}
        {item.image_url && (
          <View style={styles.videoThumbnailContainer}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.videoThumbnail}
              resizeMode="cover"
            />
            <View style={styles.playButton}>
              <Ionicons name="play" size={20} color="white" />
            </View>
          </View>
        )}

        <Text 
          style={[
            styles.cardTitle, 
            { color: theme.text },
            isRead && { fontWeight: '400' }
          ]} 
          numberOfLines={2}
        >
          {cleanTitle(item.title)}
        </Text>
        
        <Text style={[styles.cardSummary, { color: theme.textSecondary }]} numberOfLines={2}>
          {cleanContentForDisplay(item.summary)}
        </Text>

        <View style={styles.cardFooter}>
          {/* Views on the left */}
          <View style={styles.footerLeft}>
            {item.score && (
              <View style={styles.youtubeMetrics}>
                <Ionicons name="eye-outline" size={12} color={theme.textMuted} />
                <Text style={[styles.youtubeMetricText, { color: theme.textMuted }]}>
                  {item.score.toLocaleString()} views
                </Text>
              </View>
            )}
          </View>
          
          {/* Published Date on the right */}
          <View style={styles.footerRight}>
            <Text style={[styles.publishedText, { color: theme.textMuted }]}>
              {item.published_at ? new Date(item.published_at).toLocaleString('en-US', { 
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

  // Debug: Log current state
  console.log('=== RENDER DEBUG ===');
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('Digest:', digest ? `Has digest with ${digest.content_items?.length || 0} items` : 'No digest');
  console.log('Display mode:', displayMode);
  console.log('Selected category:', activeCategory);
  console.log('===================');

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

    const allItems = digest.content_items
      .map((digestItem: any) => {
        if (digestItem.content_data) {
          const contentItem: ContentItem = {
            id: digestItem.content_data.id || digestItem.id,
            title: digestItem.content_data.title || 'Untitled',
            url: digestItem.content_data.url || '',
            summary: digestItem.content_data.description || '',
            relevanceScore: digestItem.relevance_score || 0,
            category: digestItem.content_data.category || 'General',
            keyPoints: digestItem.key_points || [],
            estimatedReadTime: digestItem.estimated_read_time || 3,
            content_type: digestItem.content_data.content_type || 'rss',
            feed_sources: digestItem.content_data.feed_sources || {
              name: 'Unknown',
              type: 'rss'
            },
            published_at: (digestItem as any).content_data.published_at || '',
            // Add Reddit-specific fields if they exist in the mock data
            score: (digestItem.content_data as any).score || 0,
            num_comments: (digestItem.content_data as any).num_comments || 0,
            author: (digestItem.content_data as any).author || '',
            subreddit: (digestItem.content_data as any).subreddit || '',
            permalink: (digestItem.content_data as any).permalink || '',
            is_self: (digestItem.content_data as any).is_self || false,
            domain: (digestItem.content_data as any).domain || ''
          };
          
          console.log('Content item with published_at:', {
            title: contentItem.title,
            published_at: contentItem.published_at,
            formatted: contentItem.published_at ? new Date(contentItem.published_at).toLocaleDateString() : 'No date'
          });
          
          // Filter by category if not "All"
          if (activeCategory !== 'All') {
            if (activeCategory === 'Communities') {
              // Show only social content (Reddit, Twitter, etc.)
              if (!['reddit', 'twitter', 'social'].includes(contentItem.content_type)) {
                return null;
              }
            } else {
              // For other categories, check the feed's actual category
              // Get the feed source category from the feed_sources data
              const feedCategory = contentItem.feed_sources?.category || contentItem.category;
              
              console.log(`Filtering "${contentItem.title}" - Feed category: ${feedCategory}, Active category: ${activeCategory}`);
              
              if (feedCategory !== activeCategory) {
                return null;
              }
            }
          }
          
          // Filter by search query
          if (searchQuery.trim() && !contentItem.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
              !contentItem.summary.toLowerCase().includes(searchQuery.toLowerCase())) {
            return null;
          }
          
          return contentItem;
        }
        
        return null;
      })
      .filter(Boolean) as ContentItem[];

    return allItems;
  };

  // Separate content by type
  const getContentByType = () => {
    const allItems = getContentItems();
    
    const newsArticles = allItems.filter(item => 
      item.content_type === 'rss' || 
      item.content_type === 'news' ||
      item.content_type === 'article'
    );
    
    const socialPosts = allItems.filter(item => 
      item.content_type === 'reddit' || 
      item.content_type === 'twitter' ||
      item.content_type === 'social'
    );
    
    const videoPosts = allItems.filter(item => 
      item.content_type === 'youtube' || 
      item.content_type === 'video'
    );
    
    return { newsArticles, socialPosts, videoPosts };
  };

  const { newsArticles, socialPosts, videoPosts } = getContentByType();

  return (
    <>
      <SharedLayout 
        navigation={navigation} 
        currentScreen="home"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search articles..."
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categories={availableCategories}
        showFilters={true}
      >
        {/* Content */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <SkeletonLoadingState />
          ) : error ? (
            <ErrorState title="Failed to load digest" message={error} onRetry={loadTodayDigest} />
          ) : !digest && !isInitialLoad ? (
            <NoDigestState />
          ) : (
            <>
              {/* News & Articles Section */}
              {newsArticles.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      News & Articles
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                      {newsArticles.length} articles for today
                    </Text>
                  </View>
                  {newsArticles.map((item, index) => (
                    <ContentCard key={item.id || index} item={item} />
                  ))}
                </View>
              )}

              {/* Communities Section */}
              {socialPosts.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Communities
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                      {socialPosts.length} posts from communities
                    </Text>
                  </View>
                  {socialPosts.map((item, index) => (
                    <ContentCard key={item.id || index} item={item} />
                  ))}
                </View>
              )}

              {/* Videos Section */}
              {videoPosts.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Videos
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                      {videoPosts.length} videos for today
                    </Text>
                  </View>
                  {videoPosts.map((item, index) => (
                    <YouTubeCard key={item.id || index} item={item} />
                  ))}
                </View>
              )}

              {/* Reminder Section */}
              {savedUnreadArticles.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Reminders
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                      {savedUnreadArticles.length} saved articles to read
                    </Text>
                  </View>
                  {savedUnreadArticles.map((savedArticle, index) => {
                    const contentItem: ContentItem = {
                      id: savedArticle.content_data?.id || savedArticle.content_item_id,
                      title: savedArticle.content_data?.title || 'Untitled',
                      url: savedArticle.content_data?.url || '',
                      summary: savedArticle.content_data?.description || '',
                      relevanceScore: 0,
                      category: 'Reminder',
                      keyPoints: [],
                      estimatedReadTime: 3,
                      content_type: savedArticle.content_data?.content_type || 'rss',
                      feed_sources: savedArticle.content_data?.feed_sources || {
                        name: 'Unknown',
                        type: 'rss'
                      },
                      published_at: savedArticle.content_data?.published_at || '',
                      author: savedArticle.content_data?.author || '',
                      score: savedArticle.content_data?.score || 0,
                      num_comments: savedArticle.content_data?.num_comments || 0,
                      subreddit: savedArticle.content_data?.subreddit || '',
                      permalink: savedArticle.content_data?.permalink || '',
                      is_self: savedArticle.content_data?.is_self || false,
                      domain: savedArticle.content_data?.domain || ''
                    };

                    return savedArticle.content_data?.content_type === 'youtube' ? (
                      <YouTubeCard key={savedArticle.id || index} item={contentItem} isReminder={true} />
                    ) : (
                      <ContentCard key={savedArticle.id || index} item={contentItem} isReminder={true} />
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SharedLayout>

      {/* Article Viewer Modal - Outside SharedLayout */}
      {articleViewerVisible && selectedArticle && (
        <ArticleViewer
          url={selectedArticle.url}
          title={selectedArticle.title}
          onClose={() => {
            setArticleViewerVisible(false);
            setSelectedArticle(null);
          }}
          onSave={(article) => handleSaveArticle(selectedArticle)}
          onShare={(article) => handleShareArticle(selectedArticle)}
          isSaved={savedArticles.has(selectedArticle.id)}
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
    borderBottomWidth: 1,
    paddingTop: 50, // Safe area
    minHeight: 60, // Minimum height instead of fixed height
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60, // Ensure proper height for touch targets
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Take available space
  },
  logo: {
    width: 28, // Slightly larger
    height: 28, // Slightly larger
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: 14, // Slightly larger
    height: 14, // Slightly larger
    borderRadius: 3,
  },
  appTitle: {
    fontSize: 20, // Slightly larger
    fontWeight: 'bold',
    fontFamily: 'Georgia',
    letterSpacing: -0.7,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Consistent spacing between buttons
  },
  headerButton: {
    padding: 10, // Larger touch target
    borderRadius: 8,
    minWidth: 44, // iOS minimum touch target
    minHeight: 44, // iOS minimum touch target
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8, // Reduced from 12
  },
  categoryContent: {
    paddingRight: 16,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 4, // Reduced from 6
    borderRadius: 16,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'System',
    letterSpacing: -0.7,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  sectionDivider: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8, // Reduced from 12
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  redditMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  redditMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  redditMetricText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  authorText: {
    fontSize: 11,
  },
  publishedText: {
    fontSize: 11,
  },
  // YouTube card styles
  videoThumbnailContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtubeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  youtubeMetricText: {
    fontSize: 11,
    marginLeft: 4,
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
    color: '#6B7280',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 4,
  },
  readIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  readText: {
    fontSize: 11,
    marginLeft: 4,
  },
});

export default DigestScreen; 