import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { useThemeColors, useEffectiveColorScheme, spacing } from '../theme';
import { FONTS } from '../theme/typography';
import { useTabStore, type Tab } from '../store/tabStore';
import { tapFeedback } from '../utils/haptics';

// Source color mapping (matches FeedCard)
const SOURCE_COLORS: Record<string, string> = {
  category: '#6B4226',
  link: '#2E7D6F',
  current_events: '#C75B4A',
  discovery: '#8B7355',
  momentum: '#D4A574',
  continuation: '#5CC4B0',
  search: '#2E7D6F',
};

export const TabPillStrip: React.FC = () => {
  const colors = useThemeColors();
  const isDark = useEffectiveColorScheme() === 'dark';
  const scrollRef = useRef<ScrollView>(null);
  const pillPositions = useRef<Record<string, number>>({});

  const activeTabId = useTabStore(s => s.activeTabId);
  const tabs = useTabStore(s => s.tabs);
  const tabOrder = useTabStore(s => s.tabOrder);

  // Auto-scroll to active pill
  useEffect(() => {
    const x = pillPositions.current[activeTabId];
    if (x !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ x: Math.max(0, x - 120), animated: true });
    }
  }, [activeTabId]);

  const handlePillPress = useCallback((tabId: string) => {
    tapFeedback();
    useTabStore.getState().switchToTab(tabId);
  }, []);

  const handleCloseTab = useCallback((tabId: string) => {
    tapFeedback();
    useTabStore.getState().closeTab(tabId);
  }, []);

  // Build article tabs in DFS order (computed from stable state refs)
  const articleTabs = useMemo(() => {
    const result: Tab[] = [];
    const dfs = (id: string) => {
      const tab = tabs[id];
      if (!tab) return;
      if (tab.type === 'article') result.push(tab);
      for (const cid of tab.childIds) dfs(cid);
    };
    for (const rootId of tabOrder) dfs(rootId);
    return result;
  }, [tabs, tabOrder]);
  if (articleTabs.length === 0) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 150 }}
      style={styles.wrapper}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {/* Feed pill */}
        <Pressable
          onPress={() => handlePillPress(useTabStore.getState().feedTabId)}
          style={({ pressed }) => [
            styles.pill,
            {
              backgroundColor: isDark ? 'rgba(45, 31, 20, 0.8)' : 'rgba(240, 232, 220, 0.9)',
              borderColor: activeTabId === useTabStore.getState().feedTabId
                ? colors.primary
                : 'transparent',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="home" size={11} color={colors.textSecondary} />
          <Text style={[styles.pillText, { color: colors.textSecondary }]} numberOfLines={1}>
            Feed
          </Text>
        </Pressable>

        {/* Article pills */}
        {articleTabs.map((tab, idx) => {
          const isActive = tab.id === activeTabId;
          const dotColor = SOURCE_COLORS[tab.source || 'category'] || '#8B7355';
          const title = tab.displayTitle || tab.title || 'Article';
          const displayTitle = title.length > 18 ? title.slice(0, 16) + '...' : title;

          return (
            <Pressable
              key={tab.id}
              onLayout={(e) => {
                pillPositions.current[tab.id] = e.nativeEvent.layout.x;
              }}
              onPress={() => handlePillPress(tab.id)}
              style={({ pressed }) => [
                styles.pill,
                {
                  backgroundColor: isDark ? 'rgba(45, 31, 20, 0.8)' : 'rgba(240, 232, 220, 0.9)',
                  borderColor: isActive ? colors.primary : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                  paddingRight: isActive ? 4 : 10,
                },
              ]}
            >
              <View style={[styles.sourceDot, { backgroundColor: dotColor }]} />
              <Text
                style={[
                  styles.pillText,
                  { color: isActive ? colors.textPrimary : colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {displayTitle}
              </Text>
              {isActive && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleCloseTab(tab.id);
                  }}
                  hitSlop={4}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    {
                      backgroundColor: pressed
                        ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')
                        : 'transparent',
                    },
                  ]}
                >
                  <Feather name="x" size={10} color={colors.textTertiary} />
                </Pressable>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  strip: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 10,
    gap: 5,
    borderWidth: 1.5,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 12,
    lineHeight: 16,
    maxWidth: 120,
  },
  closeBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
