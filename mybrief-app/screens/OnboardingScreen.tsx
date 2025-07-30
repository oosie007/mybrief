import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import * as Localization from 'expo-localization';
import { useTheme } from '../lib/theme';

const { width } = Dimensions.get('window');

// Common timezones for selection
const COMMON_TIMEZONES = [
  { name: 'Africa/Johannesburg', display: 'Johannesburg (UTC+2)' },
  { name: 'America/New_York', display: 'New York (UTC-5)' },
  { name: 'America/Los_Angeles', display: 'Los Angeles (UTC-8)' },
  { name: 'Europe/London', display: 'London (UTC+0)' },
  { name: 'Europe/Berlin', display: 'Berlin (UTC+1)' },
  { name: 'Asia/Tokyo', display: 'Tokyo (UTC+9)' },
  { name: 'Australia/Sydney', display: 'Sydney (UTC+10)' },
  { name: 'Asia/Dubai', display: 'Dubai (UTC+4)' },
  { name: 'Asia/Shanghai', display: 'Shanghai (UTC+8)' },
  { name: 'America/Toronto', display: 'Toronto (UTC-5)' },
  { name: 'Europe/Paris', display: 'Paris (UTC+1)' },
  { name: 'Asia/Singapore', display: 'Singapore (UTC+8)' },
];

