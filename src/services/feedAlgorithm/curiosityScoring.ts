import type { FeedItem, FeedContext } from '../../types';
import { categories } from '../categoryData';
import {
  TUNING,
  TONE_PATTERNS,
  DEFINITIONAL_PATTERN,
  GENERIC_LINK_PATTERNS,
  GENERIC_TITLES,
} from './tuning';
import type { DecayedProfile } from './decayedProfile';

// Curiosity-triggering patterns
const QUESTION_PATTERN = /\?|^(who|what|where|when|why|how|is|are|was|were|can|could|do|does|did)\b/i;
const SUPERLATIVE_PATTERN = /\b(most|largest|biggest|smallest|oldest|youngest|first|last|best|worst|greatest|deadliest|longest|shortest|tallest|fastest|rarest|richest|poorest)\b/i;
const NUMBER_PATTERN = /\b\d+\b/;
const MYSTERY_PATTERN = /\b(mystery|mysterious|unknown|unexplained|secret|hidden|lost|disappeared|unsolved|conspiracy|paradox|anomaly|enigma|controversial|forbidden|haunted|cursed)\b/i;
const CONFLICT_PATTERN = /\b(death|dead|died|killed|murder|war|battle|invasion|disaster|catastrophe|destruction|massacre|assassination|explosion|crash|collapse|epidemic|plague|famine|genocide)\b/i;
export const SCARCITY_PATTERN = /\b(only|never|impossible|accidentally|almost|rarely|forbidden|last known|sole surviving|one of the few)\b/i;

/**
 * Compute a curiosity score (0-1) for an article based on title and excerpt.
 * Higher scores = more clickable/engaging content.
 */
export function computeCuriosityScore(title: string, excerpt: string): number {
  let score = 0;
  const { curiosity } = TUNING;

  if (QUESTION_PATTERN.test(title)) score += curiosity.questionInTitle;
  if (SUPERLATIVE_PATTERN.test(title)) score += curiosity.superlativeInTitle;
  if (NUMBER_PATTERN.test(title)) score += curiosity.numbersOrLists;
  if (MYSTERY_PATTERN.test(title) || MYSTERY_PATTERN.test(excerpt)) score += curiosity.mysteryWords;
  if (CONFLICT_PATTERN.test(title) || CONFLICT_PATTERN.test(excerpt)) score += curiosity.conflictWords;
  if (SCARCITY_PATTERN.test(title) || SCARCITY_PATTERN.test(excerpt)) score += 0.10;
  if (excerpt.length > 100) score += curiosity.longExcerpt;

  const wordCount = title.split(/\s+/).length;
  if (wordCount >= 3 && wordCount <= 8) score += curiosity.idealTitleLength;

  return Math.min(1, score);
}

/**
 * Compute freshness score (0-1). Articles fetched recently score higher.
 */
export function computeFreshnessScore(fetchedAt: number): number {
  const hoursAgo = (Date.now() - fetchedAt) / 3600000;
  if (hoursAgo < 1) return 1;
  if (hoursAgo < 6) return 0.8;
  if (hoursAgo < 24) return 0.5;
  return 0.2;
}

/**
 * Score a link title for relevance. Returns -1 for generic/blocked titles,
 * 0-1 for quality links. Higher = more interesting for this user.
 */
