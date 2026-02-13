import type { InterestProfile, EngagementEntry, Article, TopicPair } from '../../types';
import { categories } from '../../services/categoryData';

export const STORAGE_KEY = '@rabbithole:interestProfile';
export const MAX_HISTORY = 500;
export const MAX_ENGAGEMENT_LOG = 1000;
export const MAX_TOPIC_PAIRS = 50;
export const MAX_SEARCH_HISTORY = 50;
export const MAX_DISMISSED = 1000;

export function createEmptyProfile(): InterestProfile {
  return {
    categoryWeights: {},
    readHistory: [],
    engagementLog: [],
    lastUpdated: Date.now(),
  };
}

export function clampWeight(w: number): number {
  return Math.max(0, Math.min(1, w));
}

export function boostCategories(
  weights: Record<string, number>,
  articleCategories: string[],
  boost: number
): void {
  for (const cat of categories) {
    const hasOverlap = cat.wikiCategories.some(wc =>
      articleCategories.some(ac =>
        ac.toLowerCase().includes(wc.toLowerCase().replace(/_/g, ' ')) ||
        wc.toLowerCase().replace(/_/g, ' ').includes(ac.toLowerCase())
      )
    );
    if (hasOverlap) {
      weights[cat.id] = clampWeight((weights[cat.id] || 0) + boost);
    }

    for (const sub of cat.subcategories) {
      const subOverlap = sub.wikiCategories.some(wc =>
        articleCategories.some(ac =>
          ac.toLowerCase().includes(wc.toLowerCase().replace(/_/g, ' ')) ||
          wc.toLowerCase().replace(/_/g, ' ').includes(ac.toLowerCase())
        )
      );
      if (subOverlap) {
        weights[sub.id] = clampWeight((weights[sub.id] || 0) + boost);
      }
    }
  }
}

export function updateProfile(
  current: InterestProfile,
  updatedWeights: Record<string, number>,
  entry: EngagementEntry,
  article: Article
): InterestProfile {
  const readHistory = [...current.readHistory];
  const pageIdStr = String(article.pageId);
  if (!readHistory.includes(pageIdStr)) {
    readHistory.push(pageIdStr);
    if (readHistory.length > MAX_HISTORY) {
      readHistory.shift();
    }
  }

  const engagementLog = [...current.engagementLog, entry];
  if (engagementLog.length > MAX_ENGAGEMENT_LOG) {
    engagementLog.splice(0, engagementLog.length - MAX_ENGAGEMENT_LOG);
  }

  return {
    ...current,
    categoryWeights: updatedWeights,
    readHistory,
    engagementLog,
    lastUpdated: Date.now(),
  };
}

export function getRecentArticleCategories(log: EngagementEntry[]): string[] {
  // Get categories from the last article read (within 10 minutes)
  const now = Date.now();
  const recent = log
    .filter(e => (e.action === 'read' || e.action === 'deep_read') && now - e.timestamp < 600000)
    .pop();
  return recent?.categories || [];
}

export function updateTopicPairs(
  existing: TopicPair[],
  newCategories: string[],
  recentCategories: string[]
): TopicPair[] {
  if (recentCategories.length === 0 || newCategories.length === 0) return existing;

  // Map Wikipedia categories to taxonomy IDs
  const newCatIds = mapToTaxonomyIds(newCategories);
  const recentCatIds = mapToTaxonomyIds(recentCategories);

  const pairs = [...existing];

  for (const catA of newCatIds) {
    for (const catB of recentCatIds) {
      if (catA === catB) continue;
      const key = [catA, catB].sort().join('|');
      const idx = pairs.findIndex(p => [p.catA, p.catB].sort().join('|') === key);
      if (idx >= 0) {
        pairs[idx].coCount++;
        pairs[idx].lastSeen = Date.now();
      } else {
        pairs.push({ catA, catB, coCount: 1, lastSeen: Date.now() });
      }
    }
  }

  // Evict if over limit
  if (pairs.length > MAX_TOPIC_PAIRS) {
    const now = Date.now();
    pairs.sort((a, b) => {
      const recencyA = 1 / (1 + (now - a.lastSeen) / 86400000);
      const recencyB = 1 / (1 + (now - b.lastSeen) / 86400000);
      return (a.coCount * recencyA) - (b.coCount * recencyB);
    });
    pairs.splice(0, pairs.length - MAX_TOPIC_PAIRS);
  }

  return pairs;
}

function mapToTaxonomyIds(wikiCategories: string[]): string[] {
  const ids: string[] = [];
  for (const cat of categories) {
    const hasOverlap = cat.wikiCategories.some(wc =>
      wikiCategories.some(ac =>
        ac.toLowerCase().includes(wc.toLowerCase().replace(/_/g, ' ')) ||
        wc.toLowerCase().replace(/_/g, ' ').includes(ac.toLowerCase())
      )
    );
    if (hasOverlap && !ids.includes(cat.id)) {
      ids.push(cat.id);
    }
  }
  return ids;
}

export function incrementCategorySkips(
  skips: Record<string, number>,
  articleCategories: string[]
): void {
  for (const cat of categories) {
    const hasOverlap = cat.wikiCategories.some(wc =>
      articleCategories.some(ac =>
        ac.toLowerCase().includes(wc.toLowerCase().replace(/_/g, ' ')) ||
        wc.toLowerCase().replace(/_/g, ' ').includes(ac.toLowerCase())
      )
    );
    if (hasOverlap) {
      skips[cat.id] = (skips[cat.id] || 0) + 1;
    }
  }
}

export function decrementCategorySkips(
  skips: Record<string, number>,
  articleCategories: string[]
): void {
  for (const cat of categories) {
    const hasOverlap = cat.wikiCategories.some(wc =>
      articleCategories.some(ac =>
        ac.toLowerCase().includes(wc.toLowerCase().replace(/_/g, ' ')) ||
        wc.toLowerCase().replace(/_/g, ' ').includes(ac.toLowerCase())
      )
    );
    if (hasOverlap && skips[cat.id]) {
      skips[cat.id] = Math.max(0, skips[cat.id] - 3); // Engagement cancels 3 skips
      if (skips[cat.id] <= 0) delete skips[cat.id];
    }
  }
}
