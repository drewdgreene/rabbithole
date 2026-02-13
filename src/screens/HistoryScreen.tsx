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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useThemeColors, spacing, borderRadius, platformShadows } from '../theme';
import { typography, FONTS } from '../theme/typography';
import { ScreenContainer } from '../components/ScreenContainer';
import { useHistoryStore } from '../store/historyStore';
import { useTabStore } from '../store/tabStore';
import { isWeb } from '../utils/platform';
import type { HistoryEntry, MainStackParamList } from '../types';

type HistoryNav = NativeStackNavigationProp<MainStackParamList, 'History'>;

export const HistoryScreen: React.FC = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<HistoryNav>();
  const { entries, removeEntry, clearHistory } = useHistoryStore();

  const [searchActive, setSearchActive] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const filteredEntries = useMemo(() => {
    if (!filterQuery.trim()) return entries;
    const q = filterQuery.trim().toLowerCase();
    return entries.filter(
      (e) =>
        e.displayTitle.toLowerCase().includes(q) ||
        e.excerpt.toLowerCase().includes(q)
    );
  }, [entries, filterQuery]);

  const handleEntryPress = (entry: HistoryEntry) => {
    useTabStore.getState().openArticleFromFeed(
      entry.pageId,
      entry.title,
      entry.displayTitle,
      'discovery',
      'From history',
    );
    if (isWeb) {
      (navigation as any).getParent?.()?.navigate?.('Feed') || navigation.navigate('Browse' as any);
    } else {
      navigation.navigate('Browse');
    }
  };

  const handleRemove = (entry: HistoryEntry) => {
    const message = `Remove "${entry.displayTitle}" from history?`;
    const action = () => removeEntry(entry.pageId);

    if (Platform.OS === 'web') {
      if (window.confirm(message)) action();
    } else {
      Alert.alert('Remove from History', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: action },
      ]);
    }
  };

  const handleClearAll = () => {
    const message = 'Clear all browsing history? This cannot be undone.';
    const action = () => clearHistory();

    if (Platform.OS === 'web') {
      if (window.confirm(message)) action();
    } else {
      Alert.alert('Clear History', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: action },
      ]);
    }
  };

  const renderHistoryItem = ({ item }: { item: HistoryEntry }) => (
    <Pressable
      onPress={() => handleEntryPress(item)}
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
          <View style={styles.footerLeft}>
            <Text style={[styles.footerDate, { color: colors.textTertiary }]}>
              {formatDate(item.lastViewedAt)}
            </Text>
            {item.scrollDepthPct > 0 && (
              <>
                <Text style={[styles.footerDot, { color: colors.textTertiary }]}>  ·  </Text>
                <Text style={[styles.footerProgress, { color: colors.primary }]}>
                  {item.scrollDepthPct}% read
                </Text>
              </>
            )}
          </View>
          <Pressable onPress={() => handleRemove(item)} hitSlop={8}>
            <Text style={[styles.removeText, { color: colors.error }]}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="clock" size={48} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No history yet
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Articles you read will appear here
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
              History
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
              {filterQuery.trim()
                ? `${filteredEntries.length} of ${entries.length} articles`
                : `${entries.length} ${entries.length === 1 ? 'article' : 'articles'}`}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {entries.length > 0 && (
              <Pressable onPress={handleClearAll} style={styles.clearBtn} hitSlop={8}>
                <Text style={[styles.clearText, { color: colors.error }]}>Clear</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                setSearchActive(prev => {
                  if (prev) setFilterQuery('');
                  return !prev;
                });
              }}
              style={styles.searchBtn}
            >
              <Feather
                name={searchActive ? 'x' : 'search'}
                size={16}
                color={colors.primary}
              />
            </Pressable>
          </View>
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
                  placeholder="Filter history..."
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
          data={filteredEntries}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => String(item.pageId)}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            filteredEntries.length === 0 ? styles.emptyListContent : styles.listContent
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
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 70,
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  clearBtn: {
    paddingVertical: spacing.xs,
  },
  clearText: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 13,
  },
  searchBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerDate: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 11,
  },
  footerDot: {
    fontSize: 11,
  },
  footerProgress: {
    fontFamily: FONTS.googleSans.semibold,
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
