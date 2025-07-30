import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  enabled: boolean;
  dailyDigest: boolean;
  digestTime: string; // Format: "HH:MM"
  timezone: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface NotificationData {
  type: 'daily_digest' | 'new_content' | 'reminder' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private isInitialized: boolean = false;

  /**
   * Get device timezone
   */
  private getDeviceTimezone(): string {
    try {
      // Try multiple methods to get timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone && timezone !== 'UTC') {
        return timezone;
      }
      
      // Fallback: calculate timezone offset
      const offset = new Date().getTimezoneOffset();
      const hours = Math.abs(Math.floor(offset / 60));
      const minutes = Math.abs(offset % 60);
      const sign = offset <= 0 ? '+' : '-';
      
      return `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error getting timezone:', error);
      return 'UTC';
    }
  }

  /**
   * Convert time from user's timezone to device timezone for notifications
   */
  private convertTimeToUserTimezone(hours: number, minutes: number, userTimezone: string): { hours: number; minutes: number } {
    try {
      // Create a date object in the user's timezone
      const userDate = new Date();
      const userTimeString = `${userDate.getFullYear()}-${String(userDate.getMonth() + 1).padStart(2, '0')}-${String(userDate.getDate()).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      
      // Create the date in user's timezone
      const userDateTime = new Date(userTimeString + ' ' + userTimezone);
      
      // Convert to device timezone
      const deviceTimezone = this.getDeviceTimezone();
      const deviceDate = new Date(userDateTime.toLocaleString('en-US', { timeZone: deviceTimezone }));
      
      return {
        hours: deviceDate.getHours(),
        minutes: deviceDate.getMinutes()
      };
    } catch (error) {
      console.error('Error converting timezone:', error);
      // Fallback to original time
      return { hours, minutes };
    }
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Notification service already initialized');
      return;
    }

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }

      // Get push token
      if (Device.isDevice) {
        try {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id',
          });
          this.expoPushToken = token.data;
          console.log('Expo push token:', this.expoPushToken);
          
          // Save push token to database
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('users')
              .update({ expo_push_token: this.expoPushToken })
              .eq('id', user.id);
          }
        } catch (error) {
          console.log('Could not get push token (this is normal in development):', (error as Error).message);
        }
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupNotificationListeners(): void {
    // Listen for incoming notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for notification responses (when user taps notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification response
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    if (data?.type === 'daily_digest') {
      // Navigate to digest screen
      console.log('Navigate to daily digest');
      // This will be handled by the app's navigation system
      // The app should listen for this and navigate accordingly
    }
  }

  /**
   * Get user's notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('notification_enabled, digest_time, timezone')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching notification preferences:', error);
        return this.getDefaultPreferences();
      }

      // Get device timezone as fallback
      const deviceTimezone = this.getDeviceTimezone();

      return {
        enabled: data?.notification_enabled ?? true,
        dailyDigest: data?.notification_enabled ?? true,
        digestTime: data?.digest_time ?? '07:00',
        timezone: data?.timezone ?? deviceTimezone,
        soundEnabled: true,
        vibrationEnabled: true,
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          notification_enabled: preferences.enabled,
          digest_time: preferences.digestTime,
          timezone: preferences.timezone,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating notification preferences:', error);
        throw error;
      }

      // Re-schedule if notifications are enabled/disabled or time changed
      if (preferences.enabled !== undefined || preferences.dailyDigest !== undefined || preferences.digestTime !== undefined) {
        console.log('Re-scheduling daily digest after preference update');
        await this.scheduleDailyDigest();
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Schedule daily digest notification
   */
  async scheduleDailyDigest(): Promise<void> {
    try {
      console.log('Starting daily digest scheduling...');
      
      // Cancel existing daily digest notifications
      await Notifications.cancelScheduledNotificationAsync('daily-digest');
      console.log('Cancelled existing daily digest notifications');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, skipping daily digest scheduling');
        return;
      }

      const preferences = await this.getNotificationPreferences(user.id);
      console.log('User preferences:', preferences);
      
      if (!preferences.enabled || !preferences.dailyDigest) {
        console.log('Notifications disabled or daily digest disabled, skipping scheduling');
        return;
      }

      // Parse digest time
      const [hours, minutes] = preferences.digestTime.split(':').map(Number);
      console.log(`Parsed time: ${hours}:${minutes} in timezone: ${preferences.timezone}`);
      
      // Convert time to user's timezone
      const userTime = this.convertTimeToUserTimezone(hours, minutes, preferences.timezone);
      console.log(`Converted to user timezone: ${userTime.hours}:${userTime.minutes}`);
      
      // Create notification trigger for daily scheduling
      const trigger = {
        type: 'daily',
        hour: userTime.hours,
        minute: userTime.minutes,
        repeats: true,
      } as Notifications.NotificationTriggerInput;

      console.log('Notification trigger:', trigger);

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: 'daily-digest',
        content: {
          title: 'Your Daily Digest is Ready! 📰',
          body: 'Stay informed with today\'s curated content from your favorite sources.',
          data: { type: 'daily_digest' },
          sound: preferences.soundEnabled ? 'default' : undefined,
        },
        trigger,
      });

      console.log(`Daily digest scheduled with ID: ${notificationId} for ${preferences.digestTime} (${preferences.timezone})`);
      
      // Verify it was scheduled
      const isScheduled = await this.isDailyDigestScheduled();
      console.log('Daily digest is scheduled:', isScheduled);
      
      // Show all scheduled notifications for debugging
      const allScheduled = await this.getScheduledNotifications();
      console.log('All scheduled notifications:', allScheduled);
    } catch (error) {
      console.error('Error scheduling daily digest:', error);
    }
  }

  /**
   * Send immediate notification
   */
  async sendNotification(notification: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || { type: notification.type },
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send daily digest notification
   */
  async sendDailyDigestNotification(digestSummary: string): Promise<void> {
    const notification: NotificationData = {
      type: 'daily_digest',
      title: 'Your Daily Digest is Ready! 📰',
      body: digestSummary,
      data: { type: 'daily_digest' },
    };

    await this.sendNotification(notification);
  }

  /**
   * Send new content notification
   */
  async sendNewContentNotification(contentCount: number): Promise<void> {
    const notification: NotificationData = {
      type: 'new_content',
      title: 'New Content Available! 🆕',
      body: `${contentCount} new articles have been added to your digest.`,
      data: { type: 'new_content', count: contentCount },
    };

    await this.sendNotification(notification);
  }

  /**
   * Send reminder notification
   */
  async sendReminderNotification(): Promise<void> {
    const notification: NotificationData = {
      type: 'reminder',
      title: 'Don\'t Miss Your Daily Brief! ⏰',
      body: 'Your personalized digest is waiting for you.',
      data: { type: 'reminder' },
    };

    await this.sendNotification(notification);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Check if daily digest is scheduled
   */
  async isDailyDigestScheduled(): Promise<boolean> {
    try {
      const scheduledNotifications = await this.getScheduledNotifications();
      return scheduledNotifications.some(notification => 
        notification.identifier === 'daily-digest'
      );
    } catch (error) {
      console.error('Error checking daily digest schedule:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      dailyDigest: true,
      digestTime: '07:00',
      timezone: this.getDeviceTimezone(),
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  /**
   * Clean up notification listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Get expo push token
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

// Export singleton instance
export const notificationService = new NotificationService(); 