export function scoreLinkRelevance(
  linkTitle: string,
  decayed: DecayedProfile
): number {
  // Blocklist: generic/administrative links
  if (GENERIC_TITLES.has(linkTitle)) return -1;
  for (const pattern of GENERIC_LINK_PATTERNS) {
    if (pattern.test(linkTitle)) return -1;
  }

  let score = 0.3; // Base score for passing blocklist

  // Adjacency: does this link's title contain keywords from weighted categories?
  const titleLower = linkTitle.toLowerCase();
  for (const cat of categories) {
    const catNameLower = cat.name.toLowerCase();
    const weight = decayed.decayedWeights[cat.id] || 0;

    // Check if title overlaps with category name
    const wordsInCatName = catNameLower.split(/\s+/);
    const hasOverlap = wordsInCatName.some(w => w.length > 3 && titleLower.includes(w));

    if (hasOverlap) {
      if (weight >= 0.1 && weight < 0.6) {
        // Sweet spot: interested but not saturated
        score += 0.3;
      } else if (weight < 0.1) {
        // Surprise adjacency: unexplored territory
        score += 0.15;
      } else {
        // Saturated: still ok, just less exciting
        score += 0.05;
      }
      break; // One match is enough
    }
  }

  // Curiosity boost from title patterns
  if (QUESTION_PATTERN.test(linkTitle)) score += 0.1;
  if (MYSTERY_PATTERN.test(linkTitle)) score += 0.1;
  if (SUPERLATIVE_PATTERN.test(linkTitle)) score += 0.05;

  return Math.min(1, score);
}

/**
 * Contextual curiosity scoring — profile-aware.
 * Factors in adjacency (near user's interests but unexplored),
 * novelty (completely new territory), and saturation penalty.
 */
export function computeContextualCuriosity(
  title: string,
  excerpt: string,
  articleCategories: string[],
  decayed: DecayedProfile
): number {
  const baseCuriosity = computeCuriosityScore(title, excerpt);

  let adjacencyBonus = 0;
  let noveltyBonus = 0;
  let saturationPenalty = 0;
  let hasAnyMatch = false;

  for (const cat of categories) {
    const matchesCategory = cat.wikiCategories.some(wc =>
      articleCategories.some(ac =>
        ac.toLowerCase().includes(wc.toLowerCase().replace(/_/g, ' ')) ||
        wc.toLowerCase().replace(/_/g, ' ').includes(ac.toLowerCase())
      )
    );
    if (!matchesCategory) continue;

    hasAnyMatch = true;
    const weight = decayed.decayedWeights[cat.id] || 0;

    if (weight < 0.15) {
      // Adjacent but unexplored — high curiosity
      adjacencyBonus = Math.max(adjacencyBonus, 0.20);
    } else if (weight > 0.7) {
      // Saturated — diminishing curiosity
      saturationPenalty = Math.max(saturationPenalty, 0.10);
    }
  }

  // Genuinely novel: no category overlap at all
  if (!hasAnyMatch && articleCategories.length > 0) {
    noveltyBonus = 0.15;
  }

  return Math.min(1,
    baseCuriosity * 0.6 +
    adjacencyBonus * 0.25 +
    noveltyBonus * 0.15 -
    saturationPenalty
  );
}

/**
 * Classify article tone for pacing diversity in feed arrangement.
 */
export function classifyTone(title: string, excerpt: string): FeedItem['tone'] {
  const text = `${title} ${excerpt}`;
  const scores: Record<string, number> = {};

  for (const [tone, pattern] of Object.entries(TONE_PATTERNS)) {
    const matches = text.match(new RegExp(pattern, 'gi'));
    scores[tone] = matches ? matches.length : 0;
  }

  const topTone = Object.entries(scores)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)[0];

  return (topTone?.[0] as FeedItem['tone']) || 'neutral';
}

/**
 * Dynamic variety threshold based on user behavior.
 * Deep readers get more same-topic tolerance; bouncers get less.
 */
export function computeDynamicVarietyThreshold(ctx: FeedContext): number {
  // Flow state: effectively infinite tolerance — let them binge
  if (ctx.session.isInFlowState) return 999;

  const base = TUNING.sameTopicStreakThreshold; // 3

  // Deep reader: allow more same-topic
  if (ctx.session.deepReadCount >= 2) return base + 2;
  if (ctx.session.consecutiveSameTopic >= 5) return base + 3;

  // Bouncer: low read/open ratio means they want variety sooner
  const readRate = ctx.session.articlesReadThisSession /
    Math.max(1, ctx.session.articlesOpenedThisSession);
  if (readRate < 0.3 && ctx.session.articlesOpenedThisSession >= 5) return base - 1;

  return base;
}
