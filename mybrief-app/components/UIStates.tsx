import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
}); 