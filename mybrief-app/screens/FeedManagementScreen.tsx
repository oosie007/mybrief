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
import { LoadingState, ErrorState, NoFeedsState, SkeletonFeedCard } from '../components/UIStates';
import { getFeedSourceFavicon } from '../lib/faviconService';
import { categorizeFeed, updateFeedCategory, FEED_CATEGORIES } from '../lib/feedCategorizer';
import SharedLayout from '../components/SharedLayout';

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

const AddFeedScreen = ({
  selectedFeedType,
  setSelectedFeedType,
  newFeedUrl,
  setNewFeedUrl,
  newFeedName,
  setNewFeedName,
  handleAddFeed,
  getSourceColor,
  theme,
}: {
  selectedFeedType: string | null;
  setSelectedFeedType: (type: string) => void;
  newFeedUrl: string;
  setNewFeedUrl: (url: string) => void;
  newFeedName: string;
  setNewFeedName: (name: string) => void;
  handleAddFeed: () => void;
  getSourceColor: (type: string) => string;
  theme: any;
}) => {
  const selectedFeedTypeData = FEED_TYPES.find(t => t.type === selectedFeedType);
  
  return (
    <View style={styles.screen}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feed Type Selection */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Choose Feed Type
          </Text>
        </View>
        
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {FEED_TYPES.map((feedType) => (
            <TouchableOpacity
              key={feedType.type}
              style={[
                styles.feedTypeItem,
                { borderColor: theme.border },
                selectedFeedType === feedType.type && { borderColor: theme.accent, borderWidth: 2 }
              ]}
              onPress={() => setSelectedFeedType(feedType.type)}
            >
              <View style={styles.feedTypeContent}>
                <View style={[
                  styles.feedTypeIcon,
                  { backgroundColor: getSourceColor(feedType.type) }
                ]}>
                  <Ionicons name={feedType.icon as any} size={20} color="white" />
                </View>
                <View style={styles.feedTypeText}>
                  <Text style={[styles.feedTypeLabel, { color: theme.text }]}>
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

        {/* Feed Details Form */}
        {selectedFeedType && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                Feed Details
              </Text>
            </View>
            
            <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Feed URL</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: theme.background, 
                    borderColor: theme.border,
                    color: theme.text 
                  }]}
                  value={newFeedUrl}
                  onChangeText={setNewFeedUrl}
                  placeholder={selectedFeedTypeData?.placeholder}
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Feed Name (Optional)</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: theme.background, 
                    borderColor: theme.border,
                    color: theme.text 
                  }]}
                  value={newFeedName}
                  onChangeText={setNewFeedName}
                  placeholder="Leave empty to auto-generate from URL"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Examples */}
              <View style={[styles.examplesContainer, { borderTopColor: theme.border }]}>
                <Text style={[styles.examplesTitle, { color: theme.textSecondary }]}>Examples:</Text>
                {selectedFeedTypeData?.examples.map((example, index) => (
                  <Text key={index} style={[styles.example, { color: theme.textMuted }]}>
                    • {example}
                  </Text>
                ))}
              </View>

              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={[
                    styles.formButton,
                    { backgroundColor: theme.accent },
                    (!newFeedUrl.trim()) && { opacity: 0.5 }
                  ]}
                  onPress={handleAddFeed}
                  disabled={!newFeedUrl.trim()}
                >
                  <Text style={[styles.formButtonText, { color: theme.accentText }]}>
                    Add Feed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const FeedManagementScreen = ({ navigation }: any) => {
  const { theme, isDarkMode } = useTheme();
  const [feeds, setFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my-feeds' | 'add-feed'>('my-feeds');
  const [selectedFeedType, setSelectedFeedType] = useState<string | null>(null);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [fetchingFeeds, setFetchingFeeds] = useState<Set<string>>(new Set());
  
  // Edit feed state
  const [editingFeed, setEditingFeed] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFeedName, setEditFeedName] = useState('');
  const [editFeedCategory, setEditFeedCategory] = useState('');
  const [editFeedUrl, setEditFeedUrl] = useState('');

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
      // Don't log errors during typing - only when actually adding
      return '';
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

  // Update feed name when URL changes - REMOVED automatic validation
  // useEffect(() => {
  //   if (selectedFeedType && newFeedUrl) {
  //     if (selectedFeedType === 'youtube') {
  //       // For YouTube, try to fetch the real channel name
  //       fetchYouTubeChannelName(newFeedUrl).then(name => {
  //         if (name) {
  //           setNewFeedName(name);
  //         }
  //       });
  //     } else {
  //       // For other types, use URL parsing
  //       const extractedName = extractFeedNameFromUrl(newFeedUrl, selectedFeedType);
  //       if (extractedName) {
  //         setNewFeedName(extractedName);
  //       }
  //     }
  //   }
  // }, [newFeedUrl, selectedFeedType]);

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
            favicon_url,
            category
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

      // Get the proper feed name based on type - ONLY when user clicks Add
      let feedName = newFeedName.trim();
      if (!feedName) {
        // Only extract name if user hasn't provided one
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
      }

      if (!feedName) {
        Alert.alert('Error', 'Could not extract feed name from URL. Please provide a name manually.');
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

      // Automatically categorize the feed
      try {
        const categorization = await categorizeFeed(feedName, newFeedUrl.trim());
        console.log(`Auto-categorized "${feedName}" as: ${categorization.category} (confidence: ${categorization.confidence})`);
        
        // Update the feed source with the category
        await updateFeedCategory(feedSource.id, categorization.category);
      } catch (error) {
        console.error('Error categorizing feed:', error);
        // Don't fail the whole operation if categorization fails
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
    try {
      const { error } = await supabase
        .from('user_feeds')
        .delete()
        .eq('id', userFeedId);

      if (error) {
        console.error('Error removing feed:', error);
        Alert.alert('Error', 'Failed to remove feed');
        return;
      }

      // Refresh feeds list
      await fetchFeeds();
      Alert.alert('Success', 'Feed removed successfully');
    } catch (error) {
      console.error('Error removing feed:', error);
      Alert.alert('Error', 'Failed to remove feed');
    }
  };

  const handleDeleteFeed = async () => {
    if (!editingFeed) return;
    
    Alert.alert(
      'Delete Feed',
      `Are you sure you want to delete "${editingFeed.feed_sources?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await handleRemoveFeed(editingFeed.id);
              setShowEditModal(false);
              setEditingFeed(null);
            } catch (error) {
              console.error('Error deleting feed:', error);
            }
          }
        }
      ]
    );
  };

  const handleEditFeed = async () => {
    if (!editingFeed || !editFeedName.trim() || !editFeedUrl.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic URL validation
    try {
      new URL(editFeedUrl.trim());
    } catch {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    // Check if URL has changed
    const urlChanged = editFeedUrl.trim() !== editingFeed.feed_sources?.url;
    
    if (urlChanged) {
      Alert.alert(
        'Change Feed URL',
        'Changing the feed URL will affect content fetching. Are you sure you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => updateFeed()
          }
        ]
      );
    } else {
      updateFeed();
    }
  };

  const updateFeed = async () => {
    try {
      // Update the feed source
      const { error: updateError } = await supabase
        .from('feed_sources')
        .update({
          name: editFeedName.trim(),
          url: editFeedUrl.trim(),
          category: editFeedCategory
        })
        .eq('id', editingFeed.feed_sources?.id);

      if (updateError) {
        console.error('Error updating feed:', updateError);
        Alert.alert('Error', 'Failed to update feed');
        return;
      }

      // Close modal and refresh feeds
      setShowEditModal(false);
      setEditingFeed(null);
      setEditFeedName('');
      setEditFeedCategory('');
      setEditFeedUrl('');
      await fetchFeeds();

      Alert.alert('Success', 'Feed updated successfully');
    } catch (error) {
      console.error('Error updating feed:', error);
      Alert.alert('Error', 'Failed to update feed');
    }
  };

  const openEditModal = (feed: any) => {
    setEditingFeed(feed);
    setEditFeedName(feed.feed_sources?.name || '');
    setEditFeedCategory(feed.feed_sources?.category || 'Technology');
    setEditFeedUrl(feed.feed_sources?.url || '');
    setShowEditModal(true);
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
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            <>
              {feedTypeSections.map((section) => {
                const sectionFeeds = groupedFeeds[section.type] || [];
                if (sectionFeeds.length === 0) return null;

                return (
                  <View key={section.type}>
                    {/* Section Header */}
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                        {section.label} ({sectionFeeds.length})
                      </Text>
                    </View>

                    {/* Section Feeds */}
                    <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                      {sectionFeeds.map((feed: any, index: number) => {
                        const isFetching = fetchingFeeds.has(feed.feed_sources?.id);
                        
                        if (isFetching) {
                          return <SkeletonFeedCard key={feed.id} theme={theme} />;
                        }
                        
                        return (
                          <TouchableOpacity
                            key={feed.id}
                            style={[
                              styles.feedItem,
                              { borderBottomColor: theme.border },
                              index < sectionFeeds.length - 1 && { borderBottomWidth: 1 }
                            ]}
                            onPress={() => openEditModal(feed)}
                          >
                            <View style={styles.feedItemContent}>
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
                                {feed.feed_sources?.category && (
                                  <View style={styles.categoryContainer}>
                                    <Text style={[styles.categoryText, { color: theme.textSecondary }]}>
                                      {feed.feed_sources.category}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                            <View style={styles.feedItemRight}>
                              <Ionicons 
                                name="chevron-forward" 
                                size={16} 
                                color={theme.textMuted} 
                              />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    );
  };

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
    <SharedLayout
      navigation={navigation}
      currentScreen="feeds"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search feeds..."
      showFilters={false}
    >
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my-feeds' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('my-feeds')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'my-feeds' ? theme.accent : theme.textSecondary }
          ]}>
            My Feeds
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'add-feed' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }
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
      {activeTab === 'my-feeds' ? <MyFeedsScreen /> : <AddFeedScreen
        selectedFeedType={selectedFeedType}
        setSelectedFeedType={setSelectedFeedType}
        newFeedUrl={newFeedUrl}
        setNewFeedUrl={setNewFeedUrl}
        newFeedName={newFeedName}
        setNewFeedName={setNewFeedName}
        handleAddFeed={handleAddFeed}
        getSourceColor={getSourceColor}
        theme={theme}
      />}

      {/* Edit Feed Modal */}
      {showEditModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Feed</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Feed Name</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: theme.background, 
                    borderColor: theme.border,
                    color: theme.text 
                  }]}
                  value={editFeedName}
                  onChangeText={setEditFeedName}
                  placeholder="Enter feed name"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Feed URL</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: theme.background, 
                    borderColor: theme.border,
                    color: theme.text 
                  }]}
                  value={editFeedUrl}
                  onChangeText={setEditFeedUrl}
                  placeholder="Enter feed URL"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <Text style={[styles.formHelpText, { color: theme.textMuted }]}>
                  Changing the URL will affect content fetching
                </Text>
              </View>

              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Category</Text>
                <TouchableOpacity
                  style={[styles.formInput, { 
                    backgroundColor: theme.background, 
                    borderColor: theme.border,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }]}
                  onPress={() => {
                    Alert.alert(
                      'Select Category',
                      'Choose a category',
                      [
                        ...FEED_CATEGORIES.map(category => ({
                          text: category,
                          onPress: () => setEditFeedCategory(category)
                        })),
                        { text: 'Cancel', style: 'cancel' as const }
                      ]
                    );
                  }}
                >
                  <Text style={[styles.formInputText, { color: editFeedCategory ? theme.text : theme.textMuted }]}>
                    {editFeedCategory || 'Select a category'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ef4444' }]}
                onPress={handleDeleteFeed}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.accent }]}
                onPress={handleEditFeed}
              >
                <Text style={[styles.modalButtonText, { color: theme.accentText }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SharedLayout>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 6,
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
  screen: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '500',
  },
  feedUrl: {
    fontSize: 14,
    marginTop: 2,
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
  categoryContainer: {
    marginTop: 4,
  },
  categoryText: {
    fontSize: 12,
  },
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 14,
    marginLeft: 4,
  },
  addFeedContainer: {
    paddingBottom: 20,
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 8,
  },
  examplesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  example: {
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 12,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
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
    fontWeight: '500',
    marginBottom: 4,
  },
  feedTypeDescription: {
    fontSize: 14,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 0,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputNote: {
    marginTop: 4,
    fontSize: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  formGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 8,
  },
  formButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  formButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  feedItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  feedItemRight: {
    marginLeft: 8,
  },
  formHelpText: {
    marginTop: 4,
    fontSize: 12,
  },
  formInputText: {
    fontSize: 14,
    flex: 1,
  },
});

export default FeedManagementScreen; 