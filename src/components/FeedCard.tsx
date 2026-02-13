import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { MotiView } from 'moti';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useThemeColors, spacing, borderRadius, platformShadows } from '../theme';
import { FONTS } from '../theme/typography';
import { tapFeedback } from '../utils/haptics';
import type { FeedItem } from '../types';

const IS_WEB = Platform.OS === 'web';

interface FeedCardProps {
  item: FeedItem;
  onPress: (item: FeedItem) => void;
  index?: number;
}

const SOURCE_LABELS: Record<string, { icon: string; color: string; label: string }> = {
  category:       { icon: 'book-open',   color: '#6B4226', label: 'Topic' },
  link:           { icon: 'link',        color: '#2E7D6F', label: 'Related' },
  current_events: { icon: 'trending-up', color: '#C75B4A', label: 'Trending' },
  discovery:      { icon: 'compass',     color: '#8B7355', label: 'Discover' },
  momentum:       { icon: 'zap',         color: '#D4A574', label: 'Keep Going' },
  continuation:   { icon: 'rotate-ccw',  color: '#5CC4B0', label: 'Continue' },
  search:         { icon: 'search',      color: '#7B68AE', label: 'Search' },
  exploration:    { icon: 'map',         color: '#7B68AE', label: 'Explore' },
};

export const FeedCard: React.FC<FeedCardProps> = React.memo(({ item, onPress, index = 0 }) => {
  const colors = useThemeColors();
  const { article, source, sourceDetail } = item;
  const sourceInfo = SOURCE_LABELS[source] || SOURCE_LABELS.category;
  const variant = item.cardVariant || 'standard';

  // Spring scale animation for press feedback (web only — feels wobbly on mobile)
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (IS_WEB) scale.value = withSpring(0.965, { damping: 20, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    if (IS_WEB) scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, [scale]);

  const handlePress = useCallback(() => {
    tapFeedback();
    onPress(item);
  }, [item, onPress]);

  const excerptText = item.optimizedExcerpt || article.excerpt;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: index * 50 }}
    >
      <Animated.View style={scaleStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            false,
            platformShadows.sm,
          ]}
        >
          {variant === 'fact' && (
            <FactCardContent
              article={article}
              excerptText={excerptText}
              contextCopy={item.contextCopy}
              colors={colors}
            />
          )}
          {variant === 'thread' && (
            <ThreadCardContent
              article={article}
              excerptText={excerptText}
              contextCopy={item.contextCopy}
              sourceInfo={sourceInfo}
              sourceDetail={sourceDetail}
              colors={colors}
            />
          )}
          {variant === 'trending' && (
            <TrendingCardContent
              article={article}
              excerptText={excerptText}
              contextCopy={item.contextCopy}
              colors={colors}
            />
          )}
          {variant === 'bridge' && (
            <BridgeCardContent
              article={article}
              excerptText={excerptText}
              contextCopy={item.contextCopy}
              sourceDetail={sourceDetail}
              colors={colors}
            />
          )}
          {variant === 'quote' && (
            <QuoteCardContent
              article={article}
              excerptText={excerptText}
              contextCopy={item.contextCopy}
              colors={colors}
            />
          )}
          {(variant === 'standard' || !['fact', 'thread', 'trending', 'bridge', 'quote'].includes(variant)) && (
            <StandardCardContent
              article={article}
              excerptText={excerptText}
              contextCopy={item.contextCopy}
              sourceInfo={sourceInfo}
              sourceDetail={sourceDetail}
              colors={colors}
            />
          )}
        </Pressable>
      </Animated.View>
    </MotiView>
  );
});

FeedCard.displayName = 'FeedCard';

// ─── Standard Card (original design + contextCopy) ───────────

