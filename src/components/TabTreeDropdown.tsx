import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useEffectiveColorScheme, spacing, borderRadius, platformShadows } from '../theme';
import { FONTS } from '../theme/typography';
import { useTabStore, type TabTreeNode } from '../store/tabStore';
import { tapFeedback } from '../utils/haptics';
import { SavePathModal } from './SavePathModal';

// Source color mapping
const SOURCE_COLORS: Record<string, string> = {
  category: '#6B4226',
  link: '#2E7D6F',
  current_events: '#C75B4A',
  discovery: '#8B7355',
  momentum: '#D4A574',
  continuation: '#5CC4B0',
  search: '#2E7D6F',
};

interface TabTreeDropdownProps {
  visible: boolean;
  onClose: () => void;
}

export const TabTreeDropdown: React.FC<TabTreeDropdownProps> = ({ visible, onClose }) => {
  const colors = useThemeColors();
  const isDark = useEffectiveColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  const activeTabId = useTabStore(s => s.activeTabId);
  const tabs = useTabStore(s => s.tabs);
  const tabOrder = useTabStore(s => s.tabOrder);
  const articleTabCount = useTabStore(s => s.getArticleTabCount());

  const handleSelectTab = useCallback((tabId: string) => {
    tapFeedback();
    useTabStore.getState().switchToTab(tabId);
    onClose();
  }, [onClose]);

  const handleCloseTab = useCallback((tabId: string) => {
    useTabStore.getState().closeTab(tabId);
  }, []);

  const handleClearAll = useCallback(() => {
    useTabStore.getState().clearAll();
    onClose();
  }, [onClose]);

  const handleSavePath = useCallback(() => {
    setSaveModalVisible(true);
  }, []);

  const panelBg = isDark ? 'rgba(38, 26, 16, 0.96)' : 'rgba(255, 253, 249, 0.96)';

  // Flatten tree into renderable rows
  const rows: { tab: TabTreeNode['tab']; depth: number }[] = [];
  function walkTree(nodes: TabTreeNode[], baseDepth: number = 0) {
    for (const node of nodes) {
      rows.push({ tab: node.tab, depth: baseDepth });
      if (node.children.length > 0) {
        walkTree(node.children, baseDepth + 1);
      }
    }
  }
  if (visible) {
    // Build tree from current stable state (avoids new-array-from-selector loop)
    const feedTabId = useTabStore.getState().feedTabId;
    const buildNode = (tabId: string, d: number): TabTreeNode | null => {
      const tab = tabs[tabId];
      if (!tab) return null;
      return {
        tab,
        depth: d,
        children: tab.childIds
          .map(cid => buildNode(cid, d + 1))
          .filter((n): n is TabTreeNode => n !== null),
      };
    };
    const tree: TabTreeNode[] = [];
    const feedTab = tabs[feedTabId];
    if (feedTab) tree.push({ tab: feedTab, depth: 0, children: [] });
    for (const rootId of tabOrder) {
      const node = buildNode(rootId, 0);
      if (node) tree.push(node);
    }
    walkTree(tree);
  }

  if (!visible) return (
    <SavePathModal
      visible={saveModalVisible}
      onClose={() => setSaveModalVisible(false)}
    />
  );

  return (
    <>
      <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose}>
          <View style={{ flex: 1 }} />
        </Pressable>

        {/* Panel anchored to bottom */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: 16 }}
          transition={{ type: 'spring', damping: 24, stiffness: 220 }}
          style={[
            styles.panel,
            platformShadows.lg,
            {
              backgroundColor: panelBg,
              // @ts-ignore web-only
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              marginBottom: Math.max(insets.bottom, 8) + 60, // above the tab bar
              borderColor: colors.border,
            } as any,
          ]}
        >
          {/* Header */}
          <View style={[styles.panelHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>
              Open Tabs
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={18} color={colors.textTertiary} />
            </Pressable>
          </View>

          {/* Tab list */}
          <ScrollView
            style={styles.tabList}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {rows.map(({ tab, depth }) => {
              const isActive = tab.id === activeTabId;
              const isFeed = tab.type === 'feed';
              const dotColor = SOURCE_COLORS[tab.source || 'category'] || '#8B7355';
              const title = isFeed ? 'Feed' : (tab.displayTitle || tab.title || 'Article');
              const displayTitle = title.length > 30 ? title.slice(0, 28) + '...' : title;

              return (
                <Pressable
                  key={tab.id}
                  onPress={() => handleSelectTab(tab.id)}
                  style={({ pressed }) => [
                    styles.tabRow,
                    {
                      paddingLeft: spacing.md + depth * 20,
                      opacity: pressed ? 0.7 : 1,
                      backgroundColor: isActive
                        ? (isDark ? 'rgba(212, 165, 116, 0.1)' : 'rgba(107, 66, 38, 0.06)')
                        : 'transparent',
                    },
                  ]}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
                  )}

                  {/* Depth connector line */}
                  {depth > 0 && (
                    <View style={[styles.connector, { borderColor: colors.border, left: spacing.md + (depth - 1) * 20 + 8 }]} />
                  )}

                  {/* Icon / dot */}
                  {isFeed ? (
                    <Feather name="home" size={14} color={colors.textSecondary} />
                  ) : (
                    <View style={[styles.sourceDot, { backgroundColor: dotColor }]} />
                  )}

                  {/* Title */}
                  <Text
                    style={[
                      styles.tabTitle,
                      { color: isActive ? colors.textPrimary : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {displayTitle}
                  </Text>

                  {/* Close button (not for feed) */}
                  {!isFeed && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleCloseTab(tab.id);
                      }}
                      style={styles.closeBtn}
                      hitSlop={6}
                    >
                      <Feather name="x" size={12} color={colors.textTertiary} />
                    </Pressable>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Footer actions */}
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            {articleTabCount > 0 && (
              <Pressable
                onPress={handleSavePath}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Feather name="bookmark" size={14} color={isDark ? '#1A120B' : '#FFFDF9'} />
                <Text style={[styles.saveBtnText, { color: isDark ? '#1A120B' : '#FFFDF9' }]}>
                  Save as Path
                </Text>
              </Pressable>
            )}
            {articleTabCount > 0 && (
              <Pressable onPress={handleClearAll} hitSlop={8}>
                <Text style={[styles.clearText, { color: colors.textTertiary }]}>
                  Clear All
                </Text>
              </Pressable>
            )}
          </View>
        </MotiView>
      </Modal>

      <SavePathModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  panel: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
    maxWidth: 360,
    maxHeight: 400,
    alignSelf: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  panelTitle: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 15,
  },
  tabList: {
    maxHeight: 260,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    gap: spacing.sm,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    width: 3,
    borderRadius: 2,
  },
  connector: {
    position: 'absolute',
    top: 0,
    bottom: '50%',
    width: 12,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 6,
  },
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabTitle: {
    flex: 1,
    fontFamily: FONTS.googleSans.medium,
    fontSize: 14,
    lineHeight: 18,
  },
  closeBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 14,
    gap: 6,
  },
  saveBtnText: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 13,
  },
  clearText: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 13,
  },
});
