import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import NotificationSettings from '../components/NotificationSettings';
import SharedLayout from '../components/SharedLayout';

interface UserProfile {
  id: string;
  email: string;
  timezone: string;
  digest_time: string;
  display_mode: 'minimal' | 'rich';
  onboarding_completed: boolean;
  created_at: string;
  feed_config?: {
    articles_per_feed?: number;
    total_articles?: number;
    time_window_hours?: number;
    use_time_window?: boolean;
  };
}

const SettingsScreen = ({ navigation }: any) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [displayMode, setDisplayMode] = useState<'minimal' | 'rich'>('minimal');
  
  // Accordion states
  const [accountExpanded, setAccountExpanded] = useState(false);
  
  // Feed configuration states
  const [articlesPerFeed, setArticlesPerFeed] = useState('10');
  const [totalArticles, setTotalArticles] = useState('50');
  const [timeWindowHours, setTimeWindowHours] = useState('24');
  const [useTimeWindow, setUseTimeWindow] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user:', userError);
        setError('Failed to load user profile');
        return;
      }

      // Get user profile data from the users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading user profile:', profileError);
        setError('Failed to load user profile');
        return;
      }

      // Create profile object with real user data
      const profile: UserProfile = {
        id: user.id,
        email: user.email || 'No email',
        timezone: userProfile?.timezone || 'UTC',
        digest_time: userProfile?.digest_time || '07:00',
        display_mode: userProfile?.display_mode || 'minimal',
        onboarding_completed: userProfile?.onboarding_completed || false,
        created_at: user.created_at || new Date().toISOString(),
        feed_config: {
          articles_per_feed: userProfile?.feed_config?.articles_per_feed || 10,
          total_articles: userProfile?.feed_config?.total_articles || 50,
          time_window_hours: userProfile?.feed_config?.time_window_hours || 24,
          use_time_window: userProfile?.feed_config?.use_time_window || false,
        },
      };

      setProfile(profile);
      setDisplayMode(profile.display_mode);
      
      // Set feed configuration
      setArticlesPerFeed(profile.feed_config?.articles_per_feed?.toString() || '10');
      setTotalArticles(profile.feed_config?.total_articles?.toString() || '50');
      setTimeWindowHours(profile.feed_config?.time_window_hours?.toString() || '24');
      setUseTimeWindow(profile.feed_config?.use_time_window || false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          // timezone, // Removed as per edit hint
          // digest_time: notificationTime, // Removed as per edit hint
          display_mode: displayMode,
          feed_config: {
            articles_per_feed: parseInt(articlesPerFeed) || 10,
            total_articles: parseInt(totalArticles) || 50,
            time_window_hours: parseInt(timeWindowHours) || 24,
            use_time_window: useTimeWindow,
          },
        })
        .eq('id', profile.id);

      if (error) {
        setError(error.message);
      } else {
        setProfile(prev => prev ? {
          ...prev,
          // timezone, // Removed as per edit hint
          // digest_time: notificationTime, // Removed as per edit hint
          display_mode: displayMode,
        } : null);
        setSuccess('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) {
      setError('Please enter a new email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Email update requested! Check your inbox for confirmation.');
        setNewEmail('');
        // Refresh profile to show updated email
        await loadProfile();
      }
    } catch (error) {
      console.error('Error updating email:', error);
      setError('Failed to update email. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password updated successfully!');
        setNewPassword('');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Failed to update password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                console.error('Error signing out:', error);
                Alert.alert('Error', 'Failed to sign out');
              } else {
                console.log('Successfully signed out');
                // Navigation will be handled automatically by App.tsx auth state change listener
              }
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete user data first
              if (profile) {
                await supabase.from('users').delete().eq('id', profile.id);
                await supabase.from('user_feeds').delete().eq('user_id', profile.id);
                await supabase.from('saved_articles').delete().eq('user_id', profile.id);
                await supabase.from('daily_digests').delete().eq('user_id', profile.id);
              }

              // Sign out the user
              const { error } = await supabase.auth.signOut();
              if (error) {
                console.error('Error signing out:', error);
                Alert.alert('Error', 'Failed to sign out after data deletion');
              } else {
                Alert.alert(
                  'Account Deleted',
                  'Your data has been deleted and you have been signed out. The account will be fully removed within 24 hours.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account data');
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement,
    showBorder = true,
    variant = 'default'
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showBorder?: boolean;
    variant?: 'default' | 'heading';
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { borderBottomColor: theme.border },
        showBorder && { borderBottomWidth: 1 },
        onPress && variant === 'heading' && { backgroundColor: theme.hover }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={20} color={theme.textSecondary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && (
        <View style={styles.settingRight}>
          {rightElement}
        </View>
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {title}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SharedLayout
      navigation={navigation}
      currentScreen="settings"
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Error/Success Messages */}
        {error ? (
          <View style={[styles.messageContainer, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}>
            <Ionicons name="alert-circle" size={16} color="#dc2626" />
            <Text style={[styles.messageText, { color: '#dc2626' }]}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={[styles.messageContainer, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
            <Text style={[styles.messageText, { color: '#16a34a' }]}>{success}</Text>
          </View>
        ) : null}

        {/* Account Section */}
        <SectionHeader title="Account" />
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <SettingItem
            icon="person"
            title="My Account"
            subtitle={profile?.email}
            onPress={() => setAccountExpanded(!accountExpanded)}
            variant="heading"
            rightElement={
              <Ionicons 
                name={accountExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={theme.textMuted} 
              />
            }
          />
          
          {accountExpanded && (
            <View style={[styles.accordionContent, { 
              borderTopColor: theme.border,
              backgroundColor: theme.background 
            }]}>
              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>New Email</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: theme.cardBg, 
                    borderColor: newEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) ? '#16a34a' : theme.border,
                    color: theme.text 
                  }]}
                  placeholder="Enter new email"
                  placeholderTextColor={theme.textMuted}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity
                  style={[styles.formButton, { 
                    backgroundColor: newEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) ? theme.accent : theme.border,
                    opacity: newEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) ? 1 : 0.5
                  }]}
                  onPress={handleEmailChange}
                  disabled={saving || !newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)}
                >
                  <Text style={[styles.formButtonText, { 
                    color: newEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) ? 
                      theme.accentText : theme.textMuted 
                  }]}>
                    {saving ? 'Updating...' : 'Update Email'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>New Password</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: theme.cardBg, 
                    borderColor: newPassword.length >= 6 ? '#16a34a' : theme.border,
                    color: theme.text 
                  }]}
                  placeholder="Enter new password (min 6 characters)"
                  placeholderTextColor={theme.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={[styles.formButton, { 
                    backgroundColor: newPassword.length >= 6 ? theme.accent : theme.border,
                    opacity: newPassword.length >= 6 ? 1 : 0.5
                  }]}
                  onPress={handlePasswordChange}
                  disabled={saving || !newPassword.trim() || newPassword.length < 6}
                >
                  <Text style={[styles.formButtonText, { 
                    color: newPassword.length >= 6 ? 
                      theme.accentText : theme.textMuted 
                  }]}>
                    {saving ? 'Updating...' : 'Update Password'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <SettingItem
            icon="log-out"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleSignOut}
          />

          <SettingItem
            icon="trash"
            title="Delete Account"
            subtitle="Permanently delete your account and all data"
            onPress={handleDeleteAccount}
            showBorder={false}
          />
        </View>

        {/* Preferences Section */}
        <SectionHeader title="Preferences" />
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <SettingItem
            icon={isDarkMode ? 'sunny' : 'moon'}
            title="Theme"
            subtitle={isDarkMode ? 'Dark Mode' : 'Light Mode'}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={theme.background}
              />
            }
          />
        </View>

        {/* Notifications Section */}
        <SectionHeader title="Notifications" />
        <NotificationSettings />

        {/* Feed Configuration Section */}
        <SectionHeader title="Feed Configuration" />
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <SettingItem
            icon="newspaper"
            title="Use Time Window"
            subtitle={useTimeWindow ? `Last ${timeWindowHours} hours` : 'Use article limits'}
            rightElement={
              <Switch
                value={useTimeWindow}
                onValueChange={setUseTimeWindow}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={theme.background}
              />
            }
          />

          {useTimeWindow ? (
            <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Time Window (hours)</Text>
              <TextInput
                style={[styles.formInput, { 
                  backgroundColor: theme.background, 
                  borderColor: theme.border,
                  color: theme.text 
                }]}
                placeholder="24"
                placeholderTextColor={theme.textMuted}
                value={timeWindowHours}
                onChangeText={setTimeWindowHours}
                keyboardType="numeric"
              />
              <Text style={[styles.formHelpText, { color: theme.textMuted }]}>
                Show all articles from the last X hours
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Articles per Feed</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: theme.background, 
                    borderColor: theme.border,
                    color: theme.text 
                  }]}
                  placeholder="10"
                  placeholderTextColor={theme.textMuted}
                  value={articlesPerFeed}
                  onChangeText={setArticlesPerFeed}
                  keyboardType="numeric"
                />
                <Text style={[styles.formHelpText, { color: theme.textMuted }]}>
                  Maximum articles to fetch from each feed source
                </Text>
              </View>

              <View style={[styles.formGroup, { borderTopColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Total Articles Limit</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: theme.background, 
                    borderColor: theme.border,
                    color: theme.text 
                  }]}
                  placeholder="50"
                  placeholderTextColor={theme.textMuted}
                  value={totalArticles}
                  onChangeText={setTotalArticles}
                  keyboardType="numeric"
                />
                <Text style={[styles.formHelpText, { color: theme.textMuted }]}>
                  Maximum total articles in your daily digest
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Data & Privacy Section */}
        <SectionHeader title="Data & Privacy" />
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <SettingItem
            icon="download"
            title="Export Data"
            subtitle="Download your saved articles and preferences"
            rightElement={
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            }
            onPress={() => {
              Alert.alert('Export Data', 'This feature will be available soon');
            }}
          />

          <SettingItem
            icon="trash"
            title="Clear All Data"
            subtitle="Delete all your saved articles and preferences"
            rightElement={
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            }
            onPress={() => {
              Alert.alert(
                'Clear All Data',
                'This will permanently delete all your saved articles and preferences. This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        if (profile) {
                          await supabase.from('saved_articles').delete().eq('user_id', profile.id);
                          await supabase.from('daily_digests').delete().eq('user_id', profile.id);
                          setSuccess('All data cleared successfully!');
                        }
                      } catch (error) {
                        console.error('Error clearing data:', error);
                        setError('Failed to clear data');
                      }
                    },
                  },
                ]
              );
            }}
          />
        </View>

        {/* App Info Section */}
        <SectionHeader title="App Info" />
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <SettingItem
            icon="information-circle"
            title="Version"
            subtitle="1.0.0"
            showBorder={false}
          />
        </View>
      </ScrollView>
    </SharedLayout>
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
  headerButton: {
    padding: 8,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  messageText: {
    marginLeft: 8,
    fontSize: 14,
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
  section: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 8,
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
  formHelpText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  accordionContent: {
    paddingTop: 12,
    paddingBottom: 16,
  },
});

export default SettingsScreen; 