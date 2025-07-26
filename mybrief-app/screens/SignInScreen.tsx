import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';

const SignInScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Check your email for the confirmation link!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        Alert.alert('Error', error.message);
      }
      // Navigation will be handled by the auth state change listener in App.tsx
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {isSignUp ? 'Create Account' : 'Sign In / Sign Up'}
      </Text>
      
      <TextInput
        style={[styles.input, { 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border, 
          color: theme.text 
        }]}
        placeholder="Email"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      
      <TextInput
        style={[styles.input, { 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border, 
          color: theme.text 
        }]}
        placeholder="Password"
        placeholderTextColor={theme.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      <Text style={[styles.note, { color: theme.textMuted }]}>
        Demo mode - any email/password will work
      </Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
      ) : (
        <>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.accent }]} 
            onPress={isSignUp ? handleSignUp : handleSignIn}
          >
            <Text style={[styles.buttonText, { color: theme.accentText }]}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={[styles.switchText, { color: theme.textSecondary }]}>
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 32 
  },
  input: { 
    width: '100%', 
    borderWidth: 1, 
    borderRadius: 8, 
    padding: 16, 
    marginBottom: 16,
    fontSize: 16
  },
  note: { 
    fontSize: 12, 
    marginBottom: 24,
    textAlign: 'center'
  },
  button: { 
    width: '100%', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center',
    marginBottom: 16
  },
  buttonText: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  switchButton: { 
    padding: 8 
  },
  switchText: { 
    fontSize: 14 
  },
  loader: { 
    marginTop: 16 
  }
});

export default SignInScreen; 