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
    description: 'News websites, blogs, podcasts',
    placeholder: 'https://example.com/feed.xml',
    examples: ['TechCrunch', 'The Verge', 'Wired']
  },
  { 
    type: 'youtube', 
    label: 'YouTube Channel', 
    icon: 'logo-youtube',
    description: 'YouTube channels and creators',
    placeholder: 'https://www.youtube.com/@channelname',
    examples: ['@TechCrunch', '@TheVerge', '@WIRED']
  },
  { 
    type: 'reddit', 
    label: 'Reddit Community', 
    icon: 'logo-reddit',
    description: 'Reddit subreddits and communities',
    placeholder: 'https://reddit.com/r/subreddit',
    examples: ['r/technology', 'r/programming', 'r/startups']
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
  const [addingFeed, setAddingFeed] = useState(false);

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
            is_active
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
    if (!newFeedName.trim() || !newFeedUrl.trim() || !selectedFeedType) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setAddingFeed(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // First, create or get the feed source
      const { data: feedSource, error: feedSourceError } = await supabase
        .from('feed_sources')
        .upsert({
          name: newFeedName.trim(),
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

      // Then, link it to the user
      const { error: userFeedError } = await supabase
        .from('user_feeds')
        .insert({
          user_id: user.id,
          feed_source_id: feedSource.id,
          is_active: true,
        });

      if (userFeedError) {
        console.error('Error linking feed to user:', userFeedError);
        Alert.alert('Error', 'Failed to add feed to your account');
        return;
      }

      // Reset form
      setNewFeedName('');
      setNewFeedUrl('');
      setSelectedFeedType(null);
      setActiveTab('my-feeds');

      // Refresh feeds
      await fetchFeeds();

      Alert.alert('Success', 'Feed added successfully!');
    } catch (error) {
      console.error('Error adding feed:', error);
      Alert.alert('Error', 'Failed to add feed');
    } finally {
      setAddingFeed(false);
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

  const MyFeedsScreen = () => (
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
          data={feeds}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.feedCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.feedCardHeader}>
                <Image
                  source={{ uri: getSourceIcon(item.feed_sources?.name || '', item.feed_sources?.type || '', item.feed_sources?.url) }}
                  style={styles.feedIcon}
                />
                <View style={styles.feedInfo}>
                  <Text style={[styles.feedName, { color: theme.text }]}>
                    {item.feed_sources?.name || 'Unknown'}
                  </Text>
                  <Text style={[styles.feedUrl, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.feed_sources?.url || ''}
                  </Text>
                  <View style={styles.feedTypeContainer}>
                                         <Ionicons 
                       name={(FEED_TYPES.find(t => t.type === item.feed_sources?.type)?.icon || 'globe') as any} 
                       size={12} 
                       color={getSourceColor(item.feed_sources?.type || '')} 
                     />
                    <Text style={[styles.feedType, { color: getSourceColor(item.feed_sources?.type || '') }]}>
                      {FEED_TYPES.find(t => t.type === item.feed_sources?.type)?.label || 'Unknown'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFeed(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.feedsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

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
          <View style={styles.feedTypeGrid}>
            {FEED_TYPES.map((feedType) => (
              <TouchableOpacity
                key={feedType.type}
                style={[
                  styles.feedTypeCard,
                  { backgroundColor: theme.cardBg, borderColor: theme.border },
                  selectedFeedType === feedType.type && { borderColor: theme.accent }
                ]}
                onPress={() => setSelectedFeedType(feedType.type)}
              >
                <Ionicons 
                  name={feedType.icon as any} 
                  size={24} 
                  color={selectedFeedType === feedType.type ? theme.accent : theme.textSecondary} 
                />
                <Text style={[
                  styles.feedTypeLabel, 
                  { color: selectedFeedType === feedType.type ? theme.accent : theme.text }
                ]}>
                  {feedType.label}
                </Text>
                <Text style={[styles.feedTypeDescription, { color: theme.textSecondary }]}>
                  {feedType.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feed Details Form */}
        {selectedFeedType && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Feed Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Feed Name</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.cardBg, 
                  borderColor: theme.border,
                  color: theme.text 
                }]}
                value={newFeedName}
                onChangeText={setNewFeedName}
                placeholder="Enter a name for this feed"
                placeholderTextColor={theme.textMuted}
              />
            </View>

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
              disabled={!newFeedName.trim() || !newFeedUrl.trim() || addingFeed}
            >
              {addingFeed ? (
                <ActivityIndicator color={theme.accentText} />
              ) : (
                <>
                  <Ionicons name="add" size={20} color={theme.accentText} />
                  <Text style={[styles.addButtonText, { color: theme.accentText }]}>
                    Add Feed
                  </Text>
                </>
              )}
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
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
    paddingTop: 50,
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
  addFeedContainer: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
  feedTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  feedTypeDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default FeedManagementScreen; 