// Sample feed packs that users can choose from
const sampleFeedPacks = [
  {
    id: 'tech-entrepreneur',
    name: 'Tech Entrepreneur',
    description: 'Startup news, tech trends, business insights',
    feeds: [
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Technology' },
      { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Technology' },
      { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', category: 'Technology' },
      { name: 'Product Hunt', url: 'https://feeds.feedburner.com/producthunt', category: 'Technology' }
    ]
  },
  {
    id: 'productivity-focus',
    name: 'Productivity & Focus',
    description: 'Productivity tips, focus techniques, ND-friendly content',
    feeds: [
      { name: 'r/productivity', url: 'https://www.reddit.com/r/productivity/.rss', category: 'Productivity' },
      { name: 'r/ADHD', url: 'https://www.reddit.com/r/ADHD/.rss', category: 'Productivity' },
      { name: 'r/getdisciplined', url: 'https://www.reddit.com/r/getdisciplined/.rss', category: 'Productivity' },
      { name: 'Lifehacker', url: 'https://lifehacker.com/rss', category: 'Productivity' }
    ]
  },
  {
    id: 'developer-daily',
    name: 'Developer Daily',
    description: 'Programming tutorials, tech news, developer discussions',
    feeds: [
      { name: 'r/programming', url: 'https://www.reddit.com/r/programming/.rss', category: 'Technology' },
      { name: 'r/webdev', url: 'https://www.reddit.com/r/webdev/.rss', category: 'Technology' },
      { name: 'Dev.to', url: 'https://dev.to/feed', category: 'Technology' },
      { name: 'Stack Overflow Blog', url: 'https://stackoverflow.blog/feed/', category: 'Technology' }
    ]
  }
];



const OnboardingScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  
  // Create stable theme object to prevent re-rendering
  const stableTheme = React.useMemo(() => ({
    background: theme.background,
    cardBg: theme.cardBg,
    border: theme.border,
    text: theme.text,
    textSecondary: theme.textSecondary,
    textMuted: theme.textMuted,
    accent: theme.accent,
    accentText: theme.accentText,
  }), [theme]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [customFeeds, setCustomFeeds] = useState<Array<{ name: string; url: string; category: string }>>([]);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedCategory, setNewFeedCategory] = useState('Technology');
  
  // Extract feed name from URL (like feed management screen)
  const extractFeedNameFromUrl = (url: string): string => {
    if (!url.trim()) return '';
    
    try {
      const urlObj = new URL(url);
      
      // Check if it's a Reddit URL
      const redditMatch = url.match(/reddit\.com\/r\/([^\/\?]+)/);
      if (redditMatch) {
        return `r/${redditMatch[1]}`;
      }
      
      // Check if it's a YouTube URL
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
      
      // For RSS feeds, extract domain name
      return urlObj.hostname.replace('www.', '').split('.')[0];
    } catch (error) {
      return '';
    }
  };
  const [timezone, setTimezone] = useState('');
  const [notificationTime, setNotificationTime] = useState('07:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);

  // Auto-detect timezone on component mount
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    setTimezone(detectedTimezone);
  }, []);

  const WelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepIcon}>
        <Ionicons name="newspaper" size={48} color={theme.accent} />
      </View>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        Welcome to mybrief!
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Your personalized daily digest is just a few steps away.
      </Text>
      <View style={styles.featureList}>
        <FeatureItem icon="time" text="Get your daily digest at your preferred time" />
        <FeatureItem icon="list" text="Curated content from your favorite sources" />
        <FeatureItem icon="heart" text="Save articles to read later" />
        <FeatureItem icon="moon" text="Dark mode and customizable themes" />
      </View>
    </View>
  );

  const SampleFeedsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        Choose Sample Feeds
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Start with curated feed packs or skip to add your own.
      </Text>
      
      <ScrollView style={styles.packsContainer} showsVerticalScrollIndicator={false}>
        {sampleFeedPacks.map((pack) => (
          <TouchableOpacity
            key={pack.id}
            style={[
              styles.packCard,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
              selectedPacks.includes(pack.id) && { borderColor: theme.accent, backgroundColor: theme.accent + '10' }
            ]}
            onPress={() => {
              if (selectedPacks.includes(pack.id)) {
                setSelectedPacks(selectedPacks.filter(id => id !== pack.id));
              } else {
                setSelectedPacks([...selectedPacks, pack.id]);
              }
            }}
          >
            <View style={styles.packHeader}>
              <Text style={[styles.packName, { color: theme.text }]}>{pack.name}</Text>
              {selectedPacks.includes(pack.id) && (
                <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
              )}
            </View>
            <Text style={[styles.packDescription, { color: theme.textSecondary }]}>
              {pack.description}
            </Text>
            <Text style={[styles.packFeeds, { color: theme.textMuted }]}>
              {pack.feeds.length} feeds included
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => setCurrentStep(currentStep + 1)}
      >
        <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
          Skip - I'll add my own feeds
        </Text>
      </TouchableOpacity>
    </View>
  );

  const CustomFeedsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        Add Your Own Feeds
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Add RSS feeds, Reddit communities, or YouTube channels.
      </Text>
      
      {/* Add new feed form */}
      <View style={[styles.addFeedForm, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Add a New Feed</Text>
        
        <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
          Use the form below to add your own feeds
        </Text>
        
        <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
          Use the form below to add your own feeds
        </Text>
        
        <View style={styles.categoryContainer}>
          <Text style={[styles.categoryLabel, { color: theme.text }]}>Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Technology', 'Business', 'News', 'Productivity', 'Science', 'Health', 'Finance', 'Entertainment'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  { backgroundColor: theme.pill },
                  newFeedCategory === category && { backgroundColor: theme.accent }
                ]}
                onPress={() => setNewFeedCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  { color: theme.pillText },
                  newFeedCategory === category && { color: theme.accentText }
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
          Fill in the form below to add your feed
        </Text>
      </View>
      
      {/* Show added feeds */}
      {customFeeds.length > 0 && (
        <View style={styles.addedFeedsContainer}>
          <Text style={[styles.addedFeedsTitle, { color: theme.text }]}>Your Feeds:</Text>
          {customFeeds.map((feed, index) => (
            <View key={index} style={[styles.feedItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.feedName, { color: theme.text }]}>{feed.name}</Text>
              <Text style={[styles.feedUrl, { color: theme.textSecondary }]}>{feed.url}</Text>
              <Text style={[styles.feedCategory, { color: theme.textMuted }]}>{feed.category}</Text>
              <TouchableOpacity
                onPress={() => setCustomFeeds(customFeeds.filter((_, i) => i !== index))}
              >
                <Ionicons name="close-circle" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const NotificationsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        Set Up Notifications
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Choose when you want to receive your daily digest.
      </Text>
      
      <View style={[styles.notificationCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.notificationRow}>
          <View style={styles.notificationInfo}>
            <Ionicons name="notifications" size={24} color={theme.accent} />
            <Text style={[styles.notificationTitle, { color: theme.text }]}>Daily Digest Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: theme.border, true: theme.accent + '40' }}
            thumbColor={notificationsEnabled ? theme.accent : theme.textMuted}
          />
        </View>
        
        {notificationsEnabled && (
          <>
            <View style={styles.timeContainer}>
              <Text style={[styles.timeLabel, { color: theme.text }]}>Notification Time:</Text>
              <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                Set your preferred notification time below
              </Text>
            </View>
            
            <View style={styles.timezoneContainer}>
              <Text style={[styles.timezoneLabel, { color: theme.text }]}>Timezone:</Text>
              <TouchableOpacity
                style={[styles.timezoneDropdown, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setShowTimezonePicker(true)}
              >
                <Text style={[styles.timezoneDisplay, { color: theme.text }]}>
                  {timezone || 'Select timezone'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );

  const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={20} color={theme.accent} />
      <Text style={[styles.featureText, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  );

  // Define steps array after components
  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to mybrief!',
      subtitle: 'Your personalized daily digest is just a few steps away.',
      component: WelcomeStep
    },
    {
      id: 'sample-feeds',
      title: 'Choose Sample Feeds',
      subtitle: 'Start with curated feed packs or skip to add your own.',
      component: SampleFeedsStep
    },
    {
      id: 'custom-feeds',
      title: 'Add Your Own Feeds',
      subtitle: 'Add RSS feeds, Reddit communities, or YouTube channels.',
      component: CustomFeedsStep
    },
    {
      id: 'notifications',
      title: 'Set Up Notifications',
      subtitle: 'Choose when you want to receive your daily digest.',
      component: NotificationsStep
    }
  ];

  const handleComplete = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not signed in');
        setLoading(false);
        return;
      }
      
      // Create or update user record
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          timezone,
          digest_time: notificationTime,
          notification_enabled: notificationsEnabled,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
        });
      
      if (userError) {
        setError(`Failed to save user settings: ${userError.message}`);
        setLoading(false);
        return;
      }
      
      // Add selected sample feeds
      const allFeedsToAdd: Array<{
        user_id: string;
        feed_source_id: string | null;
        feed_name: string;
        feed_url: string;
        feed_category: string;
        feed_type: string;
        is_active: boolean;
      }> = [];
      
      // Add feeds from selected packs
      selectedPacks.forEach(packId => {
        const pack = sampleFeedPacks.find(p => p.id === packId);
        if (pack) {
          pack.feeds.forEach(feed => {
            allFeedsToAdd.push({
              user_id: user.id,
              feed_source_id: null, // Will be created
              feed_name: feed.name,
              feed_url: feed.url,
              feed_category: feed.category,
              feed_type: feed.url.includes('reddit.com') ? 'reddit' : 'rss',
              is_active: true
            });
          });
        }
      });
      
      // Add custom feeds
      customFeeds.forEach(feed => {
        allFeedsToAdd.push({
          user_id: user.id,
          feed_source_id: null, // Will be created
          feed_name: feed.name,
          feed_url: feed.url,
          feed_category: feed.category,
          feed_type: feed.url.includes('reddit.com') ? 'reddit' : 'rss',
          is_active: true
        });
      });
      
      // Add the current feed if URL is provided
      if (newFeedUrl.trim()) {
        const extractedName = extractFeedNameFromUrl(newFeedUrl);
        const feedName = newFeedName.trim() || extractedName || 'Custom Feed';
        allFeedsToAdd.push({
          user_id: user.id,
          feed_source_id: null, // Will be created
          feed_name: feedName,
          feed_url: newFeedUrl,
          feed_category: newFeedCategory,
          feed_type: newFeedUrl.includes('reddit.com') ? 'reddit' : 'rss',
          is_active: true
        });
      }
      
      // Add feeds to database
      if (allFeedsToAdd.length > 0) {
        console.log(`Adding ${allFeedsToAdd.length} feeds to database...`);
        
        for (const feedData of allFeedsToAdd) {
          console.log(`Processing feed: ${feedData.feed_name} (${feedData.feed_url})`);
          
          try {
            // First create feed source
            const { data: feedSource, error: feedSourceError } = await supabase
              .from('feed_sources')
              .insert({
                name: feedData.feed_name,
                url: feedData.feed_url,
                type: feedData.feed_type,
                category: feedData.feed_category
              })
              .select()
              .single();
            
            if (feedSourceError) {
              if (feedSourceError.message.includes('duplicate')) {
                console.log(`Feed source already exists: ${feedData.feed_name}`);
                // Try to get the existing feed source
                const { data: existingFeed, error: getError } = await supabase
                  .from('feed_sources')
                  .select('id')
                  .eq('url', feedData.feed_url)
                  .single();
                
                if (getError) {
                  console.error('Error getting existing feed source:', getError);
                  continue;
                }
                
                // Use existing feed source ID
                const feedSourceId = existingFeed.id;
                
                // Then create user feed
                const { error: userFeedError } = await supabase
                  .from('user_feeds')
                  .insert({
                    user_id: user.id,
                    feed_source_id: feedSourceId,
                    is_active: true
                  });
                
                if (userFeedError) {
                  console.error('Error creating user feed for existing source:', userFeedError);
                } else {
                  console.log(`Successfully linked existing feed: ${feedData.feed_name}`);
                }
              } else {
                console.error('Error creating feed source:', feedSourceError);
                continue;
              }
            } else {
              console.log(`Successfully created feed source: ${feedData.feed_name} (ID: ${feedSource.id})`);
              
              // Then create user feed
              const { error: userFeedError } = await supabase
                .from('user_feeds')
                .insert({
                  user_id: user.id,
                  feed_source_id: feedSource.id,
                  is_active: true
                });
              
              if (userFeedError) {
                console.error('Error creating user feed:', userFeedError);
              } else {
                console.log(`Successfully created user feed: ${feedData.feed_name}`);
              }
            }
          } catch (error) {
            console.error(`Error processing feed ${feedData.feed_name}:`, error);
          }
        }
        
        console.log('Feed creation process completed');
      } else {
        console.log('No feeds to add');
      }
      
      setLoading(false);
      console.log('Onboarding completed successfully');
      
      // Force a session refresh to trigger App.tsx re-render
      await supabase.auth.getSession();
      
      // Call the callback to refresh user data in App.tsx
      if (route.params?.onOnboardingComplete) {
        await route.params.onOnboardingComplete();
      }
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError('Failed to complete onboarding');
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Welcome
        return true;
      case 1: // Sample feeds
        return true; // Can always proceed, even with no selection
      case 2: // Custom feeds
        return true; // Can always proceed, even with no custom feeds
      case 3: // Notifications
        return timezone && notificationTime;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: theme.accent,
                width: `${((currentStep + 1) / steps.length) * 100}%`
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          Step {currentStep + 1} of {steps.length}
        </Text>
      </View>

      {/* Step content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 150 }}
        automaticallyAdjustKeyboardInsets={true}
      >
        {currentStep === 0 && <WelcomeStep />}
        {currentStep === 1 && <SampleFeedsStep />}
        {currentStep === 2 && (
          <>
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Add Your Own Feeds
              </Text>
              <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                Add RSS feeds, Reddit communities, or YouTube channels.
              </Text>
              
              <View style={styles.categoryContainer}>
                <Text style={[styles.categoryLabel, { color: theme.text }]}>Category:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['Technology', 'Business', 'News', 'Productivity', 'Science', 'Health', 'Finance', 'Entertainment'].map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        { backgroundColor: theme.pill },
                        newFeedCategory === category && { backgroundColor: theme.accent }
                      ]}
                      onPress={() => setNewFeedCategory(category)}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        { color: theme.pillText },
                        newFeedCategory === category && { color: theme.accentText }
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <View style={[styles.addFeedForm, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Feed URL</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e5e7eb',
                    color: '#000000' 
                  }]}
                  value={newFeedUrl}
                  onChangeText={setNewFeedUrl}
                  placeholder="https://reddit.com/r/programming"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Feed Name (Optional)</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e5e7eb',
                    color: '#000000' 
                  }]}
                  value={newFeedName}
                  onChangeText={setNewFeedName}
                  placeholder="Leave empty to auto-generate from URL"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Examples */}
              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Examples:</Text>
                <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                  • https://reddit.com/r/programming
                </Text>
                <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                  • https://www.youtube.com/@TechCrunch
                </Text>
                <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                  • https://techcrunch.com/feed/
                </Text>
              </View>
            </View>
          </>
        )}
        
        {currentStep === 3 && (
          <>
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Set Up Notifications
              </Text>
              <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                Choose when you want to receive your daily digest.
              </Text>
              
              <View style={[styles.notificationCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.notificationRow}>
                  <View style={styles.notificationInfo}>
                    <Ionicons name="notifications" size={24} color={theme.accent} />
                    <Text style={[styles.notificationTitle, { color: theme.text }]}>Daily Digest Notifications</Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: theme.border, true: theme.accent + '40' }}
                    thumbColor={notificationsEnabled ? theme.accent : theme.textMuted}
                  />
                </View>
              </View>
            </View>
            
            <View style={[styles.notificationCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.timeContainer}>
                <Text style={[styles.timeLabel, { color: theme.text }]}>Notification Time:</Text>
                <TextInput
                  style={[styles.timeInput, { backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#000000' }]}
                  value={notificationTime}
                  onChangeText={setNotificationTime}
                  placeholder="07:00"
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                  autoCorrect={false}
                  blurOnSubmit={false}
                  maxLength={5}
                />
              </View>
              
              <View style={styles.timezoneContainer}>
                <Text style={[styles.timeLabel, { color: theme.text }]}>Timezone:</Text>
                <TouchableOpacity
                  style={[styles.timezoneDropdown, { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}
                  onPress={() => setShowTimezonePicker(true)}
                >
                  <Text style={[styles.timezoneDisplay, { color: '#000000' }]}>
                    {timezone || 'Select timezone'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.navButton, styles.backButton, { borderColor: theme.border }]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
            <Text style={[styles.navButtonText, { color: theme.textSecondary }]}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.navButton, 
            styles.nextButton, 
            { backgroundColor: theme.accent },
            !canProceed() && { opacity: 0.5 }
          ]}
          onPress={handleNext}
          disabled={!canProceed() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.accentText} />
          ) : (
            <>
              <Text style={[styles.navButtonText, { color: theme.accentText }]}>
                {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={theme.accentText} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
        </View>
      ) : null}
      
      {/* Timezone Picker Modal */}
      {showTimezonePicker && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Timezone</Text>
              <TouchableOpacity onPress={() => setShowTimezonePicker(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.timezoneList}>
              {COMMON_TIMEZONES.map((tz) => (
                <TouchableOpacity
                  key={tz.name}
                  style={[
                    styles.timezoneOption,
                    { borderBottomColor: theme.border },
                    timezone === tz.name && { backgroundColor: theme.accent + '20' }
                  ]}
                  onPress={() => {
                    setTimezone(tz.name);
                    setShowTimezonePicker(false);
                  }}
                >
                  <Text style={[styles.timezoneOptionText, { color: theme.text }]}>
                    {tz.display}
                  </Text>
                  {timezone === tz.name && (
                    <Ionicons name="checkmark" size={20} color={theme.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  stepIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  featureList: {
    marginTop: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
  },
  packsContainer: {
    marginBottom: 20,
  },
  packCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  packHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packName: {
    fontSize: 18,
    fontWeight: '600',
  },
  packDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  packFeeds: {
    fontSize: 12,
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
  },
  skipButtonText: {
    fontSize: 14,
  },
  addFeedForm: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addedFeedsContainer: {
    marginTop: 20,
  },
  addedFeedsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  feedName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  feedUrl: {
    fontSize: 12,
    flex: 1,
  },
  feedCategory: {
    fontSize: 12,
    marginRight: 8,
  },
  notificationCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  timeContainer: {
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  timezoneContainer: {
    marginBottom: 16,
  },
  timezoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  timezoneDropdown: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timezoneDisplay: {
    fontSize: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  backButton: {
    borderWidth: 1,
  },
  nextButton: {
    flex: 1,
    marginLeft: 12,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  errorContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  timezoneList: {
    maxHeight: 300,
  },
  timezoneOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  timezoneOptionText: {
    fontSize: 16,
  },
  formGroup: {
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});

export default OnboardingScreen; 