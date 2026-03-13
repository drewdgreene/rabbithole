import type {
  FeedItem,
  FeedContext,
  FeedSourceType,
} from '../../types';
import { getCategoryById } from '../categoryData';
import { estimateReadTime } from '../../utils/readTime';
import { TUNING, isNamespacePage, isBroadOverviewArticle } from './tuning';
import { computeDecayedProfile } from './decayedProfile';
import type { DecayedProfile } from './decayedProfile';
import {
  computeCuriosityScore,
  computeFreshnessScore,
  computeDynamicVarietyThreshold,
  classifyTone,
} from './curiosityScoring';
import { optimizeExcerpt, extractSurprisingClaim } from './excerptOptimization';
import { assignCardVariant, generateContextCopy } from './cardVariants';
import {
  fetchCategoryPool,
  fetchLinkPool,
  fetchCurrentEventsPool,
  fetchDiscoveryPool,
  fetchMomentumPool,
  fetchContinuationPool,
  fetchBridgeArticles,
  fetchExplorationPool,
} from './poolFetchers';

// ─── Re-exports (preserve public API) ────────────────────────

export { decayedWeight, computeMomentum, computeDecayedProfile } from './decayedProfile';
export type { DecayedProfile } from './decayedProfile';
export { computeCuriosityScore } from './curiosityScoring';
export { computePoolAllocation } from './poolAllocation';

// ─── Position-Aware Arrangement ──────────────────────────────

/**
 * Position-aware arrangement. NOT simple score sort.
 * Creates an engaging sequence: hook → comfort → interleaved with surprise injections.
 */
function arrangeByPosition(items: FeedItem[], ctx: FeedContext): FeedItem[] {
  if (items.length <= 5) return items;

  const result: FeedItem[] = [];
  const remaining = [...items];

  // Annotate each item with curiosity + freshness scores
  for (const item of remaining) {
    item.curiosityScore = computeCuriosityScore(item.article.title, item.article.excerpt);
    item.freshnessScore = computeFreshnessScore(item.article.fetchedAt);
  }

  // --- Hook positions (0-1): highest engagement potential ---
  const hookCandidates = remaining
    .filter(i => i.source === 'category' || i.source === 'continuation' || i.source === 'momentum')
    .sort((a, b) => {
      const scoreA = a.score + (a.curiosityScore || 0);
      const scoreB = b.score + (b.curiosityScore || 0);
      return scoreB - scoreA;
    });

  for (let i = 0; i < TUNING.hookPositions.length && hookCandidates.length > 0; i++) {
    const pick = hookCandidates.shift()!;
    pick.positionIntent = 'hook';
    result.push(pick);
    const idx = remaining.indexOf(pick);
    if (idx >= 0) remaining.splice(idx, 1);
  }

  // --- Comfort positions (2-4): familiar territory ---
  const topCatIds = Object.entries(ctx.profile.categoryWeights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);

  const comfortCandidates = remaining
    .filter(i => i.source === 'category')
    .sort((a, b) => {
      // Prefer items from user's top categories
      const aInTop = topCatIds.some(cid => a.sourceDetail?.toLowerCase().includes(getCategoryById(cid)?.name.toLowerCase() || ''));
      const bInTop = topCatIds.some(cid => b.sourceDetail?.toLowerCase().includes(getCategoryById(cid)?.name.toLowerCase() || ''));
      if (aInTop && !bInTop) return -1;
      if (!aInTop && bInTop) return 1;
      return b.score - a.score;
    });

  for (let i = 0; i < TUNING.comfortPositions.length && comfortCandidates.length > 0; i++) {
    const pick = comfortCandidates.shift()!;
    pick.positionIntent = 'comfort';
    result.push(pick);
    const idx = remaining.indexOf(pick);
    if (idx >= 0) remaining.splice(idx, 1);
  }

  // --- Remaining items: interleave with surprise injections ---
  const discoveryItems = remaining.filter(i => i.source === 'discovery');
  const otherItems = remaining.filter(i => i.source !== 'discovery');

  // Sort other items by composite score
  const { interleaveWeights } = TUNING;
  otherItems.sort((a, b) => {
    const compositeA = a.score * interleaveWeights.score +
      (a.curiosityScore || 0) * interleaveWeights.curiosity +
      (a.freshnessScore || 0) * interleaveWeights.freshness;
    const compositeB = b.score * interleaveWeights.score +
      (b.curiosityScore || 0) * interleaveWeights.curiosity +
      (b.freshnessScore || 0) * interleaveWeights.freshness;
    return compositeB - compositeA;
  });

  let nextSurprise = TUNING.surpriseInterval.min +
    Math.floor(Math.random() * (TUNING.surpriseInterval.max - TUNING.surpriseInterval.min));
  let sinceLastSurprise = 0;
  let discoveryIdx = 0;

  for (const item of otherItems) {
    // Inject surprise (discovery) at intervals
    if (sinceLastSurprise >= nextSurprise && discoveryIdx < discoveryItems.length) {
      const surprise = discoveryItems[discoveryIdx++];
      surprise.positionIntent = 'surprise';
      result.push(surprise);
      sinceLastSurprise = 0;
      nextSurprise = TUNING.surpriseInterval.min +
        Math.floor(Math.random() * (TUNING.surpriseInterval.max - TUNING.surpriseInterval.min));
    }

    // Enforce diversity constraints
    if (result.length >= 2) {
      const prev1 = result[result.length - 1];
      const prev2 = result[result.length - 2];

      // Max 2 consecutive same source
      if (prev1.source === item.source && prev2.source === item.source) {
        // Push to later — add a different item or skip
        continue; // Will be picked up in remaining pass
      }

      // Max 2 consecutive same non-neutral tone
      const itemTone = item.tone || 'neutral';
      if (itemTone !== 'neutral') {
        const prev1Tone = prev1.tone || 'neutral';
        const prev2Tone = prev2.tone || 'neutral';
        if (prev1Tone === itemTone && prev2Tone === itemTone) {
          continue; // Will be picked up in remaining pass
        }
      }
    }

    if (item.source === 'momentum') {
      item.positionIntent = 'momentum';
    }
    result.push(item);
    sinceLastSurprise++;
  }

  // Append any remaining discovery items at the end
  while (discoveryIdx < discoveryItems.length) {
    discoveryItems[discoveryIdx].positionIntent = 'surprise';
    result.push(discoveryItems[discoveryIdx++]);
  }

  return result;
}

