import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { useThemeColors, spacing, borderRadius, platformShadows } from '../theme';
import { FONTS } from '../theme/typography';
import { batchGetSummaries } from '../services/wikipedia';
import { computeCuriosityScore } from '../services/feedAlgorithm';
import { useInterestStore } from '../store/interestStore';
import { useSessionStore } from '../store/sessionStore';
import { useTabStore } from '../store/tabStore';
import { estimateReadTime } from '../utils/readTime';
import { tapFeedback } from '../utils/haptics';
import type { Article } from '../types';

interface KeepGoingCardsProps {
  article: Article;
  visible: boolean;
}

interface SuggestionCard {
  article: Article;
  hookLine: string;
  sourceLabel: string;
}

export const KeepGoingCards: React.FC<KeepGoingCardsProps> = React.memo(({
  article,
  visible,
}) => {
  const colors = useThemeColors();
  const [suggestions, setSuggestions] = useState<SuggestionCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!article || suggestions.length > 0) return;

    let cancelled = false;

    async function fetchSuggestions() {
      setLoading(true);
      try {
        // Use See Also links — these are Wikipedia's curated related articles
        const seeAlso = article.seeAlsoLinks || [];
        if (seeAlso.length === 0) {
          setLoading(false);
          return;
        }

        // Rank by curiosity score and pick top 3
        const ranked = seeAlso.map(title => ({
          title,
          score: computeCuriosityScore(title, ''),
        })).sort((a, b) => b.score - a.score);

        const titlesToFetch = ranked.slice(0, 3).map(r => r.title);
        const articles = await batchGetSummaries(titlesToFetch);

        if (cancelled) return;

        const cards: SuggestionCard[] = articles
          .filter(a => a.excerpt.length > 30)
          .map(a => ({
            article: a,
            hookLine: a.excerpt.length > 90
              ? a.excerpt.substring(0, 90).trim() + '...'
              : a.excerpt,
            sourceLabel: 'See also',
          }));

        setSuggestions(cards);
      } catch (err) {
        console.error('[KeepGoingCards] Failed to fetch:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [article.pageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePress = useCallback((suggestion: SuggestionCard) => {
    tapFeedback();
    useInterestStore.getState().signalLinkFollowed(article, suggestion.article.title);
    useSessionStore.getState().recordLinkFollowed(article.title);

    useTabStore.getState().openArticleFromLink(
      suggestion.article.pageId,
      suggestion.article.title,
      suggestion.article.displayTitle,
      'momentum',
      `From ${article.displayTitle}`,
    );
  }, [article]);

  if (!visible || (suggestions.length === 0 && !loading)) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
      style={[styles.container, {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
      }]}
    >
      <Text style={[styles.heading, { color: colors.textSecondary }]}>
        KEEP GOING
      </Text>
      {suggestions.map(s => (
        <Pressable
          key={s.article.pageId}
          onPress={() => handlePress(s)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
            platformShadows.sm,
          ]}
        >
          {s.article.thumbnailUrl ? (
            <Image
              source={{ uri: s.article.thumbnailUrl }}
              style={styles.thumb}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: colors.backgroundSecondary }]} />
          )}
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {s.article.displayTitle}
            </Text>
            <Text style={[styles.cardHook, { color: colors.textSecondary }]} numberOfLines={1}>
              {s.hookLine}
            </Text>
            <Text style={[styles.cardMeta, { color: colors.textTertiary }]}>
              {s.sourceLabel} · {estimateReadTime(s.article.excerpt)} min
            </Text>
          </View>
        </Pressable>
      ))}
    </MotiView>
  );
});

KeepGoingCards.displayName = 'KeepGoingCards';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  heading: {
    fontSize: 11,
    fontFamily: FONTS.googleSans.semibold,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  card: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumb: {
    width: 72,
    height: 72,
  },
  thumbPlaceholder: {
    width: 72,
    height: 72,
  },
  cardContent: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FONTS.crimsonPro.bold,
    lineHeight: 20,
  },
  cardHook: {
    fontSize: 13,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 17,
  },
  cardMeta: {
    fontSize: 11,
    fontFamily: FONTS.googleSans.medium,
    lineHeight: 14,
    marginTop: 1,
  },
});
