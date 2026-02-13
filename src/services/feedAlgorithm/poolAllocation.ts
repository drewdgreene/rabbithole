import type { FeedContext, FeedSourceType } from '../../types';
import { TUNING } from './tuning';
import type { DecayedProfile } from './decayedProfile';
import { computeDynamicVarietyThreshold } from './curiosityScoring';

/**
 * Dynamic pool allocation based on full session context.
 * Returns allocation as Record<FeedSourceType, number> summing to 1.0.
 */
export function computePoolAllocation(ctx: FeedContext, decayed?: DecayedProfile): Record<FeedSourceType, number> {
  const alloc = { ...TUNING.basePools };

  // 1. Source engagement CTR adjustment
  if (ctx.profile.sourceEngagement) {
    const se = ctx.profile.sourceEngagement;
    const poolTypes: FeedSourceType[] = ['category', 'link', 'current_events', 'discovery'];
    const ctrs: Record<string, number> = {};
    let totalCtr = 0;
    let poolsWithData = 0;

    for (const pool of poolTypes) {
      const data = se[pool];
      if (data && data.shown > 5) { // Need minimum data
        ctrs[pool] = data.opened / data.shown;
        totalCtr += ctrs[pool];
        poolsWithData++;
      }
    }

    if (poolsWithData >= 2) {
      const avgCtr = totalCtr / poolsWithData;
      for (const pool of poolTypes) {
        if (ctrs[pool] !== undefined) {
          const ctrDiff = ctrs[pool] - avgCtr;
          alloc[pool] += ctrDiff * TUNING.ctrInfluence;
        }
      }
    }
  }

  // 2. Session depth adjustments
  const articlesRead = ctx.session.articlesReadThisSession;
  if (articlesRead >= 5) {
    // Deep session: shift toward momentum + discovery
    const depthFactor = Math.min(1, (articlesRead - 5) / 10);
    const shift = TUNING.sessionDepthShift * depthFactor;
    alloc.momentum += shift * 0.6;
    alloc.discovery += shift * 0.4;
    alloc.category -= shift * 0.5;
    alloc.current_events -= shift * 0.5;
  }

  // 3. Same-topic streak → variety injection (dynamic threshold)
  const varietyThreshold = computeDynamicVarietyThreshold(ctx);
  if (ctx.session.consecutiveSameTopic >= varietyThreshold) {
    alloc.discovery += TUNING.varietyInjection;
    alloc.category -= TUNING.varietyInjection * 0.5;
    alloc.link -= TUNING.varietyInjection * 0.5;
  }

  // 4. Time of day
  if (ctx.hourOfDay >= 6 && ctx.hourOfDay <= 10) {
    // Morning: boost current events
    alloc.current_events += TUNING.morningCurrentEventsBoost;
    alloc.discovery -= TUNING.morningCurrentEventsBoost * 0.5;
    alloc.link -= TUNING.morningCurrentEventsBoost * 0.5;
  } else if (ctx.hourOfDay >= 22 || ctx.hourOfDay <= 2) {
    // Late night: boost deep category reads
    alloc.category += TUNING.nightDeepReadBoost;
    alloc.current_events -= TUNING.nightDeepReadBoost;
  }

  // 5. Return context (first load after gap)
  if (ctx.mode === 'initial' && ctx.daysSinceLastSession >= 1 && ctx.previousSessionSummary) {
    alloc.continuation += TUNING.returnContinuationBoost;
    alloc.discovery -= TUNING.returnContinuationBoost * 0.5;
    alloc.category -= TUNING.returnContinuationBoost * 0.5;
  }

  // 6. Mode-based adjustments
  if (ctx.mode === 'load_more') {
    alloc.momentum += TUNING.loadMoreMomentumBoost;
    alloc.continuation = 0; // No continuation in load-more
    alloc.category -= TUNING.loadMoreMomentumBoost;
  } else if (ctx.mode === 'post_read') {
    alloc.momentum += TUNING.postReadMomentumBoost;
    alloc.category -= TUNING.postReadMomentumBoost * 0.5;
    alloc.link -= TUNING.postReadMomentumBoost * 0.5;
  }

  // 7. Thread depth boost
  if (ctx.session.threadDepth >= TUNING.threadDepthThreshold) {
    alloc.link += TUNING.threadDepthLinkBoost;
    alloc.discovery -= TUNING.threadDepthLinkBoost * 0.5;
    alloc.current_events -= TUNING.threadDepthLinkBoost * 0.5;
  }

  // 8. Flow state override — let them binge
  if (ctx.session.isInFlowState) {
    alloc.momentum = 0.40;
    alloc.link = 0.30;
    alloc.category = 0.20;
    alloc.discovery = 0.05;
    alloc.current_events = 0.03;
    alloc.continuation = 0.02;
    alloc.exploration = 0.00;
  }

  // 9. Declining categories: shift allocation away from category pool toward discovery
  if (decayed && decayed.decliningCategories.length > 0) {
    const declineRatio = decayed.decliningCategories.length /
      Math.max(1, Object.keys(decayed.decayedWeights).length);
    const shift = Math.min(0.10, declineRatio * 0.20);
    alloc.category -= shift;
    alloc.discovery += shift * 0.6;
    alloc.exploration += shift * 0.4;
  }

  // 10. Disable pools that can't produce results
  if (!ctx.session.lastReadArticle) {
    alloc.category += alloc.momentum; // Redistribute
    alloc.momentum = 0;
  }
  if (!ctx.previousSessionSummary || ctx.daysSinceLastSession < 1) {
    alloc.category += alloc.continuation * 0.5;
    alloc.discovery += alloc.continuation * 0.5;
    alloc.continuation = 0;
  }

  // Normalize: clamp negatives, then normalize to sum to 1.0
  const poolKeys = Object.keys(alloc) as FeedSourceType[];
  for (const key of poolKeys) {
    alloc[key] = Math.max(0.02, alloc[key]); // Minimum 2% each active pool
  }
  // Zero out truly disabled pools
  if (!ctx.session.lastReadArticle) alloc.momentum = 0;
  if (!ctx.previousSessionSummary || ctx.daysSinceLastSession < 1) alloc.continuation = 0;

  const total = poolKeys.reduce((sum, k) => sum + alloc[k], 0);
  for (const key of poolKeys) {
    alloc[key] = alloc[key] / total;
  }

  return alloc;
}
