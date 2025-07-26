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
  { type: 'rss', label: 'RSS Feed', icon: 'globe' },
  { type: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
  { type: 'reddit', label: 'Reddit', icon: 'logo-reddit' },
  { type: 'twitter', label: 'X/Twitter', icon: 'logo-twitter' },
];

const templatePacks = [
  {
    id: 'tech',
    name: 'Tech Entrepreneur',
    description: 'Stay ahead with startup news, tech trends, and business insights',
    feeds: [
      { type: 'rss', url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
      { type: 'rss', url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
      { type: 'rss', url: 'https://www.wired.com/feed/rss', name: 'Wired' },
      { type: 'rss', url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica' },
    ],
    subscribers: '12.3k',
    isPopular: true,
  },
  {
    id: 'adhd',
    name: 'ADHD Focus',
    description: 'Productivity tips, focus techniques, and neurodivergent-friendly content',
    feeds: [
      { type: 'rss', url: 'https://additudemag.com/feed/', name: 'ADDitude Magazine' },
      { type: 'rss', url: 'https://www.psychologytoday.com/us/blog/feed', name: 'Psychology Today' },
    ],
    subscribers: '8.7k',
    isPopular: false,
  },
  {
    id: 'dev',
    name: 'Developer Daily',
    description: 'Programming tutorials, tech news, and developer community discussions',
    feeds: [
      { type: 'rss', url: 'https://dev.to/feed', name: 'Dev.to' },
      { type: 'rss', url: 'https://news.ycombinator.com/rss', name: 'Hacker News' },
    ],
    subscribers: '15.1k',
    isPopular: true,
  },
];

const FeedManagementScreen = ({ navigation }: any) => {
  const { theme, isDarkMode } = useTheme();
  const [currentScreen, setCurrentScreen] = useState('main'); // main, template-packs, add-feed
  const [feeds, setFeeds] = useState<any[]>([]);
  const [feedType, setFeedType] = useState('rss');
  const [feedUrl, setFeedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    setLoading(true);
    setError('');
    setLoadError(null);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadError('User not logged in');
        return;
      }

      // Fetch user's subscribed feeds with feed source details
      const { data: userFeeds, error: feedsError } = await supabase
        .from('user_feeds')
        .select(`
          id,
          is_active,
          feed_source_id,
          feed_sources (
            id,
            name,
            url,
            type
          )
        `)
        .eq('user_id', user.id);

      if (feedsError) {
        console.error('Error fetching user feeds:', feedsError);
        setLoadError('Failed to load feeds');
        return;
      }

      setFeeds(userFeeds || []);
    } catch (error) {
      console.error('Error in fetchFeeds:', error);
      setLoadError('Failed to load feeds');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeed = async () => {
    if (!feedUrl.trim()) return;
    
    setSaving(true);
    setError('');
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not logged in');
        return;
      }

      // First, check if feed source already exists
      let { data: existingFeed, error: feedError } = await supabase
        .from('feed_sources')
        .select('*')
        .eq('url', feedUrl.trim())
        .single();

      let feedSourceId: string;

      if (feedError && feedError.code === 'PGRST116') {
        // Feed source doesn't exist, create it
        const { data: newFeed, error: createError } = await supabase
          .from('feed_sources')
          .insert({
            name: feedUrl.split('/').pop() || feedUrl,
            url: feedUrl.trim(),
            type: feedType,
            is_active: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating feed source:', createError);
          setError('Failed to create feed source');
          return;
        }
        feedSourceId = newFeed.id;
      } else if (feedError) {
        console.error('Error checking feed source:', feedError);
        setError('Failed to check feed source');
        return;
      } else {
        feedSourceId = existingFeed.id;
      }

      // Check if user already subscribes to this feed
      const { data: existingSubscription } = await supabase
        .from('user_feeds')
        .select('*')
        .eq('user_id', user.id)
        .eq('feed_source_id', feedSourceId)
        .single();

      if (existingSubscription) {
        // Update existing subscription to active
        const { error: updateError } = await supabase
          .from('user_feeds')
          .update({ is_active: true })
          .eq('id', existingSubscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          setError('Failed to update subscription');
          return;
        }
      } else {
        // Create new subscription
        const { error: subscribeError } = await supabase
          .from('user_feeds')
          .insert({
            user_id: user.id,
            feed_source_id: feedSourceId,
            is_active: true
          });

        if (subscribeError) {
          console.error('Error subscribing to feed:', subscribeError);
          setError('Failed to subscribe to feed');
          return;
        }
      }

      // Refresh feeds list
      await fetchFeeds();
      setFeedUrl('');
      Alert.alert('Success', 'Feed added successfully!');
    } catch (error) {
      console.error('Error adding feed:', error);
      setError('Failed to add feed');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFeed = async (feedSourceId: string) => {
    Alert.alert(
      'Remove Feed',
      'Are you sure you want to remove this feed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            setError('');
            
            try {
              // Get current user
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                setError('User not logged in');
                return;
              }

              // Deactivate the user's subscription to this feed
              const { error: updateError } = await supabase
                .from('user_feeds')
                .update({ is_active: false })
                .eq('user_id', user.id)
                .eq('feed_source_id', feedSourceId);

              if (updateError) {
                console.error('Error removing feed:', updateError);
                setError('Failed to remove feed');
                return;
              }

              // Refresh feeds list
              await fetchFeeds();
              Alert.alert('Success', 'Feed removed successfully!');
            } catch (error) {
              console.error('Error removing feed:', error);
              setError('Failed to remove feed');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleAddPack = async (pack: any) => {
    setBulkLoading(true);
    setError('');
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not logged in');
        return;
      }

      console.log('Adding pack:', pack.name, 'for user:', user.id);

      // Process each feed in the pack
      for (const feed of pack.feeds) {
        console.log('Processing feed:', feed.name, feed.url);
        
        // Check if feed source exists
        let { data: existingFeed } = await supabase
          .from('feed_sources')
          .select('*')
          .eq('url', feed.url)
          .single();

        let feedSourceId: string;

        if (!existingFeed) {
          console.log('Creating new feed source:', feed.name);
          // Create feed source
          const { data: newFeed, error: createError } = await supabase
            .from('feed_sources')
            .insert({
              name: feed.name,
              url: feed.url,
              type: feed.type,
              is_active: true
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating feed source:', createError);
            continue;
          }
          feedSourceId = newFeed.id;
          console.log('Created feed source with ID:', feedSourceId);
        } else {
          feedSourceId = existingFeed.id;
          console.log('Using existing feed source ID:', feedSourceId);
        }

        // Subscribe user to feed (ignore if already subscribed)
        const { error: subscribeError } = await supabase
          .from('user_feeds')
          .upsert({
            user_id: user.id,
            feed_source_id: feedSourceId,
            is_active: true
          }, { onConflict: 'user_id,feed_source_id' });

        if (subscribeError) {
          console.error('Error subscribing to feed:', subscribeError);
        } else {
          console.log('Successfully subscribed to feed:', feed.name);
        }
      }

      // Refresh feeds list
      await fetchFeeds();
      Alert.alert('Success', `${pack.name} template pack added successfully!`);
    } catch (error) {
      console.error('Error adding pack:', error);
      setError('Failed to add template pack');
    } finally {
      setBulkLoading(false);
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

  // Template Packs Screen
  const TemplatePacksScreen = () => (
    <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setCurrentScreen('main')}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Template Packs</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
          Quick-start your feed with curated collections
        </Text>
        
        {templatePacks.map((pack) => (
          <View key={pack.id} style={[styles.packCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.packHeader}>
              <Text style={[styles.packName, { color: theme.text }]}>{pack.name}</Text>
              {pack.isPopular && (
                <View style={[styles.popularBadge, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.popularText, { color: theme.accentText }]}>Popular</Text>
                </View>
              )}
            </View>
            
            <Text style={[styles.packDescription, { color: theme.textSecondary }]}>
              {pack.description}
            </Text>
            
            <View style={styles.packStats}>
              <Text style={[styles.packStat, { color: theme.textMuted }]}>
                {pack.feeds.length} sources
              </Text>
              <Text style={[styles.packStat, { color: theme.textMuted }]}>
                {pack.subscribers} subscribers
              </Text>
            </View>
            
            <View style={styles.packFeeds}>
              {pack.feeds.slice(0, 3).map((feed, index) => (
                <View key={index} style={[styles.feedTag, { backgroundColor: theme.pill }]}>
                  <Text style={[styles.feedTagText, { color: theme.pillText }]}>{feed.name}</Text>
                </View>
              ))}
              {pack.feeds.length > 3 && (
                <View style={[styles.feedTag, { backgroundColor: theme.pill }]}>
                  <Text style={[styles.feedTagText, { color: theme.textMuted }]}>
                    +{pack.feeds.length - 3} more
                  </Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.addPackButton, { backgroundColor: theme.accent }]}
              onPress={() => handleAddPack(pack)}
              disabled={bulkLoading}
            >
              <Text style={[styles.addPackButtonText, { color: theme.accentText }]}>
                {bulkLoading ? 'Adding...' : 'Add Pack'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Add Feed Screen
  const AddFeedScreen = () => {
    return (
      <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setCurrentScreen('main')}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Add Custom Feed</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Feed Type</Text>
            <View style={styles.feedTypeContainer}>
              {FEED_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.type}
                  style={[
                    styles.feedTypeButton,
                    feedType === type.type 
                      ? { backgroundColor: theme.accent, borderColor: theme.accent }
                      : { backgroundColor: theme.pill, borderColor: theme.border }
                  ]}
                  onPress={() => setFeedType(type.type)}
                >
                  <Ionicons 
                    name={type.icon as any} 
                    size={16} 
                    color={feedType === type.type ? theme.accentText : theme.pillText} 
                  />
                  <Text style={[
                    styles.feedTypeText,
                    feedType === type.type 
                      ? { color: theme.accentText }
                      : { color: theme.pillText }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Feed URL</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: theme.cardBg, 
                color: theme.text, 
                borderColor: theme.border 
              }]}
              placeholder="Enter RSS feed URL..."
              placeholderTextColor={theme.textMuted}
              value={feedUrl}
              onChangeText={setFeedUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: '#ff4444' }]}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.addButton,
              saving 
                ? { backgroundColor: '#cccccc' }
                : { backgroundColor: theme.accent }
            ]}
            onPress={handleAddFeed}
            disabled={saving || !feedUrl.trim()}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.accentText} />
            ) : (
              <>
                <Ionicons name="add" size={16} color={theme.accentText} />
                <Text style={[styles.addButtonText, { color: theme.accentText }]}>
                  Add Feed
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
            <Text style={[styles.dividerText, { color: theme.textMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
          </View>

          <TouchableOpacity 
            style={[styles.templatePackCard, { backgroundColor: theme.cardBg, borderColor: theme.borderLight }]}
            onPress={() => setCurrentScreen('template-packs')}
          >
            <Text style={styles.templatePackIcon}>📦</Text>
            <Text style={[styles.templatePackTitle, { color: theme.text }]}>Browse Template Packs</Text>
            <Text style={[styles.templatePackSubtitle, { color: theme.textSecondary }]}>
              Quick-start with curated collections
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Main Feeds Screen
  const MainFeedsScreen = () => (
    <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Your Feeds</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setCurrentScreen('add-feed')}
        >
          <Ionicons name="add" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={[styles.templatePackCard, { backgroundColor: theme.cardBg, borderColor: theme.borderLight }]}
          onPress={() => setCurrentScreen('template-packs')}
        >
          <Text style={styles.templatePackIcon}>📦</Text>
          <Text style={[styles.templatePackTitle, { color: theme.text }]}>Browse Template Packs</Text>
          <Text style={[styles.templatePackSubtitle, { color: theme.textSecondary }]}>
            Quick-start with curated collections
          </Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Active Sources ({feeds.length})
        </Text>

        {feeds.map((feed) => (
          <View key={feed.feed_sources.id} style={[styles.feedCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.feedCardContent}>
              <Image
                source={{ uri: getSourceIcon(feed.feed_sources.name || feed.feed_sources.url, feed.feed_sources.type, feed.feed_sources.url) }}
                style={styles.sourceIcon}
              />
              <View style={styles.feedCardInfo}>
                <Text style={[styles.feedCardName, { color: theme.text }]}>
                  {feed.feed_sources.name || feed.feed_sources.url}
                </Text>
                <Text style={[styles.feedCardType, { color: theme.textSecondary }]}>
                  {feed.feed_sources.type}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => handleRemoveFeed(feed.feed_sources.id)}
              disabled={saving}
            >
              <Ionicons name="close" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        ))}

        {feeds.length === 0 && (
          <NoFeedsState onAddFeeds={() => setCurrentScreen('add-feed')} />
        )}
      </ScrollView>
    </View>
  );

  if (loading) {
    return <LoadingState message="Loading your feeds..." />;
  }

  if (loadError) {
    return (
      <ErrorState
        title="Failed to load feeds"
        message={loadError}
        onRetry={fetchFeeds}
      />
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
      {currentScreen === 'template-packs' && <TemplatePacksScreen />}
      {currentScreen === 'add-feed' && <AddFeedScreen />}
      {currentScreen === 'main' && <MainFeedsScreen />}
      
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
          style={[styles.navButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('FeedManagement')}
        >
          <Ionicons name="list" size={20} color={theme.accentText} />
          <Text style={[styles.navText, { color: theme.accentText }]}>Feeds</Text>
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
  screenContainer: {
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
  addButton: {
    padding: 8,
    borderRadius: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 24,
  },
  packCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  packName: {
    fontSize: 16,
    fontWeight: '600',
  },
  popularBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '500',
  },
  packDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  packStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  packStat: {
    fontSize: 12,
    marginRight: 12,
  },
  packFeeds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  feedTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  feedTagText: {
    fontSize: 12,
  },
  addPackButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addPackButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  feedItemContent: {
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
  feedItemInfo: {
    flex: 1,
  },
  feedItemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  feedItemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  addFeedButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  templatePackCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 24,
  },
  templatePackIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  templatePackTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  templatePackSubtitle: {
    fontSize: 12,
  },
  feedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  feedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  feedCardInfo: {
    marginLeft: 12,
  },
  feedCardName: {
    fontSize: 14,
    fontWeight: '500',
  },
  feedCardType: {
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
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
  // Add Feed Screen Styles
  inputContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  feedTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feedTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  feedTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
  },
});

export default FeedManagementScreen; 