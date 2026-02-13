import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useThemeColors, spacing, borderRadius, platformShadows } from '../theme';
import { typography, FONTS } from '../theme/typography';
import { ScreenContainer } from '../components/ScreenContainer';
import { useNotebookStore } from '../store/notebookStore';
import { useTabStore } from '../store/tabStore';
import { isWeb } from '../utils/platform';
import type { SavedArticle, MainStackParamList } from '../types';

type DetailRoute = RouteProp<MainStackParamList, 'NotebookDetail'>;
type DetailNav = NativeStackNavigationProp<MainStackParamList, 'NotebookDetail'>;

export const NotebookDetailScreen: React.FC = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<DetailNav>();
  const route = useRoute<DetailRoute>();
  const { notebookId } = route.params;

  const { notebooks, savedArticles, unsaveArticle, removeFromNotebook } = useNotebookStore();

  const isAllSaved = notebookId === '__all__';
  const notebook = isAllSaved ? null : notebooks.find((n) => n.id === notebookId);
  const screenTitle = isAllSaved ? 'All Saved Articles' : notebook?.name || 'Notebook';

  const [searchActive, setSearchActive] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const articles = useMemo(() => {
    if (isAllSaved) {
      return [...savedArticles].sort((a, b) => b.savedAt - a.savedAt);
    }
    if (!notebook) return [];
    const idSet = new Set(notebook.articleIds);
    return savedArticles
      .filter((a) => idSet.has(a.pageId))
      .sort((a, b) => b.savedAt - a.savedAt);
  }, [isAllSaved, notebook, savedArticles]);

  const filteredArticles = useMemo(() => {
    if (!filterQuery.trim()) return articles;
    const q = filterQuery.trim().toLowerCase();
    return articles.filter(
      (a) =>
        a.displayTitle.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q)
    );
  }, [articles, filterQuery]);

  const handleArticlePress = (article: SavedArticle) => {
    useTabStore.getState().openArticleFromFeed(
      article.pageId,
      article.title,
      article.displayTitle,
      'discovery',
      'From notebook',
    );
    if (isWeb) {
      (navigation as any).getParent?.()?.navigate?.('Feed') || navigation.navigate('Browse' as any);
    } else {
      navigation.navigate('Browse');
    }
  };

  const handleRemove = (article: SavedArticle) => {
    const message = isAllSaved
      ? `Remove "${article.displayTitle}" from saved articles?`
      : `Remove "${article.displayTitle}" from this notebook?`;

    const action = () => {
      if (isAllSaved) {
        unsaveArticle(article.pageId);
      } else {
        removeFromNotebook(article.pageId, notebookId);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) action();
    } else {
      Alert.alert('Remove Article', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: action },
      ]);
    }
  };

  const renderArticle = ({ item }: { item: SavedArticle }) => (
    <Pressable
      onPress={() => handleArticlePress(item)}
      style={({ pressed }) => [
        styles.articleCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
        platformShadows.sm,
      ]}
    >
      {item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="book-open" size={28} color={colors.textTertiary} />
        </View>
      )}

      <View style={styles.articleContent}>
        <Text
          style={[styles.articleTitle, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {item.displayTitle}
        </Text>
        <Text
          style={[styles.articleExcerpt, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.excerpt}
        </Text>
        <View style={styles.articleFooter}>
          <Text style={[styles.savedDate, { color: colors.textTertiary }]}>
            Saved {formatDate(item.savedAt)}
          </Text>
          <Pressable onPress={() => handleRemove(item)} hitSlop={8}>
            <Text style={[styles.removeText, { color: colors.error }]}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather
        name={isAllSaved ? 'layers' : 'book'}
        size={48}
        color={colors.textTertiary}
      />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {isAllSaved ? 'No saved articles yet' : 'This notebook is empty'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {isAllSaved
          ? 'Save articles from the feed to find them here later'
          : 'Save articles to this notebook from the article reader'}
      </Text>
    </View>
  );

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
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.headerTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {screenTitle}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
              {filterQuery.trim()
                ? `${filteredArticles.length} of ${articles.length} articles`
                : `${articles.length} ${articles.length === 1 ? 'article' : 'articles'}`}
            </Text>
          </View>
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
                  placeholder="Filter articles..."
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
          data={filteredArticles}
          renderItem={renderArticle}
          keyExtractor={(item) => String(item.pageId)}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            filteredArticles.length === 0 ? styles.emptyListContent : styles.listContent
          }
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

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
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
    gap: spacing.xs,
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
  headerTitle: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 1,
  },
  listContent: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  emptyListContent: {
    flex: 1,
  },
  articleCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs + 1,
  },
  thumbnail: {
    width: 90,
    minHeight: 100,
  },
  thumbnailPlaceholder: {
    width: 90,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    // icon rendered via Feather component
  },
  articleContent: {
    flex: 1,
    padding: spacing.sm + 2,
    justifyContent: 'space-between',
    gap: 3,
  },
  articleTitle: {
    fontSize: 15,
    fontFamily: FONTS.crimsonPro.bold,
    lineHeight: 20,
  },
  articleExcerpt: {
    fontSize: 12,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 17,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  savedDate: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 11,
  },
  removeText: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
});
