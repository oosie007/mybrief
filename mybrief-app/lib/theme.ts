import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  background: string;
  cardBg: string;
  headerBg: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  hover: string;
  hoverCard: string;
  accent: string;
  accentText: string;
  accentHover: string;
  pill: string;
  pillText: string;
  divider: string;
}

export const lightTheme: Theme = {
  background: '#fafaf9', // stone-50
  cardBg: '#f5f5f4', // stone-100
  headerBg: '#f5f5f4', // stone-100
  text: '#292524', // stone-900
  textSecondary: '#78716c', // stone-600
  textMuted: '#a8a29e', // stone-500
  border: '#e7e5e4', // stone-200
  borderLight: '#d6d3d1', // stone-300
  hover: '#e7e5e4', // stone-200
  hoverCard: '#e7e5e4', // stone-200
  accent: '#292524', // stone-800
  accentText: '#fafaf9', // stone-100
  accentHover: '#44403c', // stone-700
  pill: '#e7e5e4', // stone-200
  pillText: '#44403c', // stone-700
  divider: '#d6d3d1', // stone-300
};

export const darkTheme: Theme = {
  background: '#111827', // gray-900
  cardBg: '#1f2937', // gray-800
  headerBg: '#1f2937', // gray-800
  text: '#f3f4f6', // gray-100
  textSecondary: '#d1d5db', // gray-300
  textMuted: '#9ca3af', // gray-400
  border: '#374151', // gray-700
  borderLight: '#4b5563', // gray-600
  hover: '#374151', // gray-700
  hoverCard: '#374151', // gray-700
  accent: '#374151', // gray-700
  accentText: '#f3f4f6', // gray-100
  accentHover: '#4b5563', // gray-600
  pill: '#374151', // gray-700
  pillText: '#e5e7eb', // gray-200
  divider: '#4b5563', // gray-600
};

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // Default to system preference or light mode
        setIsDarkMode(false);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      setIsDarkMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return {
    theme,
    isDarkMode,
    toggleTheme,
    isLoading,
  };
}

// Source icon colors for different content types
export const sourceColors = {
  rss: {
    techcrunch: '#10b981', // green-500
    theverge: '#9333ea', // purple-600
    bloomberg: '#1e3a8a', // blue-900
    wired: '#000000', // black
  },
  reddit: '#f97316', // orange-500
  youtube: '#ef4444', // red-500
  twitter: '#1da1f2', // blue-400
  default: '#9ca3af', // gray-400
};

// Helper function to get source color
export function getSourceColor(source: string, type: string): string {
  if (type === 'rss') {
    if (source.includes('techcrunch')) return sourceColors.rss.techcrunch;
    if (source.includes('theverge')) return sourceColors.rss.theverge;
    if (source.includes('bloomberg')) return sourceColors.rss.bloomberg;
    if (source.includes('wired')) return sourceColors.rss.wired;
  }
  
  if (type === 'reddit') return sourceColors.reddit;
  if (type === 'youtube') return sourceColors.youtube;
  if (type === 'twitter') return sourceColors.twitter;
  
  return sourceColors.default;
} 