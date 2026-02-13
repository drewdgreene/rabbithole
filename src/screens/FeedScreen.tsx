import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeColors, spacing, borderRadius } from '../theme';
import { typography, FONTS } from '../theme/typography';
import { ScreenContainer } from '../components/ScreenContainer';
import { FeedCard } from '../components/FeedCard';
import { SkeletonFeed } from '../components/SkeletonCard';
import { useFeedLoader } from '../hooks/useFeedLoader';
import { useInterestStore } from '../store/interestStore';
import { useSessionStore } from '../store/sessionStore';
import { searchArticles } from '../services/wikipedia';
import { isWeb } from '../utils/platform';
import { useTabStore } from '../store/tabStore';
import { mapWikiCategoriesToTaxonomy } from '../utils/categoryMapping';
import type { FeedItem, MainStackParamList } from '../types';

type FeedNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Browse'>;

export const FeedScreen: React.FC = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<FeedNavigationProp>();
  const { signalCardDwell, signalSearchQuery, signalSearchResultTap } = useInterestStore();
  const { recordCardVisibility, recordArticleOpened, recordSearchQuery } = useSessionStore();
  const {
    items,
    isLoading,
    isRefreshing,
    error,
    loadFeed,
    refreshFeed,
    loadMore,
    prefetchMore,
  } = useFeedLoader();

  // Search state
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ title: string; pageId: number; excerpt: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const lastSearchQueryRef = useRef('');

  // Track the query text as it changes so we can signal on close
  useEffect(() => {
    if (searchQuery.trim()) lastSearchQueryRef.current = searchQuery.trim();
  }, [searchQuery]);

  // Signal search intent when search bar is closed (even without tapping a result)
  useEffect(() => {
    if (!searchActive && lastSearchQueryRef.current) {
      const query = lastSearchQueryRef.current;
      signalSearchQuery(query);
      recordSearchQuery(query);
      lastSearchQueryRef.current = '';
    }
  }, [searchActive, signalSearchQuery, recordSearchQuery]);

  // Debounced Wikipedia search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchArticles(searchQuery.trim(), 10);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchResultPress = useCallback((result: { title: string; pageId: number; excerpt: string }) => {
    const query = searchQuery.trim();

    // Signal the tap with a minimal Article (categories populated later by ArticleScreen)
    signalSearchResultTap({
      pageId: result.pageId,
      title: result.title,
      displayTitle: result.title,
      excerpt: result.excerpt || '',
      categories: [],
      contentUrl: '',
      fetchedAt: Date.now(),
    }, query);

    // Clear search state — skip the close signal since we already signaled the tap
    lastSearchQueryRef.current = '';
    setSearchActive(false);
    setSearchQuery('');
    setSearchResults([]);

    useTabStore.getState().openArticleFromFeed(
      result.pageId,
      result.title,
      result.title,
      'search',
      'Search result',
    );
  }, [searchQuery, signalSearchResultTap]);

  // Track when cards become visible for dwell time measurement
  const cardVisibilityRef = useRef<Map<number, number>>(new Map());

  const handleCardPress = useCallback((item: FeedItem) => {
    // Compute dwell time for the pressed card
    const enteredAt = cardVisibilityRef.current.get(item.article.pageId);
    if (enteredAt) {
      const dwellMs = Date.now() - enteredAt;
      signalCardDwell(item.article, dwellMs, item.source);
      recordCardVisibility(item.article.pageId, dwellMs, true);
      cardVisibilityRef.current.delete(item.article.pageId);
    }

    // Record article opened in session store
    recordArticleOpened(item.article.pageId, item.article.title, item.article.categories, item.source);

    // Reset category skip counts (user engaged with this category)
    const mappedCats = mapWikiCategoriesToTaxonomy(item.article.categories);
    for (const cat of mappedCats) {
      useSessionStore.getState().resetCategorySkip(cat.id);
    }

    useTabStore.getState().openArticleFromFeed(
      item.article.pageId,
      item.article.title,
      item.article.displayTitle,
      item.source,
      item.sourceDetail,
      item.article.thumbnailUrl,
      item.article.categories,
    );
  }, [signalCardDwell, recordCardVisibility, recordArticleOpened]);

  // FlatList requires onViewableItemsChanged to be a stable reference (cannot change after mount).
  // Use a ref to hold the latest callback so the function identity never changes.
  const viewabilityHandlerRef = useRef(({ changed }: { changed: any[] }) => {
    for (const info of changed) {
      if (!info.item) continue;
      const pageId = info.item.article.pageId;

      if (info.isViewable) {
        cardVisibilityRef.current.set(pageId, Date.now());
      } else {
        const enteredAt = cardVisibilityRef.current.get(pageId);
        if (enteredAt) {
          const dwellMs = Date.now() - enteredAt;
          // Access store actions directly to avoid stale closures
          useInterestStore.getState().signalCardDwell(info.item.article, dwellMs, info.item.source);
          useSessionStore.getState().recordCardVisibility(pageId, dwellMs, false);
          cardVisibilityRef.current.delete(pageId);
        }
        useInterestStore.getState().signalScrolledPast(info.item.article);
        // Track category skips for suppression
        const mappedCats = mapWikiCategoriesToTaxonomy(info.item.article.categories);
        for (const cat of mappedCats) {
          useSessionStore.getState().recordCategorySkip(cat.id);
        }
        useSessionStore.getState().recordCardShown(pageId);
      }
    }
  });
  const viewabilityConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });


  const renderHeader = useCallback(() => (
    <View>
      <View style={styles.header}>
        <Text style={[styles.logo, { color: colors.primary }]}>
          rabbithole
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              setSearchActive(prev => {
                if (prev) {
                  setSearchQuery('');
                  setSearchResults([]);
                }
                return !prev;
              });
            }}
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Feather
              name={searchActive ? 'x' : 'search'}
              size={20}
              color={searchActive ? colors.primary : colors.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Topics')}
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Feather name="tag" size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Notebooks')}
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Feather name="book" size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Feather name="settings" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <AnimatePresence>
        {searchActive && (
          <MotiView
            key="search"
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -10 }}
            transition={{ type: 'timing', duration: 200 }}
          >
            <View style={styles.searchContainer}>
              <View style={[styles.searchInputRow, {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
              }]}>
                <Feather name="search" size={16} color={colors.textTertiary} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search Wikipedia..."
                  placeholderTextColor={colors.placeholder}
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  autoFocus
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <Feather name="x-circle" size={16} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>

              {searchLoading && (
                <View style={styles.searchLoadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <View style={[styles.searchResultsList, {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                }]}>
                  {searchResults.map((result) => (
                    <Pressable
                      key={result.pageId}
                      onPress={() => handleSearchResultPress(result)}
                      style={({ pressed }) => [
                        styles.searchResultItem,
                        { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Text
                        style={[styles.searchResultTitle, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {result.title}
                      </Text>
                      {result.excerpt ? (
                        <Text
                          style={[styles.searchResultExcerpt, { color: colors.textSecondary }]}
                          numberOfLines={2}
                        >
                          {result.excerpt}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              )}

              {!searchLoading && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                <Text style={[styles.searchNoResults, { color: colors.textTertiary }]}>
                  No results found
                </Text>
              )}
            </View>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  ), [colors, navigation, searchActive, searchQuery, searchResults, searchLoading, handleSearchResultPress]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return <SkeletonFeed count={5} />;
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={48} color={colors.textTertiary} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
            Couldn't load articles
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <Pressable
            onPress={loadFeed}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.retryText, { color: '#FFFDF9' }]}>
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Feather name="compass" size={48} color={colors.textTertiary} />
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
          Your rabbit hole awaits
        </Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Pull down to discover articles
        </Text>
      </View>
    );
  }, [isLoading, error, colors, loadFeed]);

  const renderFooter = useCallback(() => {
    if (!isLoading || items.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isLoading, items.length, colors.primary]);

  // Split items into two columns for masonry layout (web).
  // Estimate heights to balance: image cards ~280px, text-only ~130px.
  const { leftCol, rightCol } = useMemo(() => {
    const left: FeedItem[] = [];
    const right: FeedItem[] = [];
    let leftH = 0;
    let rightH = 0;
    for (const item of items) {
      const h = item.article.thumbnailUrl ? 280 : 130;
      if (leftH <= rightH) {
        left.push(item);
        leftH += h;
      } else {
        right.push(item);
        rightH += h;
      }
    }
    return { leftCol: left, rightCol: right };
  }, [items]);

  const handleScroll = useCallback((e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const scrollDepth = (contentOffset.y + layoutMeasurement.height) / contentSize.height;

    // Prefetch at 50% scroll depth (background, non-blocking)
    if (scrollDepth >= 0.50 && items.length > 0) {
      prefetchMore();
    }

    // Load more when near bottom
    if (contentSize.height - contentOffset.y - layoutMeasurement.height < layoutMeasurement.height * 0.5) {
      if (items.length > 0) loadMore();
    }
  }, [items.length, loadMore, prefetchMore]);

  return (
    <ScreenContainer backgroundColor={colors.background}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.stickyHeader, { backgroundColor: colors.background }]}>
          {renderHeader()}
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={items.length === 0 ? styles.emptyListContent : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshFeed}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={200}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            renderEmpty()
          ) : (
            <View style={styles.masonryGrid}>
              <View style={styles.masonryColumn}>
                {leftCol.map((item, i) => (
                  <FeedCard key={item.article.pageId} item={item} onPress={handleCardPress} index={i} />
                ))}
              </View>
              <View style={styles.masonryColumn}>
                {rightCol.map((item, i) => (
                  <FeedCard key={item.article.pageId} item={item} onPress={handleCardPress} index={i} />
                ))}
              </View>
            </View>
          )}
          {renderFooter()}
        </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl + 80, // Extra space for floating tab bar
  },
  emptyListContent: {
    flex: 1,
  },
  stickyHeader: {
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  masonryGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  masonryColumn: {
    flex: 1,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  headerBtn: {
    padding: spacing.xs + 2,
  },
  headerBtnIcon: {
    // placeholder for icon alignment
  },
  logo: {
    fontSize: 24,
    fontFamily: FONTS.crimsonPro.extraBold,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  errorIcon: {
    marginBottom: spacing.sm,
  },
  errorTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 300,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.pill,
    marginTop: spacing.md,
  },
  retryText: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 15,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.googleSans.regular,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchLoadingRow: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  searchResultsList: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  searchResultItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchResultTitle: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  searchResultExcerpt: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  searchNoResults: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
