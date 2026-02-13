import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useThemeColors, useEffectiveColorScheme, spacing, borderRadius, platformShadows } from '../theme';
import { typography, FONTS } from '../theme/typography';
import { ScreenContainer } from '../components/ScreenContainer';
import { useNotebookStore } from '../store/notebookStore';
import { useHistoryStore } from '../store/historyStore';
import { isWeb } from '../utils/platform';
import type { Notebook, Path, MainStackParamList } from '../types';

type NotebooksNavProp = NativeStackNavigationProp<MainStackParamList, 'Notebooks'>;

export const NotebooksScreen: React.FC = () => {
  const colors = useThemeColors();
  const isDark = useEffectiveColorScheme() === 'dark';
  const navigation = useNavigation<NotebooksNavProp>();
  const { notebooks, savedArticles, paths, createNotebook, renameNotebook, deleteNotebook, loadPath, deletePath } =
    useNotebookStore();
  const { entries: historyEntries } = useHistoryStore();
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const filteredNotebooks = useMemo(() => {
    if (!filterQuery.trim()) return notebooks;
    const q = filterQuery.trim().toLowerCase();
    return notebooks.filter((n) => n.name.toLowerCase().includes(q));
  }, [notebooks, filterQuery]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await createNotebook(name);
    setNewName('');
    setShowNewInput(false);
  };

  const handleRename = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    await renameNotebook(id, name);
    setEditingId(null);
    setEditName('');
  };

  const confirmDelete = (notebook: Notebook) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${notebook.name}"? Articles won't be deleted.`)) {
        deleteNotebook(notebook.id);
      }
    } else {
      Alert.alert(
        'Delete Notebook',
        `Delete "${notebook.name}"? Saved articles won't be removed.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteNotebook(notebook.id) },
        ]
      );
    }
  };

  const handleOpenPath = useCallback((path: Path) => {
    loadPath(path.id);
    if (isWeb) {
      // Desktop: navigate to the 'Feed' drawer item (which hosts BrowseScreen)
      (navigation as any).getParent?.()?.navigate?.('Feed') || navigation.navigate('Browse' as any);
    } else {
      navigation.navigate('Browse');
    }
  }, [loadPath, navigation]);

  const confirmDeletePath = useCallback((path: Path) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete path "${path.name}"?`)) {
        deletePath(path.id);
      }
    } else {
      Alert.alert(
        'Delete Path',
        `Delete "${path.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deletePath(path.id) },
        ]
      );
    }
  }, [deletePath]);

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* All Saved row */}
      <Pressable
        onPress={() => navigation.navigate('NotebookDetail', { notebookId: '__all__' })}
        style={[
          styles.allSavedCard,
          { backgroundColor: colors.primary },
          platformShadows.md,
        ]}
      >
        <View style={styles.allSavedContent}>
          <Feather name="layers" size={24} color="#FFFDF9" />
          <View style={{ flex: 1 }}>
            <Text style={styles.allSavedTitle}>All Saved Articles</Text>
            <Text style={styles.allSavedCount}>
              {savedArticles.length} {savedArticles.length === 1 ? 'article' : 'articles'}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="rgba(255,253,249,0.6)" />
        </View>
      </Pressable>

      {/* History row */}
      <Pressable
        onPress={() => navigation.navigate('History')}
        style={({ pressed }) => [
          styles.historyCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.92 : 1,
          },
          platformShadows.sm,
        ]}
      >
        <View style={styles.allSavedContent}>
          <Feather name="clock" size={22} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
              History
            </Text>
            <Text style={[styles.historyCount, { color: colors.textTertiary }]}>
              {historyEntries.length} {historyEntries.length === 1 ? 'article' : 'articles'} viewed
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textTertiary} />
        </View>
      </Pressable>

      {/* Paths section */}
      {paths.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Paths
            </Text>
            <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
              {paths.length}
            </Text>
          </View>
          {paths
            .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
            .map(path => (
              <Pressable
                key={path.id}
                onPress={() => handleOpenPath(path)}
                style={({ pressed }) => [
                  styles.pathCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.92 : 1,
                  },
                  platformShadows.sm,
                ]}
              >
                <View style={styles.pathContent}>
                  <View style={[styles.pathIcon, { backgroundColor: isDark ? 'rgba(212,165,116,0.15)' : 'rgba(107,66,38,0.08)' }]}>
                    <Feather name="git-branch" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pathName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {path.name}
                    </Text>
                    <Text style={[styles.pathMeta, { color: colors.textTertiary }]}>
                      {path.articleCount} {path.articleCount === 1 ? 'article' : 'articles'}
                      {path.maxDepth > 0 && ` · ${path.maxDepth} deep`}
                      {'  ·  '}{formatDate(path.lastOpenedAt)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      confirmDeletePath(path);
                    }}
                    hitSlop={8}
                    style={styles.pathDeleteBtn}
                  >
                    <Feather name="trash-2" size={14} color={colors.textTertiary} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
        </>
      )}

      {/* Section label */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Notebooks
        </Text>
        <Pressable
          onPress={() => setShowNewInput(true)}
          style={[styles.addButton, { backgroundColor: colors.backgroundSecondary }]}
        >
          <Text style={[styles.addButtonText, { color: colors.primary }]}>+ New</Text>
        </Pressable>
      </View>

      {/* New notebook input */}
      {showNewInput && (
        <View style={styles.newRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Notebook name..."
            placeholderTextColor={colors.placeholder}
            style={[
              styles.newInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.textPrimary,
              },
            ]}
            autoFocus
            onSubmitEditing={handleCreate}
          />
          <Pressable
            onPress={handleCreate}
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.createBtnText}>Create</Text>
          </Pressable>
          <Pressable
            onPress={() => { setShowNewInput(false); setNewName(''); }}
            style={styles.cancelBtn}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textTertiary }]}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderNotebook = ({ item }: { item: Notebook }) => {
    const isEditing = editingId === item.id;

    return (
      <Pressable
        onPress={() => navigation.navigate('NotebookDetail', { notebookId: item.id })}
        style={({ pressed }) => [
          styles.notebookCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.92 : 1,
          },
          platformShadows.sm,
        ]}
      >
        <View style={styles.notebookContent}>
          <Feather name="book" size={22} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            {isEditing ? (
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={[
                  styles.editInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputFocusBorder,
                    color: colors.textPrimary,
                  },
                ]}
                autoFocus
                onSubmitEditing={() => handleRename(item.id)}
                onBlur={() => { setEditingId(null); setEditName(''); }}
              />
            ) : (
              <>
                <Text style={[styles.notebookName, { color: colors.textPrimary }]}>
                  {item.name}
                </Text>
                <Text style={[styles.notebookMeta, { color: colors.textTertiary }]}>
                  {item.articleIds.length} {item.articleIds.length === 1 ? 'article' : 'articles'}
                  {'  ·  '}
                  {formatDate(item.updatedAt)}
                </Text>
              </>
            )}
          </View>
          {!isEditing && (
            <View style={styles.notebookActions}>
              <Pressable
                onPress={() => { setEditingId(item.id); setEditName(item.name); }}
                hitSlop={8}
              >
                <Text style={[styles.actionIcon, { color: colors.textTertiary }]}>
                  Rename
                </Text>
              </Pressable>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                <Text style={[styles.actionIcon, { color: colors.error }]}>
                  Delete
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => {
    if (notebooks.length > 0) return null;
    return (
      <View style={styles.emptyContainer}>
        <Feather name="book" size={48} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          No notebooks yet
        </Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Create a notebook to organize saved articles by topic
        </Text>
      </View>
    );
  };

  return (
    <ScreenContainer backgroundColor={colors.background}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={styles.backRow}>
              <Feather name="arrow-left" size={16} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>
                Back
              </Text>
            </View>
          </Pressable>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Notebooks</Text>
          <Pressable
            onPress={() => {
              setSearchActive(prev => {
                if (prev) setFilterQuery('');
                return !prev;
              });
            }}
            style={styles.backBtn}
          >
            <View style={[styles.backRow, { justifyContent: 'flex-end' }]}>
              <Feather
                name={searchActive ? 'x' : 'search'}
                size={16}
                color={colors.primary}
              />
            </View>
          </Pressable>
        </View>

        <AnimatePresence>
          {searchActive && (
            <MotiView
              key="filter"
              from={{ opacity: 0, translateY: -8 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -8 }}
              transition={{ type: 'timing', duration: 200 }}
            >
              <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
                <Feather name="search" size={14} color={colors.textTertiary} />
                <TextInput
                  value={filterQuery}
                  onChangeText={setFilterQuery}
                  placeholder="Filter notebooks..."
                  placeholderTextColor={colors.placeholder}
                  style={[styles.filterInput, { color: colors.textPrimary }]}
                  autoFocus
                />
                {filterQuery.length > 0 && (
                  <Pressable onPress={() => setFilterQuery('')} hitSlop={8}>
                    <Feather name="x-circle" size={14} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>
            </MotiView>
          )}
        </AnimatePresence>

        <FlatList
          data={filteredNotebooks}
          renderItem={renderNotebook}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ScreenContainer>
  );
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 70,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 14,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 18,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    padding: spacing.md,
    gap: spacing.md,
  },
  allSavedCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  allSavedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  allSavedIcon: {
    // icon rendered via Feather component
  },
  allSavedTitle: {
    fontFamily: FONTS.googleSans.bold,
    fontSize: 16,
    color: '#FFFDF9',
  },
  allSavedCount: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 13,
    color: 'rgba(255,253,249,0.8)',
    marginTop: 2,
  },
  allSavedArrow: {
    // icon rendered via Feather component
  },
  historyCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  historyTitle: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 16,
  },
  historyCount: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.pill,
  },
  addButtonText: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 13,
  },
  newRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  newInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    fontFamily: FONTS.googleSans.regular,
    fontSize: 14,
  },
  createBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    borderRadius: borderRadius.md,
  },
  createBtnText: {
    color: '#FFFDF9',
    fontSize: 14,
    fontFamily: FONTS.googleSans.semibold,
  },
  cancelBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: FONTS.googleSans.regular,
  },
  notebookCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs + 1,
  },
  notebookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  notebookIcon: {
    // icon rendered via Feather component
  },
  notebookName: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 15,
  },
  notebookMeta: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 12,
    marginTop: 2,
  },
  notebookActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionIcon: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 12,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontFamily: FONTS.googleSans.regular,
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 280,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  filterInput: {
    flex: 1,
    fontFamily: FONTS.googleSans.regular,
    fontSize: 14,
    paddingVertical: 0,
  },
  sectionCount: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 12,
  },
  pathCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  pathContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  pathIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathName: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 15,
  },
  pathMeta: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 12,
    marginTop: 2,
  },
  pathDeleteBtn: {
    padding: spacing.xs,
  },
});