function StandardCardContent({
  article,
  excerptText,
  contextCopy,
  sourceInfo,
  sourceDetail,
  colors,
}: {
  article: FeedItem['article'];
  excerptText: string;
  contextCopy?: string;
  sourceInfo: { color: string; label: string };
  sourceDetail?: string;
  colors: any;
}) {
  return (
    <>
      {article.thumbnailUrl ? (
        <Image
          source={{ uri: article.thumbnailUrl }}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
        />
      ) : null}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {article.displayTitle}
        </Text>
        <Text style={[styles.excerpt, { color: colors.textSecondary }]} numberOfLines={3}>
          {excerptText}
        </Text>
        <View style={styles.footer}>
          <View style={styles.sourceBadge}>
            <View style={[styles.sourceDot, { backgroundColor: sourceInfo.color }]} />
            <Text style={[styles.sourceText, { color: colors.textTertiary }]} numberOfLines={1}>
              {sourceDetail || sourceInfo.label}
            </Text>
          </View>
          {contextCopy ? (
            <Text style={[styles.contextCopy, { color: colors.textTertiary }]} numberOfLines={1}>
              {contextCopy}
            </Text>
          ) : null}
        </View>
      </View>
    </>
  );
}

// ─── Fact Card (no image, large title, "DID YOU KNOW?" label) ─