// ─── Item Enrichment ─────────────────────────────────────────

function enrichItems(items: FeedItem[], ctx: FeedContext): void {
  for (const item of items) {
    item.optimizedExcerpt = optimizeExcerpt(item.article.excerpt);
    item.tone = classifyTone(item.article.title, item.article.excerpt);
    item.cardVariant = assignCardVariant(item, ctx);
    if (item.cardVariant === 'fact') {
      item.optimizedExcerpt = extractSurprisingClaim(item.article.excerpt, item.article.title) ?? item.optimizedExcerpt;
    }
    item.readTimeMin = estimateReadTime(item.article.excerpt);
    item.contextCopy = generateContextCopy(item, ctx);
  }
}

// ─── Deduplication & Filtering ────────────────────────────────

function deduplicateAndFilter(
  items: FeedItem[],
  ctx: FeedContext
): FeedItem[] {
  const dismissedSet = new Set(ctx.profile.dismissedArticles || []);
  const seen = new Set<number>();
  return items.filter(item => {
    if (isNamespacePage(item.article.title)) return false;
    if (isBroadOverviewArticle(item.article.title)) return false;
    if (dismissedSet.has(item.article.pageId)) return false;
    if (seen.has(item.article.pageId) || ctx.existingPageIds.has(item.article.pageId)) {
      return false;
    }
    // Filter stub articles — excerpts under 80 chars are too thin for a feed card
    if (item.article.excerpt.length < 80) return false;
    seen.add(item.article.pageId);
    return true;
  });
}

function filterReadAndShown(items: FeedItem[], ctx: FeedContext): FeedItem[] {
  const readSet = new Set(ctx.profile.readHistory.map(id => parseInt(id, 10)));
  const shownSet = new Set(ctx.session.shownNotOpened || []);
  const unread = items.filter(item =>
    !readSet.has(item.article.pageId) && !shownSet.has(item.article.pageId)
  );
  return unread.length > 0 ? unread : items;
}

// ─── Main Entry Points ───────────────────────────────────────

/**
 * Cold start feed for first 3 generations. Prioritizes quality:
 * - 60% category pool (user's selected interests)
 * - 20% current events (high quality, popular)
 * - 20% discovery (featured + curiosity magnets)
 * Quality gates: minimum excerpt length, prefer articles with images.
 */
async function generateColdStartFeed(
  ctx: FeedContext,
  decayed: DecayedProfile
): Promise<FeedItem[]> {
  const target = TUNING.fullFeedTarget;

  const [categoryItems, trendingItems, curiosityItems] = await Promise.all([
    fetchCategoryPool(ctx, Math.ceil(target * 0.6), decayed),
    fetchCurrentEventsPool(ctx, Math.ceil(target * 0.2), decayed),
    fetchDiscoveryPool(ctx, Math.ceil(target * 0.2)),
  ]);

  let allItems = [...categoryItems, ...trendingItems, ...curiosityItems];

  // Quality gates for cold start
  allItems = allItems.filter(item => item.article.excerpt.length >= 120);

  // Prioritize articles with thumbnails (dramatically higher engagement)
  allItems.sort((a, b) => {
    const aHasImg = a.article.thumbnailUrl ? 1 : 0;
    const bHasImg = b.article.thumbnailUrl ? 1 : 0;
    if (aHasImg !== bHasImg) return bHasImg - aHasImg;
    return (b.curiosityScore || 0) - (a.curiosityScore || 0);
  });

  enrichItems(allItems, ctx);

  return arrangeByPosition(
    deduplicateAndFilter(allItems, ctx),
    ctx
  ).slice(0, target);
}

/**
 * Generate a fresh feed. Computes dynamic pool allocation, runs all pools
 * in parallel, deduplicates, and applies position-aware arrangement.
 * Returns ~30 items.
 */
