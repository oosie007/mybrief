import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { saveShareService } from '../lib/saveShareService';

interface SaveArticleModalProps {
  visible: boolean;
  onClose: () => void;
  contentItemId: string;
  articleTitle: string;
  onSave?: () => void;
}

const SaveArticleModal: React.FC<SaveArticleModalProps> = ({
  visible,
  onClose,
  contentItemId,
  articleTitle,
  onSave,
}) => {
  const { theme } = useTheme();
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      loadAvailableTags();
    }
  }, [visible]);

  const loadAvailableTags = async () => {
    try {
      const tags = await saveShareService.getUserTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const addTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveShareService.saveArticle(contentItemId, notes, tags);
      Alert.alert('Success', 'Article saved successfully!');
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error saving article:', error);
      Alert.alert('Error', 'Failed to save article. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNotes('');
    setTags([]);
    setNewTag('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Save Article</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, { opacity: saving ? 0.5 : 1 }]}
          >
            <Text style={[styles.saveButtonText, { color: theme.accent }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Article Title */}
          <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Article</Text>
            <Text style={[styles.articleTitle, { color: theme.text }]} numberOfLines={3}>
              {articleTitle}
            </Text>
          </View>

          {/* Notes Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[styles.notesInput, { 
                backgroundColor: theme.background, 
                borderColor: theme.border,
                color: theme.text 
              }]}
              placeholder="Add your thoughts, summary, or key points..."
              placeholderTextColor={theme.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Tags Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tags</Text>
            
            {/* Add Tag Input */}
            <View style={styles.addTagContainer}>
              <TextInput
                style={[styles.tagInput, { 
                  backgroundColor: theme.background, 
                  borderColor: theme.border,
                  color: theme.text 
                }]}
                placeholder="Add a tag..."
                placeholderTextColor={theme.textMuted}
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={addTag}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.addTagButton, { backgroundColor: theme.accent }]}
                onPress={addTag}
                disabled={!newTag.trim()}
              >
                <Ionicons name="add" size={16} color={theme.accentText} />
              </TouchableOpacity>
            </View>

            {/* Selected Tags */}
            {tags.length > 0 && (
              <View style={styles.selectedTagsContainer}>
                <Text style={[styles.tagsLabel, { color: theme.textSecondary }]}>Selected:</Text>
                <View style={styles.tagsList}>
                  {tags.map((tag, index) => (
                    <View key={index} style={[styles.tagChip, { backgroundColor: theme.accent }]}>
                      <Text style={[styles.tagText, { color: theme.accentText }]}>{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(tag)}>
                        <Ionicons name="close" size={12} color={theme.accentText} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Available Tags */}
            {availableTags.length > 0 && (
              <View style={styles.availableTagsContainer}>
                <Text style={[styles.tagsLabel, { color: theme.textSecondary }]}>Available:</Text>
                <View style={styles.tagsList}>
                  {availableTags
                    .filter(tag => !tags.includes(tag))
                    .slice(0, 10)
                    .map((tag, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.tagChip, { backgroundColor: theme.pill }]}
                        onPress={() => setTags([...tags, tag])}
                      >
                        <Text style={[styles.tagText, { color: theme.pillText }]}>{tag}</Text>
                        <Ionicons name="add" size={12} color={theme.pillText} />
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  articleTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  addTagButton: {
    padding: 8,
    borderRadius: 6,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTagsContainer: {
    marginBottom: 16,
  },
  availableTagsContainer: {
    marginBottom: 8,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SaveArticleModal; 