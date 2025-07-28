import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { LoadingState, ErrorState, NoFeedsState } from '../components/UIStates';
import { getFeedSourceFavicon } from '../lib/faviconService';

const FEED_TYPES = [
  { 
    type: 'rss', 
    label: 'RSS Feed', 
    icon: 'globe',
    iconColor: '#ff6600',
    description: 'News websites, blogs, podcasts',
    placeholder: 'https://example.com/feed.xml',
    examples: ['https://techcrunch.com/feed/', 'https://www.theverge.com/rss/index.xml', 'https://www.wired.com/feed/rss']
  },
  { 
    type: 'youtube', 
    label: 'YouTube Channel', 
    icon: 'logo-youtube',
    iconColor: '#ff0000',
    description: 'YouTube channels and creators',
    placeholder: 'https://www.youtube.com/@channelname',
    examples: ['https://www.youtube.com/@TechCrunch', 'https://www.youtube.com/@TheVerge', 'https://www.youtube.com/@WIRED']
  },
  { 
    type: 'reddit', 
    label: 'Reddit Community', 
    icon: 'logo-reddit',
    iconColor: '#ff4500',
    description: 'Reddit subreddits and communities',
    placeholder: 'https://reddit.com/r/subreddit',
    examples: ['https://reddit.com/r/technology', 'https://reddit.com/r/programming', 'https://reddit.com/r/startups']
  },
];

