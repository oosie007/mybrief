import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  showAction?: boolean;
}

interface SkeletonCardProps {
  theme: any;
}

// Skeleton Card Component
const SkeletonCard: React.FC<SkeletonCardProps> = ({ theme }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.skeletonCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      {/* Header with favicon and source */}
      <View style={styles.skeletonHeader}>
        <Animated.View style={[styles.skeletonFavicon, { backgroundColor: theme.border, opacity }]} />
        <View style={styles.skeletonHeaderText}>
          <Animated.View style={[styles.skeletonSource, { backgroundColor: theme.border, opacity }]} />
          <Animated.View style={[styles.skeletonTime, { backgroundColor: theme.border, opacity }]} />
        </View>
        <Animated.View style={[styles.skeletonHeart, { backgroundColor: theme.border, opacity }]} />
      </View>

      {/* Title */}
      <Animated.View style={[styles.skeletonTitle, { backgroundColor: theme.border, opacity }]} />
      <Animated.View style={[styles.skeletonTitle2, { backgroundColor: theme.border, opacity }]} />

      {/* Summary */}
      <Animated.View style={[styles.skeletonSummary, { backgroundColor: theme.border, opacity }]} />
      <Animated.View style={[styles.skeletonSummary2, { backgroundColor: theme.border, opacity }]} />

      {/* Footer */}
      <View style={styles.skeletonFooter}>
        <Animated.View style={[styles.skeletonMetric, { backgroundColor: theme.border, opacity }]} />
        <Animated.View style={[styles.skeletonDate, { backgroundColor: theme.border, opacity }]} />
      </View>
    </View>
  );
};

// Skeleton Loading State Component
export const SkeletonLoadingState: React.FC<{ count?: number }> = ({ count = 6 }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.skeletonContainer, { backgroundColor: theme.background }]}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} theme={theme} />
      ))}
    </View>
  );
};

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  size = 'large' 
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.loadingSpinner, { borderColor: theme.accent }]} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = 'Something went wrong',
  message = 'We encountered an error while loading your content.',
  onRetry,
  showRetry = true
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.errorIcon, { backgroundColor: '#fee2e2' }]}>
          <Ionicons name="alert-circle" size={32} color="#dc2626" />
        </View>
        <Text style={[styles.errorTitle, { color: theme.text }]}>
          {title}
        </Text>
        <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
          {message}
        </Text>
        {showRetry && onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.accent }]}
            onPress={onRetry}
          >
            <Ionicons name="refresh" size={16} color={theme.accentText} />
            <Text style={[styles.retryButtonText, { color: theme.accentText }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = 'document-outline',
  title,
  subtitle,
  actionText,
  onAction,
  showAction = false
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.emptyIcon, { backgroundColor: theme.pill }]}>
          <Ionicons name={icon as any} size={32} color={theme.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
        {showAction && actionText && onAction && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accent }]}
            onPress={onAction}
          >
            <Text style={[styles.actionButtonText, { color: theme.accentText }]}>
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Specialized empty states for different contexts
export const NoDigestState: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <EmptyState
    icon="newspaper-outline"
    title="No digest available"
    subtitle="Your daily digest will appear here once content is available."
    actionText="Refresh"
    onAction={onRefresh}
    showAction={!!onRefresh}
  />
);

export const NoSavedArticlesState: React.FC<{ onAddFeeds?: () => void }> = ({ onAddFeeds }) => (
  <EmptyState
    icon="heart-outline"
    title="No saved articles yet"
    subtitle="Save articles while browsing to read them later."
    actionText="Add Feeds"
    onAction={onAddFeeds}
    showAction={!!onAddFeeds}
  />
);

export const NoFeedsState: React.FC<{ onAddFeeds?: () => void }> = ({ onAddFeeds }) => (
  <EmptyState
    icon="rss-outline"
    title="No feeds added yet"
    subtitle="Add your favorite sources to start receiving personalized content."
    actionText="Add Feeds"
    onAction={onAddFeeds}
    showAction={!!onAddFeeds}
  />
);

export const SearchEmptyState: React.FC<{ query: string }> = ({ query }) => (
  <EmptyState
    icon="search-outline"
    title={`No results for "${query}"`}
    subtitle="Try adjusting your search terms or browse different categories."
  />
);

// Skeleton Feed Card Component for Feed Management
export const SkeletonFeedCard: React.FC<{ theme: any }> = ({ theme }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.skeletonFeedCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      <View style={styles.skeletonFeedHeader}>
        <Animated.View style={[styles.skeletonFeedIcon, { backgroundColor: theme.border, opacity }]} />
        <View style={styles.skeletonFeedContent}>
          <Animated.View style={[styles.skeletonFeedName, { backgroundColor: theme.border, opacity }]} />
          <Animated.View style={[styles.skeletonFeedUrl, { backgroundColor: theme.border, opacity }]} />
        </View>
        <Animated.View style={[styles.skeletonFeedType, { backgroundColor: theme.border, opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderTopColor: 'transparent',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  skeletonContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  skeletonCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 16,
    marginBottom: 16,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonFavicon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  skeletonHeaderText: {
    flex: 1,
    marginRight: 12,
  },
  skeletonSource: {
    width: '80%',
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  skeletonTime: {
    width: '60%',
    height: 14,
    borderRadius: 7,
  },
  skeletonHeart: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  skeletonTitle: {
    width: '90%',
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  skeletonTitle2: {
    width: '70%',
    height: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  skeletonSummary: {
    width: '100%',
    height: 18,
    borderRadius: 9,
    marginBottom: 8,
  },
  skeletonSummary2: {
    width: '90%',
    height: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonMetric: {
    width: '40%',
    height: 16,
    borderRadius: 8,
  },
  skeletonDate: {
    width: '30%',
    height: 14,
    borderRadius: 7,
  },
  skeletonFeedCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 16,
    marginBottom: 16,
  },
  skeletonFeedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonFeedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  skeletonFeedContent: {
    flex: 1,
    marginRight: 12,
  },
  skeletonFeedName: {
    width: '80%',
    height: 18,
    borderRadius: 9,
    marginBottom: 4,
  },
  skeletonFeedUrl: {
    width: '60%',
    height: 14,
    borderRadius: 7,
  },
  skeletonFeedType: {
    width: 60,
    height: 20,
    borderRadius: 10,
  },
}); 