export async function generateFeed(ctx: FeedContext): Promise<FeedItem[]> {
  // Import here to avoid circular — poolAllocation uses TUNING + curiosityScoring
  const { computePoolAllocation } = await import('./poolAllocation');

  const decayed = computeDecayedProfile(ctx.profile);

  // Cold start override: first 3 lifetime feed generations get quality-gated content
  if ((ctx.profile.totalFeedGenerations || 0) < 3) {
    return generateColdStartFeed(ctx, decayed);
  }

  const allocation = computePoolAllocation(ctx, decayed);
  const target = TUNING.fullFeedTarget;

  // Bridge articles steal from category pool allocation
  const hasBridgeData = (ctx.profile.topicPairs || []).some(p => p.coCount >= 3);
  const bridgeTarget = hasBridgeData ? Math.min(3, Math.round(target * 0.10)) : 0;

  // Compute pool sizes from allocation percentages
  const poolSizes: Record<FeedSourceType, number> = {
    category: Math.round(allocation.category * target) - bridgeTarget,
    link: Math.round(allocation.link * target),
    current_events: Math.round(allocation.current_events * target),
    discovery: Math.round(allocation.discovery * target),
    momentum: Math.round(allocation.momentum * target),
    continuation: Math.round(allocation.continuation * target),
    exploration: Math.round((allocation.exploration || 0) * target),
    search: 0, // search is not a pool — items come through discovery echo
  };

  // Run all pools in parallel (7 core + bridge)
  const [categoryItems, linkItems, currentEventItems, discoveryItems, momentumItems, continuationItems, bridgeItems, explorationItems] =
    await Promise.all([
      fetchCategoryPool(ctx, poolSizes.category, decayed),
      fetchLinkPool(ctx, poolSizes.link, decayed),
      fetchCurrentEventsPool(ctx, poolSizes.current_events, decayed),
      fetchDiscoveryPool(ctx, poolSizes.discovery),
      fetchMomentumPool(ctx, poolSizes.momentum, decayed),
      fetchContinuationPool(ctx, poolSizes.continuation),
      bridgeTarget > 0 ? fetchBridgeArticles(ctx, decayed, bridgeTarget) : Promise.resolve([]),
      fetchExplorationPool(ctx, poolSizes.exploration, decayed),
    ]);

  const allItems = [
    ...categoryItems,
    ...linkItems,
    ...currentEventItems,
    ...discoveryItems,
    ...momentumItems,
    ...continuationItems,
    ...bridgeItems,
    ...explorationItems,
  ];

  enrichItems(allItems, ctx);
  const deduped = deduplicateAndFilter(allItems, ctx);
  const filtered = filterReadAndShown(deduped, ctx);

  return arrangeByPosition(filtered, ctx).slice(0, target);
}

/**
 * Load more articles for infinite scroll.
 * 15 items, no continuation pool, mode=load_more.
 */
export async function loadMoreFeed(ctx: FeedContext): Promise<FeedItem[]> {
  const { computePoolAllocation } = await import('./poolAllocation');

  const decayed = computeDecayedProfile(ctx.profile);
  const allocation = computePoolAllocation(ctx, decayed);
  const target = TUNING.loadMoreTarget;

  const hasBridgeData = (ctx.profile.topicPairs || []).some(p => p.coCount >= 3);
  const bridgeTarget = hasBridgeData ? Math.min(2, Math.round(target * 0.10)) : 0;

  const poolSizes: Record<FeedSourceType, number> = {
    category: Math.round(allocation.category * target) - bridgeTarget,
    link: Math.round(allocation.link * target),
    current_events: Math.round(allocation.current_events * target),
    discovery: Math.round(allocation.discovery * target),
    momentum: Math.round(allocation.momentum * target),
    continuation: 0, // No continuation in load-more
    exploration: Math.round((allocation.exploration || 0) * target),
    search: 0, // search is not a pool — items come through discovery echo
  };

  const [categoryItems, linkItems, currentEventItems, discoveryItems, momentumItems, bridgeItems, explorationItems] =
    await Promise.all([
      fetchCategoryPool(ctx, poolSizes.category, decayed),
      fetchLinkPool(ctx, poolSizes.link, decayed),
      fetchCurrentEventsPool(ctx, poolSizes.current_events, decayed),
      fetchDiscoveryPool(ctx, poolSizes.discovery),
      fetchMomentumPool(ctx, poolSizes.momentum, decayed),
      bridgeTarget > 0 ? fetchBridgeArticles(ctx, decayed, bridgeTarget) : Promise.resolve([]),
      fetchExplorationPool(ctx, poolSizes.exploration, decayed),
    ]);

  const allItems = [
    ...categoryItems,
    ...linkItems,
    ...currentEventItems,
    ...discoveryItems,
    ...momentumItems,
    ...bridgeItems,
    ...explorationItems,
  ];

  enrichItems(allItems, ctx);
  const deduped = deduplicateAndFilter(allItems, ctx);
  const filtered = filterReadAndShown(deduped, ctx);

  return arrangeByPosition(filtered, ctx).slice(0, target);
}
