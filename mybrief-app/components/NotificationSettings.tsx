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

interface NotificationSettingsProps {
  onPreferencesChange?: (preferences: NotificationPreferences) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onPreferencesChange }) => {
  const { theme } = useTheme();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    dailyDigest: true,
    digestTime: '07:00',
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
      
      // For demo mode, use default preferences
      const defaultPreferences: NotificationPreferences = {
        enabled: true,
        dailyDigest: true,
        digestTime: '07:00',
        timezone: 'UTC',
        soundEnabled: true,
        vibrationEnabled: true
      };
      setPreferences(defaultPreferences);
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
      setSaving(true);
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);

      // For demo mode, just update local state
      if (onPreferencesChange) {
        onPreferencesChange(newPreferences);
      }

      // Re-schedule notifications if time changed
      if (key === 'digestTime' || key === 'enabled' || key === 'dailyDigest') {
        await notificationService.scheduleDailyDigest();
      }
    } catch (error) {
      console.error('Error updating notification preference:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async () => {
    try {
      await notificationService.sendDailyDigestNotification(
        'This is a test notification to verify your settings are working correctly.'
      );
      Alert.alert('Test Notification', 'A test notification has been sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
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
          subtitle="Receive notifications for daily digests and updates"
          rightElement={
            <Switch
              value={preferences.enabled}
              onValueChange={(value) => updatePreference('enabled', value)}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={theme.background}
              disabled={!permissionsGranted}
            />
          }
        />

        <SettingItem
          icon="newspaper"
          title="Daily Digest Reminders"
          subtitle="Get notified when your daily digest is ready"
          rightElement={
            <Switch
              value={preferences.dailyDigest}
              onValueChange={(value) => updatePreference('dailyDigest', value)}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={theme.background}
              disabled={!permissionsGranted || !preferences.enabled}
            />
          }
        />

        <SettingItem
          icon="time"
          title="Digest Time"
          subtitle={`Daily digest at ${preferences.digestTime}`}
          rightElement={
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          }
          onPress={() => {
            // Could open time picker here
            Alert.alert('Digest Time', 'Use the form below to change notification time');
          }}
        />

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.text }]}>
            Notification Time (24h format)
          </Text>
          <TextInput
            style={[styles.formInput, { 
              backgroundColor: theme.background, 
              borderColor: theme.border,
              color: theme.text 
            }]}
            placeholder="07:00"
            placeholderTextColor={theme.textMuted}
            value={preferences.digestTime}
            onChangeText={(value) => updatePreference('digestTime', value)}
            editable={permissionsGranted && preferences.enabled}
          />
        </View>

        <SettingItem
          icon="volume-high"
          title="Sound"
          subtitle="Play sound for notifications"
          rightElement={
            <Switch
              value={preferences.soundEnabled}
              onValueChange={(value) => updatePreference('soundEnabled', value)}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={theme.background}
              disabled={!permissionsGranted || !preferences.enabled}
            />
          }
        />

        <SettingItem
          icon="phone-portrait"
          title="Vibration"
          subtitle="Vibrate for notifications"
          rightElement={
            <Switch
              value={preferences.vibrationEnabled}
              onValueChange={(value) => updatePreference('vibrationEnabled', value)}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={theme.background}
              disabled={!permissionsGranted || !preferences.enabled}
            />
          }
        />
      </View>

      {/* Test Section */}
      <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <SettingItem
          icon="send"
          title="Test Notification"
          subtitle="Send a test notification to verify settings"
          rightElement={
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          }
          onPress={testNotification}
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
});

export default NotificationSettings; 