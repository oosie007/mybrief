import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import * as Localization from 'expo-localization';

const templatePacks = [
  { id: 'tech', name: 'Tech Entrepreneur', description: 'Startup news, tech trends, business insights' },
  { id: 'adhd', name: 'ADHD Focus', description: 'Productivity tips, focus techniques, ND-friendly content' },
  { id: 'dev', name: 'Developer Daily', description: 'Programming tutorials, tech news, developer discussions' },
];

const getDefaultTimezone = () => 'UTC';

const OnboardingScreen = ({ navigation }: any) => {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [timezone, setTimezone] = useState(getDefaultTimezone());
  const [notificationTime, setNotificationTime] = useState('07:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      
      // First, check if user record exists, if not create it
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist, create the record
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            timezone,
            digest_time: notificationTime,
            onboarding_completed: true,
            created_at: new Date().toISOString(),
          });
        
        if (insertError) {
          setError(`Failed to create user: ${insertError.message}`);
          setLoading(false);
          return;
        }
      } else if (fetchError) {
        setError(`Failed to check user: ${fetchError.message}`);
        setLoading(false);
        return;
      } else {
        // User exists, update the record
        const { error: updateError } = await supabase
          .from('users')
          .update({
            timezone,
            digest_time: notificationTime,
            onboarding_completed: true,
          })
          .eq('id', user.id);
        
        if (updateError) {
          setError(`Failed to update user: ${updateError.message}`);
          setLoading(false);
          return;
        }
      }
      
      setLoading(false);
      console.log('Onboarding completed successfully');
      
      // Force a session refresh to trigger navigation
      await supabase.auth.getSession();
      
      // Manually navigate to Home after a short delay
      setTimeout(() => {
        if (navigation && navigation.navigate) {
          navigation.navigate('Home');
        }
      }, 1000);
      
    } catch (error) {
      setError('Failed to complete onboarding');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to mybrief!</Text>
      <Text style={styles.subtitle}>Choose a template pack to get started:</Text>
      <FlatList
        data={templatePacks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.pack, selectedPack === item.id && styles.selectedPack]}
            onPress={() => setSelectedPack(item.id)}
          >
            <Text style={styles.packName}>{item.name}</Text>
            <Text style={styles.packDesc}>{item.description}</Text>
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 24 }}
      />
      <Text style={styles.subtitle}>Your Timezone</Text>
      <TextInput
        style={styles.input}
        value={timezone}
        onChangeText={setTimezone}
        placeholder="Timezone (e.g. UTC, Europe/Berlin)"
      />
      <Text style={styles.subtitle}>Notification Time</Text>
      <TextInput
        style={styles.input}
        value={notificationTime}
        onChangeText={setNotificationTime}
        placeholder="07:00"
        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        title={loading ? 'Saving...' : 'Complete Onboarding'}
        onPress={handleComplete}
        disabled={loading || !selectedPack || !timezone || !notificationTime}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  pack: { padding: 16, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginRight: 12, backgroundColor: '#fff' },
  selectedPack: { borderColor: '#007AFF', backgroundColor: '#e6f0ff' },
  packName: { fontWeight: 'bold', fontSize: 16 },
  packDesc: { fontSize: 14, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, marginBottom: 16 },
  error: { color: 'red', marginBottom: 12 },
});

export default OnboardingScreen; 