const FeedManagementScreen = ({ navigation }: any) => {
  const { theme, isDarkMode } = useTheme();
  const [feeds, setFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my-feeds' | 'add-feed'>('my-feeds');
  const [selectedFeedType, setSelectedFeedType] = useState<string | null>(null);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');

  const [fetchingFeeds, setFetchingFeeds] = useState<Set<string>>(new Set());

  // Function to extract feed name from URL
  const extractFeedNameFromUrl = (url: string, type: string): string => {
    if (!url.trim()) return '';
    
    try {
      const urlObj = new URL(url);
      
      switch (type) {
        case 'youtube':
          // Extract channel name from YouTube URL
          const youtubeMatch = url.match(/youtube\.com\/@([^\/\?]+)/);
          if (youtubeMatch) {
            const channelId = youtubeMatch[1];
            // Convert camelCase to proper name (e.g., "aliabdaal" -> "Ali Abdaal")
            return channelId
              .replace(/([A-Z])/g, ' $1') // Add space before capitals
              .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
              .replace(/\s+/g, ' ') // Clean up multiple spaces
              .trim();
          }
          break;
        case 'reddit':
          // Extract subreddit name from Reddit URL
          const redditMatch = url.match(/reddit\.com\/r\/([^\/\?]+)/);
          if (redditMatch) {
            return `r/${redditMatch[1]}`;
          }
          break;
        case 'rss':
          // Extract domain name for RSS feeds
          return urlObj.hostname.replace('www.', '').split('.')[0];
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
    }
    
    return '';
  };

  // Function to fetch real channel name from YouTube
  const fetchYouTubeChannelName = async (url: string): Promise<string> => {
    try {
      const youtubeMatch = url.match(/youtube\.com\/@([^\/\?]+)/);
      if (!youtubeMatch) return '';
      
      const channelId = youtubeMatch[1];
      
      // Try to fetch from our database first (if we have it)
      const { data: existingFeed } = await supabase
        .from('feed_sources')
        .select('name')
        .eq('url', url)
        .single();
      
      if (existingFeed?.name) {
        return existingFeed.name;
      }
      
      // Fallback to URL parsing with better formatting
      // Convert "aliabdaal" to "Ali Abdaal"
      const formatChannelName = (id: string): string => {
        // Handle common patterns
        if (id === 'aliabdaal') return 'Ali Abdaal';
        if (id === 'techcrunch') return 'TechCrunch';
        if (id === 'theverge') return 'The Verge';
        if (id === 'wired') return 'WIRED';
        
        // Generic conversion for other cases
        return id
          .replace(/([A-Z])/g, ' $1') // Add space before capitals
          .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
          .replace(/\s+/g, ' ') // Clean up multiple spaces
          .trim();
      };
      
      return formatChannelName(channelId);
    } catch (error) {
      console.error('Error fetching YouTube channel name:', error);
      return '';
    }
  };

  // Update feed name when URL changes
  useEffect(() => {
    if (selectedFeedType && newFeedUrl) {
      if (selectedFeedType === 'youtube') {
        // For YouTube, try to fetch the real channel name
        fetchYouTubeChannelName(newFeedUrl).then(name => {
          if (name) {
            setNewFeedName(name);
          }
        });
      } else {
        // For other types, use URL parsing
        const extractedName = extractFeedNameFromUrl(newFeedUrl, selectedFeedType);
        if (extractedName) {
          setNewFeedName(extractedName);
        }
      }
    }
  }, [newFeedUrl, selectedFeedType]);

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { data: userFeeds, error } = await supabase
        .from('user_feeds')
        .select(`
          *,
          feed_sources (
            id,
            name,
            url,
            type,
            is_active,
            favicon_url
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching feeds:', error);
        setError('Failed to load feeds');
        return;
      }

      setFeeds(userFeeds || []);
    } catch (error) {
      console.error('Error fetching feeds:', error);
      setError('Failed to load feeds');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeed = async () => {
    if (!newFeedUrl.trim() || !selectedFeedType) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Get the proper feed name based on type
      let feedName = newFeedName.trim();
      if (selectedFeedType === 'youtube') {
        // For YouTube, get the real channel name
        feedName = await fetchYouTubeChannelName(newFeedUrl);
        if (!feedName) {
          // Fallback to URL parsing
          feedName = extractFeedNameFromUrl(newFeedUrl, selectedFeedType);
        }
      } else {
        // For other types, use URL parsing
        feedName = extractFeedNameFromUrl(newFeedUrl, selectedFeedType);
      }

      if (!feedName) {
        Alert.alert('Error', 'Could not extract feed name from URL');
        return;
      }

      // First, create or get the feed source
      const { data: feedSource, error: feedSourceError } = await supabase
        .from('feed_sources')
        .upsert({
          name: feedName,
          url: newFeedUrl.trim(),
          type: selectedFeedType,
          is_active: true,
        }, { onConflict: 'url' })
        .select()
        .single();

      if (feedSourceError) {
        console.error('Error creating feed source:', feedSourceError);
        Alert.alert('Error', 'Failed to create feed source');
        return;
      }

      // Then, link it to the user (use upsert to handle duplicates)
      const { error: userFeedError } = await supabase
        .from('user_feeds')
        .upsert({
          user_id: user.id,
          feed_source_id: feedSource.id,
          is_active: true,
        }, { onConflict: 'user_id,feed_source_id' });

      if (userFeedError) {
        console.error('Error linking feed to user:', userFeedError);
        Alert.alert('Error', 'Failed to add feed to your account');
        return;
      }

      // Reset form first
      setNewFeedName('');
      setNewFeedUrl('');
      setSelectedFeedType(null);
      
      // Switch to my-feeds tab immediately
      setActiveTab('my-feeds');
      
      // Refresh feeds to show the new feed
      await fetchFeeds();
      
      // Trigger immediate content fetch for the new feed (in background, don't await)
      triggerImmediateContentFetch(feedSource.id, selectedFeedType).catch(error => {
        console.error('Background content fetch failed:', error);
      });

    } catch (error) {
      console.error('Error adding feed:', error);
      Alert.alert('Error', 'Failed to add feed');
    }
  };

  // Function to trigger immediate content fetch for a new feed
  const triggerImmediateContentFetch = async (feedSourceId: string, feedType: string) => {
    try {
      console.log(`Triggering immediate content fetch for ${feedType} feed: ${feedSourceId}`);
      
      // Add to fetching state
      setFetchingFeeds(prev => new Set([...prev, feedSourceId]));
      
      // Call the appropriate edge function based on feed type
      const functionName = `${feedType}Fetcher`;
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedSourceId: feedSourceId,
            immediate: true
          })
        }
      );

      if (!response.ok) {
        console.error(`Failed to trigger ${feedType} fetcher:`, response.status);
      } else {
        console.log(`Successfully triggered ${feedType} content fetch`);
        
        // For YouTube feeds, wait a bit and then refresh to get updated favicon
        if (feedType === 'youtube') {
          setTimeout(async () => {
            try {
              console.log('Refreshing feeds to get updated YouTube favicon...');
              await fetchFeeds(); // Refresh feeds to get updated favicon
              console.log('Feeds refreshed, favicon should now be updated');
            } catch (error) {
              console.error('Error refreshing feeds after YouTube fetch:', error);
            }
          }, 1000); // Wait 1 second for YouTube fetcher to update favicon
        }
      }
    } catch (error) {
      console.error(`Error triggering ${feedType} content fetch:`, error);
      // Don't show error to user as this is background process
    } finally {
      // Remove from fetching state after a delay to show loading
      setTimeout(() => {
        setFetchingFeeds(prev => {
          const newSet = new Set(prev);
          newSet.delete(feedSourceId);
          return newSet;
        });
      }, 3000); // Show loading for 3 seconds
    }
  };

  const handleRemoveFeed = async (userFeedId: string) => {
    Alert.alert(
      'Remove Feed',
      'Are you sure you want to remove this feed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
                             const { error } = await supabase
                 .from('user_feeds')
                 .update({ is_active: false })
                 .eq('id', userFeedId);

              if (error) {
                console.error('Error removing feed:', error);
                Alert.alert('Error', 'Failed to remove feed');
              } else {
                await fetchFeeds();
                Alert.alert('Success', 'Feed removed successfully!');
              }
            } catch (error) {
              console.error('Error removing feed:', error);
              Alert.alert('Error', 'Failed to remove feed');
            }
          },
        },
      ]
    );
  };

  const getSourceIcon = (source: string, type: string, sourceUrl?: string) => {
    // For YouTube feeds, check if we have a stored profile picture
    if (type === 'youtube') {
      // The profile picture should be stored in the feed_sources table
      // For now, we'll use the favicon service
      return getFeedSourceFavicon(source, sourceUrl);
    }
    
    // For other feed types, use the favicon service
    return getFeedSourceFavicon(source, sourceUrl);
  };

  const getSourceColor = (type: string): string => {
    switch (type) {
      case 'rss':
        return '#ff6600';
      case 'youtube':
        return '#ff0000';
      case 'reddit':
        return '#ff4500';
      default:
        return theme.textSecondary;
    }
  };

  const formatFeedCount = (feeds: any[]) => {
    const byType = feeds.reduce((acc, feed) => {
      const type = feed.feed_sources?.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const parts = [];
    if (byType.rss) parts.push(`${byType.rss} RSS`);
    if (byType.youtube) parts.push(`${byType.youtube} YouTube`);
    if (byType.reddit) parts.push(`${byType.reddit} Reddit`);
    
    return parts.join(', ') || 'No feeds';
  };

  const MyFeedsScreen = () => {
    // Group feeds by type
    const groupedFeeds = feeds.reduce((acc, feed) => {
      const type = feed.feed_sources?.type || 'unknown';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(feed);
      return acc;
    }, {} as Record<string, any[]>);

    // Define feed type sections in order
    const feedTypeSections = [
      { type: 'rss', label: 'RSS Feeds', icon: 'globe', color: '#ff6600' },
      { type: 'youtube', label: 'YouTube Channels', icon: 'play-circle', color: '#ff0000' },
      { type: 'reddit', label: 'Reddit Communities', icon: 'people', color: '#ff4500' },
    ];

    return (
      <View style={styles.screen}>
        <View style={styles.screenHeader}>
          <Text style={[styles.title, { color: theme.text }]}>My Feeds</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {formatFeedCount(feeds)}
          </Text>
        </View>

        {feeds.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="add-circle-outline" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No feeds yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Add your first feed to get started
            </Text>
            <TouchableOpacity
              style={[styles.addFirstButton, { backgroundColor: theme.accent }]}
              onPress={() => setActiveTab('add-feed')}
            >
              <Text style={[styles.addFirstButtonText, { color: theme.accentText }]}>
                Add Your First Feed
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={feedTypeSections}
            keyExtractor={(section) => section.type}
            renderItem={({ item: section }) => {
              const sectionFeeds = groupedFeeds[section.type] || [];
              if (sectionFeeds.length === 0) return null;

              return (
                <View key={section.type}>
                  {/* Section Header */}
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <Ionicons 
                        name={section.icon as any} 
                        size={16} 
                        color={section.color} 
                      />
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        {section.label}
                      </Text>
                      <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>
                        ({sectionFeeds.length})
                      </Text>
                    </View>
                  </View>

                  {/* Section Feeds */}
                  {sectionFeeds.map((feed: any) => {
                    const isFetching = fetchingFeeds.has(feed.feed_sources?.id);
                    
                    return (
                      <View key={feed.id} style={[styles.feedCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                        <View style={styles.feedCardHeader}>
                          <Image
                            source={{ 
                              uri: feed.feed_sources?.favicon_url || 
                                    getSourceIcon(feed.feed_sources?.name || '', feed.feed_sources?.type || '', feed.feed_sources?.url) 
                            }}
                            style={styles.feedIcon}
                          />
                          <View style={styles.feedInfo}>
                            <Text style={[styles.feedName, { color: theme.text }]}>
                              {feed.feed_sources?.name || 'Unknown'}
                            </Text>
                            <Text style={[styles.feedUrl, { color: theme.textSecondary }]} numberOfLines={1}>
                              {feed.feed_sources?.url || ''}
                            </Text>
                            <View style={styles.feedTypeContainer}>
                              <Ionicons 
                                name={(FEED_TYPES.find(t => t.type === feed.feed_sources?.type)?.icon || 'globe') as any} 
                                size={12} 
                                color={getSourceColor(feed.feed_sources?.type || '')} 
                              />
                              <Text style={[styles.feedType, { color: getSourceColor(feed.feed_sources?.type || '') }]}>
                                {FEED_TYPES.find(t => t.type === feed.feed_sources?.type)?.label || 'Unknown'}
                              </Text>
                              {isFetching && (
                                <View style={styles.fetchingIndicator}>
                                  <ActivityIndicator size={12} color={theme.accent} />
                                  <Text style={[styles.fetchingText, { color: theme.accent }]}>
                                    Fetching...
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleRemoveFeed(feed.id)}
                          >
                            <Ionicons name="trash-outline" size={20} color={theme.textMuted} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            }}
            contentContainerStyle={styles.feedsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  };

  const AddFeedScreen = () => (
    <View style={styles.screen}>
      <View style={styles.screenHeader}>
        <Text style={[styles.title, { color: theme.text }]}>Add New Feed</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Choose the type of feed you want to add
        </Text>
      </View>

      <ScrollView style={styles.addFeedContainer} showsVerticalScrollIndicator={false}>
        {/* Feed Type Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Feed Type</Text>
          <View style={styles.feedTypeList}>
            {FEED_TYPES.map((feedType) => (
              <TouchableOpacity
                key={feedType.type}
                style={[
                  styles.feedTypeItem,
                  { backgroundColor: theme.cardBg, borderColor: theme.border },
                  selectedFeedType === feedType.type && { borderColor: theme.accent }
                ]}
                onPress={() => setSelectedFeedType(feedType.type)}
              >
                <View style={styles.feedTypeContent}>
                  <View style={[
                    styles.feedTypeIcon,
                    { backgroundColor: feedType.iconColor }
                  ]}>
                    <Ionicons 
                      name={feedType.icon as any} 
                      size={20} 
                      color="white" 
                    />
                  </View>
                  <View style={styles.feedTypeText}>
                    <Text style={[
                      styles.feedTypeLabel, 
                      { color: selectedFeedType === feedType.type ? theme.accent : theme.text }
                    ]}>
                      {feedType.label}
                    </Text>
                    <Text style={[styles.feedTypeDescription, { color: theme.textSecondary }]}>
                      {feedType.description}
                    </Text>
                  </View>
                </View>
                {selectedFeedType === feedType.type && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feed Details Form */}
        {selectedFeedType && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Feed Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Feed URL</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.cardBg, 
                  borderColor: theme.border,
                  color: theme.text 
                }]}
                value={newFeedUrl}
                onChangeText={setNewFeedUrl}
                placeholder={FEED_TYPES.find(t => t.type === selectedFeedType)?.placeholder}
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Examples */}
            <View style={styles.examplesContainer}>
              <Text style={[styles.examplesTitle, { color: theme.textSecondary }]}>Examples:</Text>
              {FEED_TYPES.find(t => t.type === selectedFeedType)?.examples.map((example, index) => (
                <Text key={index} style={[styles.example, { color: theme.textMuted }]}>
                  • {example}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: theme.accent },
                (!newFeedName.trim() || !newFeedUrl.trim()) && { opacity: 0.5 }
              ]}
              onPress={handleAddFeed}
              disabled={!newFeedName.trim() || !newFeedUrl.trim()}
            >
              <>
                <Ionicons name="add" size={20} color={theme.accentText} />
                <Text style={[styles.addButtonText, { color: theme.accentText }]}>
                  Add Feed
                </Text>
              </>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );

  if (loading) {
    return <LoadingState message="Loading feeds..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load feeds"
        message={error}
        onRetry={fetchFeeds}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>Feed Management</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my-feeds' && { borderBottomColor: theme.accent }
          ]}
          onPress={() => setActiveTab('my-feeds')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'my-feeds' ? theme.accent : theme.textSecondary }
          ]}>
            My Feeds ({feeds.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'add-feed' && { borderBottomColor: theme.accent }
          ]}
          onPress={() => setActiveTab('add-feed')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'add-feed' ? theme.accent : theme.textSecondary }
          ]}>
            Add Feed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'my-feeds' ? <MyFeedsScreen /> : <AddFeedScreen />}
      
      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: theme.hover }]}
          onPress={() => navigation.navigate('FeedManagement')}
        >
          <Ionicons name="list-outline" size={24} color={theme.accent} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('SavedArticles')}
        >
          <Ionicons name="heart-outline" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={theme.textSecondary} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  screen: {
    flex: 1,
    paddingHorizontal: 16,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  addFirstButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedsList: {
    paddingBottom: 20,
  },
  feedCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  feedInfo: {
    flex: 1,
  },
  feedName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  feedUrl: {
    fontSize: 12,
    marginBottom: 4,
  },
  feedTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedType: {
    fontSize: 12,
    marginLeft: 6,
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionCount: {
    fontSize: 14,
    marginLeft: 4,
  },
  addFeedContainer: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  examplesContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  example: {
    fontSize: 12,
    marginBottom: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  feedTypeList: {
    gap: 12,
  },
  feedTypeCard: {
    width: '48%', // Two columns
    aspectRatio: 1.2, // Slightly taller cards
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  feedTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  feedTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fetchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  fetchingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  feedTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  feedTypeText: {
    flex: 1,
  },
  feedTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  feedTypeDescription: {
    fontSize: 14,
    color: '#666',
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
});

export default FeedManagementScreen; 