function FactCardContent({
  article,
  excerptText,
  contextCopy,
  colors,
}: {
  article: FeedItem['article'];
  excerptText: string;
  contextCopy?: string;
  colors: any;
}) {
  return (
    <View style={[styles.factContainer, { backgroundColor: colors.primary + '0A' }]}>
      <View style={styles.factLabelRow}>
        <View style={[styles.factAccent, { backgroundColor: colors.primary }]} />
        <Text style={[styles.factLabel, { color: colors.primary }]}>
          DID YOU KNOW?
        </Text>
      </View>
      <Text style={[styles.factClaim, { color: colors.textPrimary }]} numberOfLines={4}>
        {excerptText}
      </Text>
      <Text style={[styles.factAttribution, { color: colors.textTertiary }]} numberOfLines={1}>
        {article.displayTitle}
      </Text>
      {contextCopy ? (
        <Text style={[styles.contextCopy, { color: colors.textTertiary }]} numberOfLines={1}>
          {contextCopy}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Thread Card (image + rabbit hole badge with depth) ───────

function ThreadCardContent({
  article,
  excerptText,
  contextCopy,
  sourceInfo,
  sourceDetail,
  colors,
}: {
  article: FeedItem['article'];
  excerptText: string;
  contextCopy?: string;
  sourceInfo: { color: string; label: string };
  sourceDetail?: string;
  colors: any;
}) {
  return (
    <>
      {article.thumbnailUrl ? (
        <View style={styles.heroImageWrapper}>
          <Image
            source={{ uri: article.thumbnailUrl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <View style={[styles.threadBadge, { backgroundColor: colors.primary + 'E6' }]}>
            <Feather name="git-branch" size={12} color="#FFFDF9" />
            <Text style={styles.threadBadgeText}>
              {contextCopy || 'Rabbit hole'}
            </Text>
          </View>
        </View>
      ) : null}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {article.displayTitle}
        </Text>
        <Text style={[styles.excerpt, { color: colors.textSecondary }]} numberOfLines={3}>
          {excerptText}
        </Text>
        <View style={styles.footer}>
          <View style={styles.sourceBadge}>
            <View style={[styles.sourceDot, { backgroundColor: sourceInfo.color }]} />
            <Text style={[styles.sourceText, { color: colors.textTertiary }]} numberOfLines={1}>
              {sourceDetail || sourceInfo.label}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

// ─── Trending Card (image + red TRENDING header) ──────────────

function TrendingCardContent({
  article,
  excerptText,
  contextCopy,
  colors,
}: {
  article: FeedItem['article'];
  excerptText: string;
  contextCopy?: string;
  colors: any;
}) {
  return (
    <>
      {article.thumbnailUrl ? (
        <Image
          source={{ uri: article.thumbnailUrl }}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
        />
      ) : null}
      <View style={styles.content}>
        <View style={styles.trendingHeader}>
          <View style={styles.trendingDot} />
          <Text style={styles.trendingLabel}>
            {contextCopy || 'TRENDING NOW'}
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {article.displayTitle}
        </Text>
        <Text style={[styles.excerpt, { color: colors.textSecondary }]} numberOfLines={3}>
          {excerptText}
        </Text>
      </View>
    </>
  );
}

// ─── Bridge Card (image + category bridge pill) ───────────────

function BridgeCardContent({
  article,
  excerptText,
  contextCopy,
  sourceDetail,
  colors,
}: {
  article: FeedItem['article'];
  excerptText: string;
  contextCopy?: string;
  sourceDetail?: string;
  colors: any;
}) {
  return (
    <>
      {article.thumbnailUrl ? (
        <View style={styles.heroImageWrapper}>
          <Image
            source={{ uri: article.thumbnailUrl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <View style={[styles.bridgePill, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.bridgePillText, { color: colors.textSecondary }]} numberOfLines={1}>
              {sourceDetail || contextCopy || 'Bridge'}
            </Text>
          </View>
        </View>
      ) : null}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {article.displayTitle}
        </Text>
        <Text style={[styles.excerpt, { color: colors.textSecondary }]} numberOfLines={3}>
          {excerptText}
        </Text>
        {contextCopy && !sourceDetail ? null : (
          <View style={styles.footer}>
            <View style={styles.sourceBadge}>
              <View style={[styles.sourceDot, { backgroundColor: '#2E7D6F' }]} />
              <Text style={[styles.sourceText, { color: colors.textTertiary }]} numberOfLines={1}>
                {contextCopy || 'Bridge'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

// ─── Quote Card (pull-quote with left border, title below) ────

function QuoteCardContent({
  article,
  excerptText,
  contextCopy,
  colors,
}: {
  article: FeedItem['article'];
  excerptText: string;
  contextCopy?: string;
  colors: any;
}) {
  return (
    <View style={styles.content}>
      <Text style={[styles.quoteGlyph, { color: colors.primary + '30' }]}>{'\u201C'}</Text>
      <Text style={[styles.quoteText, { color: colors.textPrimary }]} numberOfLines={4}>
        {excerptText}
      </Text>
      <Text style={[styles.quoteTitle, { color: colors.textSecondary }]} numberOfLines={1}>
        {article.displayTitle}
      </Text>
      {contextCopy ? (
        <Text style={[styles.contextCopy, { color: colors.textTertiary }]} numberOfLines={1}>
          {contextCopy}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  heroImageWrapper: {
    position: 'relative',
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.crimsonPro.bold,
    lineHeight: 24,
  },
  excerpt: {
    fontSize: 14,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 20,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sourceText: {
    fontSize: 12,
    fontFamily: FONTS.googleSans.medium,
  },
  contextCopy: {
    fontSize: 11,
    fontFamily: FONTS.googleSans.regular,
    marginTop: 2,
  },

  // Fact variant
  factContainer: {
    padding: spacing.md,
    paddingTop: spacing.md + 2,
    gap: spacing.xs + 2,
  },
  factLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factAccent: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  factLabel: {
    fontSize: 11,
    fontFamily: FONTS.googleSans.semibold,
    letterSpacing: 1.5,
  },
  factClaim: {
    fontSize: 19,
    fontFamily: FONTS.crimsonPro.bold,
    lineHeight: 26,
  },
  factAttribution: {
    fontSize: 13,
    fontFamily: FONTS.googleSans.medium,
    marginTop: 2,
  },

  // Thread variant
  threadBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  threadBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.googleSans.semibold,
    color: '#FFFDF9',
  },

  // Trending variant
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  trendingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C75B4A',
  },
  trendingLabel: {
    fontSize: 11,
    fontFamily: FONTS.googleSans.semibold,
    letterSpacing: 1,
    color: '#C75B4A',
  },

  // Bridge variant
  bridgePill: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  bridgePillText: {
    fontSize: 11,
    fontFamily: FONTS.googleSans.semibold,
  },

  // Quote variant
  quoteGlyph: {
    fontSize: 48,
    fontFamily: FONTS.crimsonPro.bold,
    lineHeight: 36,
    marginBottom: -4,
  },
  quoteText: {
    fontSize: 17,
    fontFamily: FONTS.crimsonPro.bold,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  quoteTitle: {
    fontSize: 13,
    fontFamily: FONTS.googleSans.medium,
    marginTop: 4,
  },
});
