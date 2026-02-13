import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { spacing, borderRadius } from '../../theme';
import { FONTS } from '../../theme/typography';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { isWeb } from '../../utils/platform';
import { ReadProgressRing } from './ReadProgressRing';
import type { Article, FeedSourceType } from '../../types';

export function ArticleHero({
  article,
  title,
  source,
  sourceDetail,
  sourceInfo,
  readTime,
  scrollDepth,
  categories,
  colors,
  topInset,
  onImagePress,
  collapsed,
}: {
  article: Article | null;
  title: string;
  source?: FeedSourceType;
  sourceDetail?: string;
  sourceInfo: { color: string; label: string };
  readTime: number;
  scrollDepth: number;
  categories: { id: string; name: string }[];
  colors: any;
  topInset?: number;
  onImagePress?: (url: string) => void;
  collapsed?: boolean;
}) {
  const hasImage = !!article?.thumbnailUrl;
  const headerClearance = (topInset || 0) + 52;
  const expandedHeight = 280 + (topInset || 0);
  const collapsedHeight = 100 + (topInset || 0);

  return (
    <View style={styles.hero}>
      {/* Hero Image — extends behind header + status bar */}
      {hasImage ? (
        <MotiView
          animate={{ height: collapsed ? collapsedHeight : expandedHeight }}
          transition={{ type: 'timing', duration: 250 }}
          style={styles.heroImageWrapper}
        >
          <MotiView
            from={{ scale: 1.06, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'timing', duration: 600 }}
            style={[styles.heroImage, { height: expandedHeight }]}
          >
            <Pressable
              onPress={() => onImagePress?.(article!.thumbnailUrl!)}
              style={[styles.heroImage, { height: expandedHeight }]}
            >
              <Image
                source={{ uri: article!.thumbnailUrl }}
                style={[styles.heroImage, { height: expandedHeight }]}
                contentFit="cover"
                transition={300}
              />
            </Pressable>
          </MotiView>
          {/* Gradient overlay */}
          {isWeb ? (
            <View
              style={[styles.heroGradient, {
                // @ts-ignore web-only CSS property
                background: `linear-gradient(transparent 30%, ${colors.background})`,
              } as any]}
            />
          ) : (
            <LinearGradient
              colors={['transparent', colors.background]}
              locations={[0.3, 1]}
              style={styles.heroGradient}
            />
          )}
        </MotiView>
      ) : null}

      {/* Title & Metadata */}
      <View style={[styles.heroContent, !hasImage && { paddingTop: headerClearance }]}>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>

        {/* Source + Read Time */}
        <View style={styles.metaRow}>
          {source && (
            <>
              <View style={[styles.sourceDot, { backgroundColor: sourceInfo.color }]} />
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {sourceDetail || sourceInfo.label}
              </Text>
              <Text style={[styles.metaDot, { color: colors.textTertiary }]}>  ·  </Text>
            </>
          )}
          <ReadProgressRing progress={scrollDepth} size={14} colors={colors} />
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            {' '}{readTime} min read
          </Text>
        </View>

        {/* Category Chips */}
        {categories.length > 0 && (
          <View style={styles.chipRow}>
            {categories.map(cat => (
              <View key={cat.id} style={[styles.chip, { backgroundColor: colors.categoryBadge }]}>
                <Text style={[styles.chipText, { color: colors.categoryBadgeText }]}>
                  {cat.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={[styles.heroDivider, { backgroundColor: colors.divider }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  heroImageWrapper: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  heroContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs + 2,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: FONTS.crimsonPro.bold,
    lineHeight: 36,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: FONTS.googleSans.medium,
    lineHeight: 18,
  },
  metaDot: {
    fontSize: 13,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
  },
  chipText: {
    fontSize: 12,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 16,
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
  },
});
