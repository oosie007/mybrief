import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { supabase } from './lib/supabase';
import { notificationService } from './lib/notificationService';
import { useTheme } from './lib/theme';
import { loadFonts } from './lib/fonts';

// Import screens
import SignInScreen from './screens/SignInScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DigestScreen from './screens/DigestScreen';
import FeedManagementScreen from './screens/FeedManagementScreen';
import SavedArticlesScreen from './screens/SavedArticlesScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  const refreshUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();
        
        setOnboardingCompleted(userData?.onboarding_completed ?? false);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Handle notification responses
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      
      if (data?.type === 'daily_digest') {
        console.log('Notification tapped - navigating to Home');
        // Navigate to the main feeds page
        if (navigationRef.current && user && onboardingCompleted) {
          navigationRef.current.navigate('Home');
        }
      }
    });

    return () => subscription.remove();
  }, [user, onboardingCompleted]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load fonts
        await loadFonts();
        
        // Initialize notification service
        notificationService.initialize();

        // Check authentication state
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
          setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            setUser(session?.user ?? null);
            
            if (session?.user) {
              // Check if onboarding is completed
              const { data: userData } = await supabase
                .from('users')
                .select('onboarding_completed')
                .eq('id', session.user.id)
                .single();
              
              setOnboardingCompleted(userData?.onboarding_completed ?? false);
              
              // If onboarding was just completed, force a re-check after a short delay
              if (userData?.onboarding_completed && !onboardingCompleted) {
                setTimeout(async () => {
                  const { data: refreshedUserData } = await supabase
                    .from('users')
                    .select('onboarding_completed')
                    .eq('id', session.user.id)
                    .single();
                  setOnboardingCompleted(refreshedUserData?.onboarding_completed ?? false);
                }, 500);
              }
            } else {
              setOnboardingCompleted(false);
            }
            
            setLoading(false);
          }
        );

        return () => {
          subscription.unsubscribe();
          notificationService.cleanup();
        };
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          <Stack.Screen name="SignIn" component={SignInScreen} />
        ) : !onboardingCompleted ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={DigestScreen} />
            <Stack.Screen name="FeedManagement" component={FeedManagementScreen} />
            <Stack.Screen name="SavedArticles" component={SavedArticlesScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
