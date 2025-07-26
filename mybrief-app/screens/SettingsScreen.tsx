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

interface UserProfile {
  id: string;
  email: string;
  timezone: string;
  digest_time: string;
  display_mode: 'minimal' | 'rich';
  onboarding_completed: boolean;
  created_at: string;
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
  const [timezone, setTimezone] = useState('');
  const [notificationTime, setNotificationTime] = useState('');
  const [displayMode, setDisplayMode] = useState<'minimal' | 'rich'>('minimal');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Mock data for demo purposes
      const mockProfile: UserProfile = {
        id: 'demo-user',
        email: 'demo@example.com',
        timezone: 'UTC',
        digest_time: '07:00',
        display_mode: 'minimal',
        onboarding_completed: true,
        created_at: new Date().toISOString(),
      };

      setProfile(mockProfile);
      setTimezone(mockProfile.timezone);
      setNotificationTime(mockProfile.digest_time);
      setDisplayMode(mockProfile.display_mode);
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
          timezone,
          digest_time: notificationTime,
          display_mode: displayMode,
        })
        .eq('id', profile.id);

      if (error) {
        setError(error.message);
      } else {
        setProfile(prev => prev ? {
          ...prev,
          timezone,
          digest_time: notificationTime,
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
    if (!newEmail.trim()) return;

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
      }
    } catch (error) {
      console.error('Error updating email:', error);
      setError('Failed to update email');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
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
      setError('Failed to update password');
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

              // Delete the auth user
              const { error } = await supabase.auth.admin.deleteUser(profile?.id || '');
              if (error) {
                console.error('Error deleting account:', error);
                Alert.alert('Error', 'Failed to delete account');
              } else {
                navigation.navigate('SignIn');
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
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
    showBorder = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showBorder?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { borderBottomColor: theme.border },
        showBorder && { borderBottomWidth: 1 },
        onPress && { backgroundColor: theme.hover }
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleSaveProfile} disabled={saving}>
            <Text style={[styles.saveButton, { color: saving ? theme.textMuted : theme.accent }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
            title="Email"
            subtitle={profile?.email}
            rightElement={
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            }
            onPress={() => {
              // Could open email change modal
              Alert.alert('Email', 'Use the form below to change your email');
            }}
          />
          
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.text }]}>New Email</Text>
            <TextInput
              style={[styles.formInput, { 
                backgroundColor: theme.background, 
                borderColor: theme.border,
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
              style={[styles.formButton, { backgroundColor: theme.accent }]}
              onPress={handleEmailChange}
              disabled={saving || !newEmail.trim()}
            >
              <Text style={[styles.formButtonText, { color: theme.accentText }]}>
                Update Email
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.text }]}>New Password</Text>
            <TextInput
              style={[styles.formInput, { 
                backgroundColor: theme.background, 
                borderColor: theme.border,
                color: theme.text 
              }]}
              placeholder="Enter new password"
              placeholderTextColor={theme.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.formButton, { backgroundColor: theme.accent }]}
              onPress={handlePasswordChange}
              disabled={saving || !newPassword.trim()}
            >
              <Text style={[styles.formButtonText, { color: theme.accentText }]}>
                Update Password
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <SectionHeader title="Preferences" />
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <SettingItem
            icon="time"
            title="Notification Time"
            subtitle={`Daily digest at ${notificationTime}`}
            rightElement={
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            }
            onPress={() => {
              // Could open time picker
              Alert.alert('Notification Time', 'Use the form below to change notification time');
            }}
          />

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.text }]}>Notification Time (24h format)</Text>
            <TextInput
              style={[styles.formInput, { 
                backgroundColor: theme.background, 
                borderColor: theme.border,
                color: theme.text 
              }]}
              placeholder="07:00"
              placeholderTextColor={theme.textMuted}
              value={notificationTime}
              onChangeText={setNotificationTime}
            />
          </View>

          <SettingItem
            icon="globe"
            title="Timezone"
            subtitle={timezone}
            rightElement={
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            }
            onPress={() => {
              // Could open timezone picker
              Alert.alert('Timezone', 'Use the form below to change timezone');
            }}
          />

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.text }]}>Timezone</Text>
            <TextInput
              style={[styles.formInput, { 
                backgroundColor: theme.background, 
                borderColor: theme.border,
                color: theme.text 
              }]}
              placeholder="UTC"
              placeholderTextColor={theme.textMuted}
              value={timezone}
              onChangeText={setTimezone}
            />
          </View>

          <SettingItem
            icon="eye"
            title="Display Mode"
            subtitle={displayMode === 'minimal' ? 'Minimal (text-only)' : 'Rich (with images)'}
            rightElement={
              <Switch
                value={displayMode === 'minimal'}
                onValueChange={(value) => setDisplayMode(value ? 'minimal' : 'rich')}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={theme.background}
              />
            }
          />

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

        {/* Account Actions Section */}
        <SectionHeader title="Account Actions" />
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <SettingItem
            icon="log-out"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleSignOut}
            rightElement={
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            }
          />

          <SettingItem
            icon="trash"
            title="Delete Account"
            subtitle="Permanently delete your account and all data"
            onPress={handleDeleteAccount}
            rightElement={
              <Ionicons name="chevron-forward" size={16} color="#ef4444" />
            }
            showBorder={false}
          />
        </View>

        {/* Notifications Section */}
        <SectionHeader title="Notifications" />
        <NotificationSettings />

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
          style={styles.navButton}
          onPress={() => navigation.navigate('SavedArticles')}
        >
          <Ionicons name="bookmark" size={20} color={theme.textSecondary} />
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Saved</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings" size={20} color={theme.accentText} />
          <Text style={[styles.navText, { color: theme.accentText }]}>Settings</Text>
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
    borderTopColor: '#e5e7eb',
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

export default SettingsScreen; 