import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { notificationService, NotificationPreferences } from '../lib/notificationService';
import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';

interface NotificationSettingsProps {
  onPreferencesChange?: (preferences: NotificationPreferences) => void;
}

// Common timezones for easier selection
const COMMON_TIMEZONES = [
  { name: 'South Africa (SAST)', value: 'Africa/Johannesburg' },
  { name: 'UTC', value: 'UTC' },
  { name: 'Eastern Time (EST/EDT)', value: 'America/New_York' },
  { name: 'Central Time (CST/CDT)', value: 'America/Chicago' },
  { name: 'Mountain Time (MST/MDT)', value: 'America/Denver' },
  { name: 'Pacific Time (PST/PDT)', value: 'America/Los_Angeles' },
  { name: 'London (GMT/BST)', value: 'Europe/London' },
  { name: 'Paris (CET/CEST)', value: 'Europe/Paris' },
  { name: 'Berlin (CET/CEST)', value: 'Europe/Berlin' },
  { name: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { name: 'Sydney (AEST/AEDT)', value: 'Australia/Sydney' },
];

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onPreferencesChange }) => {
  const { theme } = useTheme();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    dailyDigest: true,
    digestTime: '',
    timezone: 'UTC',
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkPermissions();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userPreferences = await notificationService.getNotificationPreferences(user.id);
        setPreferences(userPreferences);
      } else {
        // For demo mode, use default preferences with device timezone
        const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const defaultPreferences: NotificationPreferences = {
          enabled: true,
          dailyDigest: true,
          digestTime: '07:00',
          timezone: deviceTimezone,
          soundEnabled: true,
          vibrationEnabled: true
        };
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    const granted = await notificationService.areNotificationsEnabled();
    setPermissionsGranted(granted);
  };

  const requestPermissions = async () => {
    const granted = await notificationService.requestPermissions();
    setPermissionsGranted(granted);
    
    if (granted) {
      await notificationService.initialize();
    } else {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive daily digest reminders.',
        [{ text: 'OK' }]
      );
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: any) => {
    try {
      console.log('Updating preference:', key, value);
      
      // Always update local state immediately
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);

      setSaving(true);

      // Save to database if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await notificationService.updateNotificationPreferences(user.id, newPreferences);
      }

      // Schedule notifications when enabling or when time is set
      if (key === 'enabled' || key === 'dailyDigest' || key === 'digestTime') {
        console.log('Scheduling daily digest after preference change');
        await notificationService.scheduleDailyDigest();
      }
    } catch (error) {
      console.error('Error updating notification preference:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const showTimezonePicker = () => {
    const options = COMMON_TIMEZONES.map(tz => ({
      text: tz.name,
      onPress: () => updatePreference('timezone', tz.value)
    }));

    Alert.alert(
      'Select Timezone',
      'Choose your timezone:',
      [
        ...options,
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    rightElement,
    onPress 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { borderBottomColor: theme.border },
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading notification settings...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Permissions Section */}
      <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <SettingItem
          icon="notifications"
          title="Push Notifications"
          subtitle={permissionsGranted ? 'Enabled' : 'Disabled'}
          rightElement={
            <View style={styles.permissionStatus}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: permissionsGranted ? '#10b981' : '#ef4444' }
              ]} />
              <Text style={[
                styles.statusText, 
                { color: permissionsGranted ? '#10b981' : '#ef4444' }
              ]}>
                {permissionsGranted ? 'Granted' : 'Not Granted'}
              </Text>
            </View>
          }
          onPress={!permissionsGranted ? requestPermissions : undefined}
        />
      </View>

      {/* Notification Preferences */}
      <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <SettingItem
          icon="toggle"
          title="Enable Notifications"
          subtitle="Receive notifications for daily digests"
          rightElement={
            <Switch
              value={preferences.enabled}
              onValueChange={(value) => updatePreference('enabled', value)}
              trackColor={{ false: '#6b7280', true: '#3b82f6' }}
              thumbColor={preferences.enabled ? '#ffffff' : '#ffffff'}
              disabled={!permissionsGranted}
            />
          }
        />

        <SettingItem
          icon="newspaper"
          title="Daily Digest"
          subtitle="Get notified when your daily digest is ready"
          rightElement={
            <Switch
              value={preferences.dailyDigest}
              onValueChange={(value) => updatePreference('dailyDigest', value)}
              trackColor={{ false: '#6b7280', true: '#3b82f6' }}
              thumbColor={preferences.dailyDigest ? '#ffffff' : '#ffffff'}
              disabled={!permissionsGranted || !preferences.enabled}
            />
          }
        />

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.text }]}>
            Notification Time
          </Text>
          <TextInput
            style={[styles.formInput, { 
              backgroundColor: theme.background, 
              borderColor: theme.border,
              color: theme.text 
            }]}
            placeholder="07:00"
            placeholderTextColor={theme.textMuted}
            value={preferences.digestTime || ''}
            onChangeText={(value) => {
              console.log('Time input changed:', value);
              // Allow empty value and any input
              setPreferences(prev => ({ ...prev, digestTime: value }));
            }}
            editable={true}
            maxLength={5}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          <TouchableOpacity
            style={[styles.formButton, { backgroundColor: theme.accent }]}
            onPress={() => {
              console.log('Saving time:', preferences.digestTime);
              updatePreference('digestTime', preferences.digestTime);
            }}
            disabled={saving}
          >
            <Text style={[styles.formButtonText, { color: theme.accentText }]}>
              {saving ? 'Saving...' : 'Save Time'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.formHelp, { color: theme.textMuted }]}>
            Format: HH:MM (24h) • Timezone: {preferences.timezone}
          </Text>
        </View>

        <SettingItem
          icon="globe"
          title="Timezone"
          subtitle={preferences.timezone}
          rightElement={
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          }
          onPress={showTimezonePicker}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
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
  },
  formButton: {
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  formButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formHelp: {
    marginTop: 4,
    fontSize: 12,
  },
});

export default NotificationSettings; 