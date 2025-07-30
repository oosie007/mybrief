import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

interface ArticleViewerProps {
  url: string;
  title: string;
  onClose: () => void;
  onSave?: (article: { url: string; title: string }) => void;
  onShare?: (article: { url: string; title: string }) => void;
  isSaved?: boolean;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({ 
  url, 
  title, 
  onClose, 
  onSave, 
  onShare, 
  isSaved = false 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { theme } = useTheme();

  const handleSave = () => {
    if (onSave) {
      onSave({ url, title });
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare({ url, title });
    }
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
    setProgress(0);
  };

  const handleLoadEnd = () => {
    setLoading(false);
    setProgress(100);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setError(nativeEvent.description || 'Failed to load article');
    setLoading(false);
  };

  const handleNavigationStateChange = (navState: any) => {
    // Optional: Handle navigation state changes
    console.log('Navigation state changed:', navState);
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={true}
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <View style={styles.fullscreenOverlay}>
        {/* Top Bar */}
        <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.headerActions}>
            {onSave && (
              <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                <Ionicons 
                  name={isSaved ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isSaved ? theme.accent : theme.text} 
                />
              </TouchableOpacity>
            )}
            {onShare && (
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color={theme.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        {loading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: theme.accent,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* WebView */}
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadProgress={({ nativeEvent }) => {
            setProgress(nativeEvent.progress * 100);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading article...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
            <Text style={[styles.errorTitle, { color: theme.text }]}>
              Failed to Load
            </Text>
            <Text style={[styles.errorMessage, { color: theme.textMuted }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.accent }]}
              onPress={() => {
                setError(null);
                setLoading(true);
              }}
            >
              <Text style={[styles.retryButtonText, { color: '#fff' }]}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60, // Account for status bar with statusBarTranslucent
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, // For Android
  },
  closeButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  floatingCloseButton: {
    position: 'absolute',
    top: 36,
    right: 16,
    zIndex: 10001,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
    marginTop: 100, // Increased space below header
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    position: 'absolute',
    top: 100, // Position below header
    left: 0,
    right: 0,
    height: 3,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'transparent',
  },
  progressFill: {
    height: '100%',
    borderRadius: 0,
  },
});

export default ArticleViewer; 