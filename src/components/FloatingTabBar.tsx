import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useEffectiveColorScheme, spacing, borderRadius, platformShadows } from '../theme';
import { FONTS } from '../theme/typography';
import { useTabStore } from '../store/tabStore';
import { tapFeedback } from '../utils/haptics';
import { TabTreeDropdown } from './TabTreeDropdown';

export const FloatingTabBar: React.FC = () => {
  const colors = useThemeColors();
  const isDark = useEffectiveColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const activeTabId = useTabStore(s => s.activeTabId);
  const activeTab = useTabStore(s => s.tabs[s.activeTabId]);
  const tabs = useTabStore(s => s.tabs);
  const tabOrder = useTabStore(s => s.tabOrder);
  const feedTabId = useTabStore(s => s.feedTabId);

  // Derived from stable state — avoids returning new objects from selectors
  const hasParentTab = !!activeTab && activeTab.type !== 'feed';
  const hasChildTab = !!activeTab?.mostRecentChildId && !!tabs[activeTab.mostRecentChildId];

  const tabIndex = useMemo(() => {
    let total = 1; // feed tab
    let current = activeTabId === feedTabId ? 1 : 0;
    let pos = 1;
    const dfs = (id: string) => {
      const t = tabs[id];
      if (!t) return;
      pos++; total++;
      if (id === activeTabId) current = pos;
      for (const cid of t.childIds) dfs(cid);
    };
    for (const rid of tabOrder) dfs(rid);
    return { current: current || 1, total };
  }, [tabs, tabOrder, activeTabId, feedTabId]);

  const handlePlus = useCallback(() => {
    tapFeedback();
    useTabStore.getState().goToFeed();
  }, []);

  const handleBack = useCallback(() => {
    if (!hasParentTab) return;
    tapFeedback();
    useTabStore.getState().goToParent();
  }, [hasParentTab]);

  const handleForward = useCallback(() => {
    if (!hasChildTab) return;
    tapFeedback();
    useTabStore.getState().goToChild();
  }, [hasChildTab]);

  const toggleDropdown = useCallback(() => {
    setDropdownVisible(prev => !prev);
  }, []);

  const tabTitle = !activeTab || activeTab.type === 'feed'
    ? 'Feed'
    : (activeTab.displayTitle || activeTab.title || 'Article');

  // Truncate to ~22 chars
  const displayTitle = tabTitle.length > 22
    ? tabTitle.slice(0, 20) + '...'
    : tabTitle;

  const barBg = isDark
    ? 'rgba(45, 31, 20, 0.92)'
    : 'rgba(250, 246, 240, 0.94)';

  return (
    <>
      <TabTreeDropdown
        visible={dropdownVisible}
        onClose={() => setDropdownVisible(false)}
      />

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 200 }}
        style={[
          styles.wrapper,
          { paddingBottom: Math.max(insets.bottom, 8) + 4 },
        ]}
      >
        <View
          style={[
            styles.bar,
            platformShadows.lg,
            {
              backgroundColor: barBg,
              // @ts-ignore web-only
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            } as any,
          ]}
        >
          {/* + Button */}
          <Pressable
            onPress={handlePlus}
            style={({ pressed }) => [
              styles.circleBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="plus" size={16} color={isDark ? '#1A120B' : '#FFFDF9'} />
          </Pressable>

          {/* < Back */}
          <Pressable
            onPress={handleBack}
            disabled={!hasParentTab}
            style={({ pressed }) => [
              styles.navBtn,
              {
                backgroundColor: isDark ? 'rgba(61, 42, 26, 0.6)' : 'rgba(221, 212, 200, 0.6)',
                opacity: !hasParentTab ? 0.35 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="chevron-left" size={16} color={colors.textSecondary} />
          </Pressable>

          {/* Center Pill */}
          <Pressable
            onPress={toggleDropdown}
            style={({ pressed }) => [
              styles.centerPill,
              {
                backgroundColor: isDark ? 'rgba(61, 42, 26, 0.5)' : 'rgba(221, 212, 200, 0.5)',
                borderColor: isDark ? 'rgba(212, 165, 116, 0.3)' : 'rgba(107, 66, 38, 0.2)',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[styles.pillTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {displayTitle}
            </Text>
            <Text style={[styles.pillCount, { color: colors.textTertiary }]}>
              {tabIndex.current}/{tabIndex.total}
            </Text>
            <Feather
              name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={colors.textTertiary}
            />
          </Pressable>

          {/* > Forward */}
          <Pressable
            onPress={handleForward}
            disabled={!hasChildTab}
            style={({ pressed }) => [
              styles.navBtn,
              {
                backgroundColor: isDark ? 'rgba(61, 42, 26, 0.6)' : 'rgba(221, 212, 200, 0.6)',
                opacity: !hasChildTab ? 0.35 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="chevron-right" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      </MotiView>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 6,
    gap: 5,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 6,
  },
  pillTitle: {
    flex: 1,
    fontFamily: FONTS.googleSans.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  pillCount: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 11,
    lineHeight: 14,
  },
});
