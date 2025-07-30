import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

interface SharedLayoutProps {
  children: React.ReactNode;
  navigation: any;
  currentScreen: 'home' | 'feeds' | 'saved' | 'settings';
  headerActions?: React.ReactNode;
  headerSubtitle?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: string[] | Array<{ key: string; label: string; count: number }>;
  showFilters?: boolean;
}

const Logo = ({ size = 160, isDarkMode }: { size?: number; isDarkMode: boolean }) => {
  const [imageError, setImageError] = useState(false);
  
  // Use the correct mybrief logo based on theme
  const logoSource = isDarkMode 
    ? require('../assets/mybrief_dark.png')
    : require('../assets/mybrief_light.png');
  
  console.log('Logo loading:', { isDarkMode, logoSource, imageError });
  
  if (imageError) {
    // Fallback to text if image fails
    const textColor = isDarkMode ? '#ffffff' : '#000000';
    return (
      <Text style={[
        styles.logoText,
        { 
          color: textColor,
          fontSize: size * 0.2,
        }
      ]}>
        myBrief
      </Text>
    );
  }
  
  return (
    <Image 
      source={logoSource}
      style={{ 
        width: size, 
        height: size * 0.25,
        resizeMode: 'contain'
      }}
      onError={(error) => {
        console.log('Logo error:', error);
        setImageError(true);
      }}
    />
  );
};

const SharedLayout: React.FC<SharedLayoutProps> = ({ 
  children, 
  navigation, 
  currentScreen,
  headerActions,
  headerSubtitle,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search articles...',
  activeCategory = 'All',
  onCategoryChange,
  categories = ['All', 'Technology', 'Business', 'Startups', 'Productivity', 'News', 'Communities', 'Science', 'Health', 'Finance', 'Entertainment', 'Education', 'Politics', 'Sports', 'Lifestyle'],
  showFilters = true
}) => {
  const { theme, isDarkMode } = useTheme();

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'home':
        return 'mybrief';
      case 'feeds':
        return 'Feed Management';
      case 'saved':
        return 'Saved Articles';
      case 'settings':
        return 'Settings';
      default:
        return 'mybrief';
    }
  };

  const getNavIcon = (screen: string, isActive: boolean) => {
    const iconName = isActive ? 
      (screen === 'home' ? 'home' : 
       screen === 'feeds' ? 'list' : 
       screen === 'saved' ? 'heart' : 'settings') :
      (screen === 'home' ? 'home-outline' : 
       screen === 'feeds' ? 'list-outline' : 
       screen === 'saved' ? 'heart-outline' : 'settings-outline');
    
    return iconName;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Logo size={240} isDarkMode={isDarkMode} />
            {headerSubtitle && (
              <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                {headerSubtitle}
              </Text>
            )}
          </View>
          
          <View style={styles.headerActions}>
            {headerActions}
          </View>
        </View>

        {/* Search Bar - Always visible for home and saved articles */}
        {(currentScreen === 'home' || currentScreen === 'saved') && (
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Ionicons name="search" size={16} color={theme.textMuted} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={onSearchChange}
              />
              {searchQuery && searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => onSearchChange?.('')}>
                  <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Category Filter - Always visible for home and saved articles */}
        {(currentScreen === 'home' || currentScreen === 'saved') && showFilters && (
          <View style={styles.categoryContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContent}
            >
              {currentScreen === 'saved' ? (
                // Saved articles filters
                (categories as Array<{ key: string; label: string; count: number }>).map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.categoryPill,
                      activeCategory === tab.key 
                        ? { backgroundColor: theme.accent }
                        : { backgroundColor: theme.pill }
                    ]}
                    onPress={() => onCategoryChange?.(tab.key)}
                  >
                    <Text style={[
                      styles.categoryText,
                      activeCategory === tab.key 
                        ? { color: theme.accentText }
                        : { color: theme.pillText }
                    ]}>
                      {tab.label} ({tab.count})
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                // Home screen categories
                (categories as string[]).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryPill,
                      activeCategory === category 
                        ? { backgroundColor: theme.accent }
                        : { backgroundColor: theme.pill }
                    ]}
                    onPress={() => onCategoryChange?.(category)}
                  >
                    <Text style={[
                      styles.categoryText,
                      activeCategory === category 
                        ? { color: theme.accentText }
                        : { color: theme.pillText }
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'home' && { backgroundColor: theme.hover }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons 
            name={getNavIcon('home', currentScreen === 'home')} 
            size={24} 
            color={currentScreen === 'home' ? (isDarkMode ? '#ffffff' : '#000000') : theme.textSecondary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'feeds' && { backgroundColor: theme.hover }]}
          onPress={() => navigation.navigate('FeedManagement')}
        >
          <Ionicons 
            name={getNavIcon('feeds', currentScreen === 'feeds')} 
            size={24} 
            color={currentScreen === 'feeds' ? (isDarkMode ? '#ffffff' : '#000000') : theme.textSecondary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'saved' && { backgroundColor: theme.hover }]}
          onPress={() => navigation.navigate('SavedArticles')}
        >
          <Ionicons 
            name={getNavIcon('saved', currentScreen === 'saved')} 
            size={24} 
            color={currentScreen === 'saved' ? (isDarkMode ? '#ffffff' : '#000000') : theme.textSecondary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'settings' && { backgroundColor: theme.hover }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons 
            name={getNavIcon('settings', currentScreen === 'settings')} 
            size={24} 
            color={currentScreen === 'settings' ? (isDarkMode ? '#ffffff' : '#000000') : theme.textSecondary} 
          />
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
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryContent: {
    paddingHorizontal: 0,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 34,
    paddingTop: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    minHeight: 40,
  },
  logoText: {
    fontWeight: 'bold',
  },
});

export default SharedLayout; 