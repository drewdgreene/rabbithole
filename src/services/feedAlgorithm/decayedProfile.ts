import type { InterestProfile, EngagementEntry } from '../../types';
import { categories, getCategoryById } from '../categoryData';
import { useOnboardingStore } from '../../store/onboardingStore';
import { TUNING } from './tuning';

export interface DecayedProfile {
  decayedWeights: Record<string, number>;
  momentum: Record<string, number>;
  surgingCategories: string[];
  decliningCategories: string[];
}

/**
 * Exponential decay of a raw weight based on time since last engagement.
 * 7-day half-life, floor at 0.02. Applied at query time, never mutated in storage.
 */
export function decayedWeight(rawWeight: number, lastEngagementTs: number, now: number): number {
  const daysSince = (now - lastEngagementTs) / 86400000;
  if (daysSince <= 0) return rawWeight;
  const decay = Math.pow(0.5, daysSince / TUNING.decayHalfLifeDays);
  return Math.max(TUNING.decayFloor, rawWeight * decay);
}

/**
 * Compute momentum for a category: compares recent engagement (0-3 days)
 * vs baseline (4-7 days). Returns -1.0 to +1.0.
 * >0.3 = "surging" (actively being explored)
 * <-0.3 = "declining"
 */
export function computeMomentum(
  engagementLog: EngagementEntry[],
  categoryId: string,
  now: number
): number {
  const cat = getCategoryById(categoryId);
  if (!cat) return 0;

  const recentCutoff = now - TUNING.momentumRecentDays * 86400000;
  const baselineCutoff = now - TUNING.momentumBaselineDays * 86400000;

  let recentCount = 0;
  let baselineCount = 0;

  for (const entry of engagementLog) {
    if (entry.action !== 'read' && entry.action !== 'deep_read' && entry.action !== 'opened' && entry.action !== 'saved') continue;

    const matchesCategory = entry.categories.some(ac =>
      cat.wikiCategories.some(wc =>
        ac.toLowerCase().includes(wc.toLowerCase().replace(/_/g, ' ')) ||
        wc.toLowerCase().replace(/_/g, ' ').includes(ac.toLowerCase())
      )
    );
    if (!matchesCategory) continue;

    if (entry.timestamp >= recentCutoff) {
      recentCount++;
    } else if (entry.timestamp >= baselineCutoff) {
      baselineCount++;
    }
  }

  // Normalize baseline to same time window as recent (3 days vs 4 days)
  const normalizedBaseline = baselineCount * (TUNING.momentumRecentDays / (TUNING.momentumBaselineDays - TUNING.momentumRecentDays));

  if (normalizedBaseline === 0 && recentCount === 0) return 0;
  if (normalizedBaseline === 0) return Math.min(1, recentCount / 3); // Capped for new interests

  const ratio = (recentCount - normalizedBaseline) / Math.max(normalizedBaseline, 1);
  return Math.max(-1, Math.min(1, ratio));
}

/**
 * Pure function producing decayed weights + momentum vectors.
 * Called at start of every feed generation.
 */
export function computeDecayedProfile(profile: InterestProfile): DecayedProfile {
  const now = Date.now();
  const decayedWeights: Record<string, number> = {};
  const momentum: Record<string, number> = {};
  const surgingCategories: string[] = [];
  const decliningCategories: string[] = [];

  // Find last engagement timestamp per category
  const lastEngagement: Record<string, number> = {};
  for (const entry of profile.engagementLog) {
    for (const cat of categories) {
      const matchesCategory = entry.categories.some(ac =>
        cat.wikiCategories.some(wc =>
          ac.toLowerCase().includes(wc.toLowerCase().replace(/_/g, ' ')) ||
          wc.toLowerCase().replace(/_/g, ' ').includes(ac.toLowerCase())
        )
      );
      if (matchesCategory) {
        lastEngagement[cat.id] = Math.max(lastEngagement[cat.id] || 0, entry.timestamp);
      }
    }
  }

  for (const cat of categories) {
    const rawWeight = profile.categoryWeights[cat.id] || 0.05;
    const lastTs = lastEngagement[cat.id] || profile.lastUpdated;

    decayedWeights[cat.id] = decayedWeight(rawWeight, lastTs, now);

    const m = computeMomentum(profile.engagementLog, cat.id, now);
    momentum[cat.id] = m;

    if (m > TUNING.surgingThreshold) surgingCategories.push(cat.id);
    else if (m < TUNING.decliningThreshold) decliningCategories.push(cat.id);
  }

  // Also decay custom topic weights
  const customTopics = useOnboardingStore.getState().customTopics;
  for (const topic of customTopics) {
    const rawWeight = profile.categoryWeights[topic.id] || 0.05;
    decayedWeights[topic.id] = decayedWeight(rawWeight, profile.lastUpdated, now);
  }

  return { decayedWeights, momentum, surgingCategories, decliningCategories };
}
