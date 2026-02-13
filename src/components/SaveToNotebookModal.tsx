import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MotiView } from 'moti';
import { Feather } from '@expo/vector-icons';
import { useThemeColors, spacing, borderRadius } from '../theme';
import { typography, FONTS } from '../theme/typography';
import { useNotebookStore } from '../store/notebookStore';
import { useInterestStore } from '../store/interestStore';
import type { Article, Notebook } from '../types';

interface SaveToNotebookModalProps {
  visible: boolean;
  article: Article;
  onClose: () => void;
}

export const SaveToNotebookModal: React.FC<SaveToNotebookModalProps> = ({
  visible,
  article,
  onClose,
}) => {
  const colors = useThemeColors();
  const { notebooks, saveArticle, createNotebook, isArticleSaved } = useNotebookStore();
  const { signalArticleSaved } = useInterestStore();
  const [newNotebookName, setNewNotebookName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const isSaved = isArticleSaved(article.pageId);

  const handleSaveToNotebook = async (notebook: Notebook) => {
    await saveArticle(
      {
        pageId: article.pageId,
        title: article.title,
        displayTitle: article.displayTitle,
        excerpt: article.excerpt,
        thumbnailUrl: article.thumbnailUrl,
        categories: article.categories || [],
      },
      notebook.id
    );
    signalArticleSaved(article);
    onClose();
  };

  const handleQuickSave = async () => {
    await saveArticle({
      pageId: article.pageId,
      title: article.title,
      displayTitle: article.displayTitle,
      excerpt: article.excerpt,
      thumbnailUrl: article.thumbnailUrl,
      categories: article.categories || [],
    });
    signalArticleSaved(article);
    onClose();
  };

  const handleCreateAndSave = async () => {
    if (!newNotebookName.trim()) return;
    const notebook = await createNotebook(newNotebookName.trim());
    await handleSaveToNotebook(notebook);
    setNewNotebookName('');
    setShowNewInput(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
        <Pressable
          style={[styles.modal, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Save Article
          </Text>

          <Text
            style={[styles.articleTitle, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {article.displayTitle}
          </Text>

          {/* Quick save button */}
          <Pressable
            onPress={handleQuickSave}
            style={[styles.quickSave, { backgroundColor: colors.primary }]}
          >
            <View style={styles.quickSaveInner}>
              <Feather
                name={isSaved ? 'check-circle' : 'save'}
                size={16}
                color="#FFFDF9"
              />
              <Text style={styles.quickSaveText}>
                {isSaved ? 'Already Saved' : 'Quick Save'}
              </Text>
            </View>
          </Pressable>

          {/* Notebook list */}
          {notebooks.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                Save to notebook:
              </Text>
              <FlatList
                data={notebooks}
                keyExtractor={(item) => item.id}
                style={styles.notebookList}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSaveToNotebook(item)}
                    style={[styles.notebookRow, { borderBottomColor: colors.divider }]}
                  >
                    <View style={styles.notebookRowInner}>
                      <Feather name="book" size={16} color={colors.textSecondary} />
                      <Text style={[styles.notebookName, { color: colors.textPrimary }]}>
                        {item.name}
                      </Text>
                    </View>
                    <Text style={[styles.notebookCount, { color: colors.textTertiary }]}>
                      {item.articleIds.length}
                    </Text>
                  </Pressable>
                )}
              />
            </>
          )}

          {/* New notebook */}
          {showNewInput ? (
            <View style={styles.newNotebookRow}>
              <TextInput
                value={newNotebookName}
                onChangeText={setNewNotebookName}
                placeholder="Notebook name..."
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.newNotebookInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary,
                  },
                ]}
                autoFocus
                onSubmitEditing={handleCreateAndSave}
              />
              <Pressable
                onPress={handleCreateAndSave}
                style={[styles.createButton, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#FFFDF9', fontFamily: FONTS.googleSans.semibold, fontSize: 14 }}>
                  Create
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowNewInput(true)}
              style={[styles.newNotebookButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.newNotebookButtonText, { color: colors.textSecondary }]}>
                + New Notebook
              </Text>
            </Pressable>
          )}

          {/* Cancel */}
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.textTertiary }]}>
              Cancel
            </Text>
          </Pressable>
        </Pressable>
        </MotiView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  articleTitle: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  quickSave: {
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
  },
  quickSaveInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickSaveText: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 15,
    color: '#FFFDF9',
  },
  sectionLabel: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  notebookList: {
    maxHeight: 180,
  },
  notebookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  notebookRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notebookName: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 15,
  },
  notebookCount: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 13,
  },
  newNotebookRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  newNotebookInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    fontFamily: FONTS.googleSans.regular,
    fontSize: 14,
  },
  createButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  newNotebookButton: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  newNotebookButtonText: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 14,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 14,
  },
});
