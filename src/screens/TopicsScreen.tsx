import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors, spacing, borderRadius } from '../theme';
import { FONTS } from '../theme/typography';
import { ScreenContainer } from '../components/ScreenContainer';
import { useOnboardingStore } from '../store/onboardingStore';
import { useInterestStore } from '../store/interestStore';
import { categories, getCategoryById, getWikiCategoriesForId } from '../services/categoryData';
import { getWikiSubcategories } from '../services/wikipedia';

// ─── Types ──────────────────────────────────────────────────

interface TopicItem {
  name: string;
  wikiCategory: string;      // Wikipedia category name for fetching deeper
  staticId?: string;          // Static taxonomy ID if from categoryData
  iconName?: string;          // Feather icon (only for broad categories)
}

interface BreadcrumbLevel {
  label: string;
  items: TopicItem[];
}

// ─── Reusable Chip ──────────────────────────────────────────

function TopicChip({
  item,
  selected,
  weight,
  onDrill,
  onToggle,
  colors,
}: {
  item: TopicItem;
  selected: boolean;
  weight: number;
  onDrill: (item: TopicItem) => void;
  onToggle: (item: TopicItem) => void;
  colors: any;
}) {
  return (
    <View style={styles.chipWrapper}>
      <Pressable
        onPress={() => onDrill(item)}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? colors.primary : colors.surface,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
      >
        {item.iconName && (
          <Feather
            name={item.iconName as any}
            size={16}
            color={selected ? '#FFFDF9' : colors.textSecondary}
          />
        )}
        <Text
          style={[
            styles.chipName,
            { color: selected ? '#FFFDF9' : colors.textPrimary },
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Feather
          name="chevron-right"
          size={12}
          color={selected ? 'rgba(255,253,249,0.5)' : colors.textTertiary}
        />
      </Pressable>

      {/* Toggle button */}
      <Pressable
        onPress={() => onToggle(item)}
        style={[
          styles.toggleBtn,
          {
            backgroundColor: selected ? colors.primary : colors.backgroundSecondary,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
        hitSlop={4}
      >
        <Feather
          name={selected ? 'check' : 'plus'}
          size={12}
          color={selected ? '#FFFDF9' : colors.textTertiary}
        />
      </Pressable>

      {/* Weight indicator */}
      {weight > 0.05 && (
        <View style={[styles.weightBar, { backgroundColor: colors.backgroundSecondary }]}>
          <View
            style={[
              styles.weightFill,
              {
                backgroundColor: selected ? colors.primary : colors.textTertiary,
                width: `${Math.round(weight * 100)}%`,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

// ─── Component ──────────────────────────────────────────────

export const TopicsScreen: React.FC = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const {
    selectedCategoryIds,
    selectedSubcategoryIds,
    customTopics,
    toggleCategory,
    toggleSubcategory,
    addCustomTopic,
    removeCustomTopic,
    isCustomTopicSelected,
  } = useOnboardingStore();
  const { profile, adjustTopicWeight } = useInterestStore();

  // Build root level from static categories
  const rootItems: TopicItem[] = categories.map(cat => ({
    name: cat.name,
    wikiCategory: cat.wikiCategories[0],
    staticId: cat.id,
    iconName: cat.iconName,
  }));

  const [levels, setLevels] = useState<BreadcrumbLevel[]>([
    { label: 'Topics', items: rootItems },
  ]);
  const [loading, setLoading] = useState(false);
  const [subcatCache] = useState<Record<string, TopicItem[]>>({});

  const currentLevel = levels[levels.length - 1];
  const isRootLevel = levels.length === 1;

  // Build "Your Interests" data: selected categories + organically discovered ones
  // A category is promoted to "Your interests" if:
  //  1. It was explicitly selected (onboarding or manual toggle), OR
  //  2. Its weight or any of its subcategory weights grew above threshold via organic reading
  const ORGANIC_CAT_THRESHOLD = 0.20;  // ~3-4 article interactions
  const ORGANIC_SUB_THRESHOLD = 0.25;  // ~2-3 focused interactions in a subcategory

  const { interestGroups, unselectedItems } = useMemo(() => {
    if (!isRootLevel) return { interestGroups: [], unselectedItems: [] };

    const weights = profile.categoryWeights;
    const groups: {
      category: TopicItem;
      subcategories: TopicItem[];
      isOrganic: boolean; // true if promoted by weight alone, not explicit selection
    }[] = [];
    const unselected: TopicItem[] = [];

    for (const cat of categories) {
      const catSelected = selectedCategoryIds.includes(cat.id);
      const hasSelectedSubs = cat.subcategories.some(sub =>
        selectedSubcategoryIds.includes(sub.id)
      );

      // Check organic discovery: category weight or any subcategory weight above threshold
      const catWeight = weights[cat.id] || 0;
      const hasOrganicCat = catWeight >= ORGANIC_CAT_THRESHOLD;
      const hasOrganicSub = cat.subcategories.some(sub =>
        (weights[sub.id] || 0) >= ORGANIC_SUB_THRESHOLD
      );
      const isOrganic = !catSelected && !hasSelectedSubs && (hasOrganicCat || hasOrganicSub);

      if (catSelected || hasSelectedSubs || isOrganic) {
        const subItems: TopicItem[] = cat.subcategories.map(sub => ({
          name: sub.name,
          wikiCategory: sub.wikiCategories[0],
          staticId: sub.id,
        }));
        groups.push({
          category: {
            name: cat.name,
            wikiCategory: cat.wikiCategories[0],
            staticId: cat.id,
            iconName: cat.iconName,
          },
          subcategories: subItems,
          isOrganic,
        });
      } else {
        unselected.push({
          name: cat.name,
          wikiCategory: cat.wikiCategories[0],
          staticId: cat.id,
          iconName: cat.iconName,
        });
      }
    }

    return { interestGroups: groups, unselectedItems: unselected };
  }, [isRootLevel, selectedCategoryIds, selectedSubcategoryIds, profile.categoryWeights]);

  // Determine if a topic is "selected" (toggled on)
  const isTopicSelected = useCallback((item: TopicItem): boolean => {
    if (item.staticId) {
      if (selectedCategoryIds.includes(item.staticId)) return true;
      if (selectedSubcategoryIds.includes(item.staticId)) return true;
    }
    return isCustomTopicSelected(item.wikiCategory);
  }, [selectedCategoryIds, selectedSubcategoryIds, isCustomTopicSelected]);

  // Toggle a topic on/off for the algorithm
  const handleToggle = useCallback((item: TopicItem) => {
    const selected = isTopicSelected(item);

    if (item.staticId) {
      const cat = getCategoryById(item.staticId);
      if (cat) {
        toggleCategory(item.staticId);
      } else {
        toggleSubcategory(item.staticId);
      }
      adjustTopicWeight(item.staticId, !selected);
    } else {
      if (selected) {
        removeCustomTopic(item.wikiCategory);
        adjustTopicWeight(`custom:${item.wikiCategory}`, false);
      } else {
        addCustomTopic(item.name, item.wikiCategory);
        adjustTopicWeight(`custom:${item.wikiCategory}`, true);
      }
    }
  }, [isTopicSelected, selectedCategoryIds, toggleCategory, toggleSubcategory, addCustomTopic, removeCustomTopic, adjustTopicWeight]);

  // Drill into a topic — fetch or resolve its children
  const handleDrill = useCallback(async (item: TopicItem) => {
    if (subcatCache[item.wikiCategory]) {
      setLevels(prev => [...prev, { label: item.name, items: subcatCache[item.wikiCategory] }]);
      return;
    }

    if (item.staticId) {
      const cat = getCategoryById(item.staticId);
      if (cat && cat.subcategories.length > 0) {
        const staticItems: TopicItem[] = cat.subcategories.map(sub => ({
          name: sub.name,
          wikiCategory: sub.wikiCategories[0],
          staticId: sub.id,
        }));
        subcatCache[item.wikiCategory] = staticItems;
        setLevels(prev => [...prev, { label: item.name, items: staticItems }]);
        return;
      }
    }

    setLoading(true);
    try {
      const results = await getWikiSubcategories(item.wikiCategory, 40);
      const items: TopicItem[] = results.map(r => ({
        name: r.name,
        wikiCategory: r.wikiCategory,
      }));
      subcatCache[item.wikiCategory] = items;
      setLevels(prev => [...prev, { label: item.name, items }]);
    } catch {
      setLevels(prev => [...prev, { label: item.name, items: [] }]);
    } finally {
      setLoading(false);
    }
  }, [subcatCache]);

  // Navigate back via breadcrumb
  const handleBreadcrumb = useCallback((index: number) => {
    setLevels(prev => prev.slice(0, index + 1));
  }, []);

  // Helper to get weight for an item
  const getWeight = useCallback((item: TopicItem) => {
    return item.staticId
      ? (profile.categoryWeights[item.staticId] || 0)
      : (profile.categoryWeights[`custom:${item.wikiCategory}`] || 0);
  }, [profile.categoryWeights]);

  return (
    <ScreenContainer backgroundColor={colors.background}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={styles.backRow}>
              <Feather name="arrow-left" size={16} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
            </View>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Topics</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Breadcrumb trail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.breadcrumbBar, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.breadcrumbContent}
        >
          {levels.map((level, i) => (
            <View key={i} style={styles.breadcrumbItem}>
              {i > 0 && (
                <Feather name="chevron-right" size={14} color={colors.textTertiary} style={styles.breadcrumbChevron} />
              )}
              <Pressable onPress={() => handleBreadcrumb(i)}>
                <Text
                  style={[
                    styles.breadcrumbText,
                    {
                      color: i === levels.length - 1 ? colors.textPrimary : colors.primary,
                      fontFamily: i === levels.length - 1 ? FONTS.googleSans.semibold : FONTS.googleSans.regular,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {level.label}
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {/* Content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
                Fetching subtopics...
              </Text>
            </View>
          ) : isRootLevel ? (
            /* ─── Root Level: Hierarchical View ─── */
            <>
              {/* Your Interests — selected categories expanded with subcategories */}
              {interestGroups.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    Your interests
                  </Text>
                  {interestGroups.map((group, gi) => (
                    <MotiView
                      key={group.category.staticId}
                      from={{ opacity: 0, translateY: 8 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: 'timing', duration: 250, delay: gi * 40 }}
                    >
                      <View style={styles.interestGroup}>
                        {/* Category header row */}
                        <View style={styles.groupHeaderRow}>
                          <Pressable
                            onPress={() => handleDrill(group.category)}
                            style={styles.groupHeaderTap}
                          >
                            <Feather
                              name={group.category.iconName as any}
                              size={18}
                              color={colors.primary}
                            />
                            <Text style={[styles.groupHeaderText, { color: colors.textPrimary }]}>
                              {group.category.name}
                            </Text>
                            {group.isOrganic && (
                              <View style={[styles.discoveredBadge, { backgroundColor: colors.accent + '20' }]}>
                                <Text style={[styles.discoveredText, { color: colors.accent }]}>
                                  Discovered
                                </Text>
                              </View>
                            )}
                            <Feather name="chevron-right" size={14} color={colors.textTertiary} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleToggle(group.category)}
                            style={[
                              styles.groupToggle,
                              {
                                backgroundColor: isTopicSelected(group.category) ? colors.primary : colors.backgroundSecondary,
                                borderColor: isTopicSelected(group.category) ? colors.primary : colors.border,
                              },
                            ]}
                            hitSlop={4}
                          >
                            <Feather
                              name={isTopicSelected(group.category) ? 'check' : 'plus'}
                              size={11}
                              color={isTopicSelected(group.category) ? '#FFFDF9' : colors.textTertiary}
                            />
                          </Pressable>
                        </View>

                        {/* Subcategory chips */}
                        <View style={styles.subChipGrid}>
                          {group.subcategories.map(sub => {
                            const subSelected = isTopicSelected(sub);
                            const subWeight = getWeight(sub);
                            return (
                              <TopicChip
                                key={sub.staticId || sub.wikiCategory}
                                item={sub}
                                selected={subSelected}
                                weight={subWeight}
                                onDrill={handleDrill}
                                onToggle={handleToggle}
                                colors={colors}
                              />
                            );
                          })}
                        </View>
                      </View>
                    </MotiView>
                  ))}
                </View>
              )}

              {/* Explore More — unselected categories */}
              {unselectedItems.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    Explore more
                  </Text>
                  <View style={styles.chipGrid}>
                    {unselectedItems.map(item => (
                      <TopicChip
                        key={item.staticId || item.wikiCategory}
                        item={item}
                        selected={false}
                        weight={getWeight(item)}
                        onDrill={handleDrill}
                        onToggle={handleToggle}
                        colors={colors}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Custom topics */}
              {customTopics.length > 0 && (
                <View style={styles.customSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    Your custom topics
                  </Text>
                  <View style={styles.customChips}>
                    {customTopics.map(t => (
                      <Pressable
                        key={t.id}
                        onPress={() => {
                          removeCustomTopic(t.wikiCategory);
                          adjustTopicWeight(t.id, false);
                        }}
                        style={[styles.customChip, { backgroundColor: colors.primary }]}
                      >
                        <Text style={styles.customChipText}>{t.name}</Text>
                        <Feather name="x" size={12} color="rgba(255,253,249,0.7)" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : currentLevel.items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={36} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                No subtopics found at this level
              </Text>
            </View>
          ) : (
            /* ─── Drill Level: Flat Chip Grid (unchanged) ─── */
            <AnimatePresence>
              <MotiView
                key={levels.length}
                from={{ opacity: 0, translateX: 20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 250 }}
              >
                <View style={styles.chipGrid}>
                  {currentLevel.items.map((item) => (
                    <TopicChip
                      key={item.staticId || item.wikiCategory}
                      item={item}
                      selected={isTopicSelected(item)}
                      weight={getWeight(item)}
                      onDrill={handleDrill}
                      onToggle={handleToggle}
                      colors={colors}
                    />
                  ))}
                </View>
              </MotiView>
            </AnimatePresence>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
};

// ─── Styles ──────────────────────────────────────────────────

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
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 18,
    textAlign: 'center',
  },

  // Breadcrumb
  breadcrumbBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    maxHeight: 44,
  },
  breadcrumbContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbChevron: {
    marginHorizontal: 6,
  },
  breadcrumbText: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 14,
  },

  // Content
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm + 2,
  },

  // Interest groups (expanded categories at root level)
  interestGroup: {
    marginBottom: spacing.md,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  groupHeaderTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flex: 1,
  },
  groupHeaderText: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 16,
    flex: 1,
  },
  groupToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  discoveredBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  discoveredText: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  subChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingLeft: spacing.lg + spacing.xs,
  },

  // Flat chip grid (drill levels + explore more)
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipWrapper: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm + 18,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    minWidth: 100,
  },
  chipName: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 14,
    flexShrink: 1,
  },
  toggleBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightBar: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 3,
    overflow: 'hidden',
  },
  weightFill: {
    height: '100%',
    borderRadius: 1.5,
    minWidth: 2,
  },

  // Loading / Empty
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 14,
    textAlign: 'center',
  },

  // Custom topics
  customSection: {
    marginBottom: spacing.lg,
  },
  customChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.pill,
    gap: 4,
  },
  customChipText: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 13,
    color: '#FFFDF9',
  },
});
