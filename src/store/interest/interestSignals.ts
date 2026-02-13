import type {
  InterestProfile,
  EngagementEntry,
  Article,
  FeedSourceType,
} from '../../types';
import { categories } from '../../services/categoryData';
import {
  clampWeight,
  boostCategories,
  updateProfile,
  getRecentArticleCategories,
  updateTopicPairs,
  incrementCategorySkips,
  decrementCategorySkips,
  MAX_ENGAGEMENT_LOG,
  MAX_SEARCH_HISTORY,
  MAX_DISMISSED,
} from './interestHelpers';
import { saveProfile } from './interestPersistence';

type GetState = () => { profile: InterestProfile };
type SetState = (partial: { profile: InterestProfile }) => void;

export function createSignalArticleOpened(get: GetState, set: SetState) {
  return (article: Article, sourcePool?: FeedSourceType) => {
    const { profile } = get();
    const entry: EngagementEntry = {
      pageId: article.pageId,
      title: article.title,
      categories: article.categories,
      action: 'opened',
      timestamp: Date.now(),
      sourcePool,
    };

    const updatedWeights = { ...profile.categoryWeights };
    boostCategories(updatedWeights, article.categories, 0.05);

    // Track source engagement
    const se = { ...(profile.sourceEngagement || {}) };
    if (sourcePool) {
      if (!se[sourcePool]) se[sourcePool] = { shown: 0, opened: 0, readDeep: 0 };
      se[sourcePool].opened++;
    }

    // Remove from dismissed list (user engaged with it)
    const dismissed = (profile.dismissedArticles || []).filter(id => id !== article.pageId);

    // Decrement persistent category skip counts (engagement resets disinterest)
    const skips = { ...(profile.persistedCategorySkips || {}) };
    decrementCategorySkips(skips, article.categories);

    const updatedProfile = updateProfile(profile, updatedWeights, entry, article);
    updatedProfile.sourceEngagement = se;
    updatedProfile.dismissedArticles = dismissed;
    updatedProfile.persistedCategorySkips = skips;
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  };
}

export function createSignalArticleRead(get: GetState, set: SetState) {
  return (article: Article, timeSpentMs: number, scrollDepthPct?: number) => {
    const { profile } = get();
    const timeBoost = Math.min(timeSpentMs / 60000, 1) * 0.10;

    const entry: EngagementEntry = {
      pageId: article.pageId,
      title: article.title,
      categories: article.categories,
      action: 'read',
      timeSpentMs,
      scrollDepthPct,
      timestamp: Date.now(),
    };

    const updatedWeights = { ...profile.categoryWeights };
    boostCategories(updatedWeights, article.categories, timeBoost);

    // Update topic co-occurrence with recently read articles
    const recentCats = getRecentArticleCategories(profile.engagementLog);
    const updatedPairs = updateTopicPairs(
      profile.topicPairs || [],
      article.categories,
      recentCats
    );

    // Decrement persistent category skip counts (reading = strong engagement)
    const skips = { ...(profile.persistedCategorySkips || {}) };
    decrementCategorySkips(skips, article.categories);

    const updatedProfile = updateProfile(profile, updatedWeights, entry, article);
    updatedProfile.topicPairs = updatedPairs;
    updatedProfile.persistedCategorySkips = skips;
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);

    // Auto-trigger deep read if thresholds met
    if (timeSpentMs > 60000 && (scrollDepthPct || 0) > 40) {
      // Use get() to call the store's signalDeepRead
      const store = get() as any;
      if (store.signalDeepRead) {
        store.signalDeepRead(article, timeSpentMs, scrollDepthPct || 50);
      }
    }
  };
}

export function createSignalDeepRead(get: GetState, set: SetState) {
  return (article: Article, timeSpentMs: number, scrollDepthPct: number) => {
    const { profile } = get();
    const depthBoost = 0.15 + (scrollDepthPct / 100) * 0.10;

    const entry: EngagementEntry = {
      pageId: article.pageId,
      title: article.title,
      categories: article.categories,
      action: 'deep_read',
      timeSpentMs,
      scrollDepthPct,
      timestamp: Date.now(),
    };

    const updatedWeights = { ...profile.categoryWeights };
    boostCategories(updatedWeights, article.categories, depthBoost);

    // Track deep reads in source engagement
    const se = { ...(profile.sourceEngagement || {}) };
    // Find which pool this article came from (check recent opened entries)
    const recentOpen = profile.engagementLog
      .filter(e => e.pageId === article.pageId && e.action === 'opened')
      .pop();
    if (recentOpen?.sourcePool) {
      if (!se[recentOpen.sourcePool]) se[recentOpen.sourcePool] = { shown: 0, opened: 0, readDeep: 0 };
      se[recentOpen.sourcePool].readDeep++;
    }

    const updatedProfile = updateProfile(profile, updatedWeights, entry, article);
    updatedProfile.sourceEngagement = se;
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  };
}

export function createSignalArticleSaved(get: GetState, set: SetState) {
  return (article: Article) => {
    const { profile } = get();
    const entry: EngagementEntry = {
      pageId: article.pageId,
      title: article.title,
      categories: article.categories,
      action: 'saved',
      timestamp: Date.now(),
    };

    const updatedWeights = { ...profile.categoryWeights };
    boostCategories(updatedWeights, article.categories, 0.15);

    const updatedProfile = updateProfile(profile, updatedWeights, entry, article);
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  };
}

export function createSignalLinkFollowed(get: GetState, set: SetState) {
  return (fromArticle: Article, _toTitle: string) => {
    const { profile } = get();
    const entry: EngagementEntry = {
      pageId: fromArticle.pageId,
      title: fromArticle.title,
      categories: fromArticle.categories,
      action: 'link_followed',
      timestamp: Date.now(),
    };

    const updatedWeights = { ...profile.categoryWeights };
    boostCategories(updatedWeights, fromArticle.categories, 0.08);

    const updatedProfile = updateProfile(profile, updatedWeights, entry, fromArticle);
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  };
}

export function createSignalScrolledPast(get: GetState, set: SetState) {
  return (article: Article) => {
    const { profile } = get();
    const entry: EngagementEntry = {
      pageId: article.pageId,
      title: article.title,
      categories: article.categories,
      action: 'scrolled_past',
      timestamp: Date.now(),
    };

    const updatedWeights = { ...profile.categoryWeights };
    boostCategories(updatedWeights, article.categories, -0.01);

    // Persistent article dismissal: track articles shown but not opened
    const dismissed = [...(profile.dismissedArticles || [])];
    const pageIdStr = String(article.pageId);
    if (!profile.readHistory.includes(pageIdStr) && !dismissed.includes(article.pageId)) {
      dismissed.push(article.pageId);
      if (dismissed.length > MAX_DISMISSED) {
        dismissed.splice(0, dismissed.length - MAX_DISMISSED);
      }
    }

    // Increment persistent category skip counts
    const skips = { ...(profile.persistedCategorySkips || {}) };
    incrementCategorySkips(skips, article.categories);

    const updatedProfile = updateProfile(profile, updatedWeights, entry, article);
    updatedProfile.dismissedArticles = dismissed;
    updatedProfile.persistedCategorySkips = skips;
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  };
}

export function createSignalCardDwell(get: GetState, set: SetState) {
  return (article: Article, dwellMs: number, sourcePool: FeedSourceType) => {
    const { profile } = get();

    // Track source shown count
    const se = { ...(profile.sourceEngagement || {}) };
    if (!se[sourcePool]) se[sourcePool] = { shown: 0, opened: 0, readDeep: 0 };
    se[sourcePool].shown++;

    const entry: EngagementEntry = {
      pageId: article.pageId,
      title: article.title,
      categories: article.categories,
      action: 'card_visible',
      cardDwellMs: dwellMs,
      sourcePool,
      timestamp: Date.now(),
    };

    // Negative signal: considered but rejected (>2s dwell, no tap)
    // or fast skip (<500ms)
    let boost = 0;
    if (dwellMs > 2000) boost = -0.02;
    else if (dwellMs < 500) boost = -0.01;

    const updatedWeights = { ...profile.categoryWeights };
    if (boost !== 0) {
      boostCategories(updatedWeights, article.categories, boost);
    }

    const updatedProfile = updateProfile(profile, updatedWeights, entry, article);
    updatedProfile.sourceEngagement = se;
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  };
}

export function createSignalSearchQuery(get: GetState, set: SetState) {
  return (query: string) => {
    const { profile } = get();
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return;

    const entry: EngagementEntry = {
      pageId: 0,
      title: '',
      categories: [],
      action: 'search_query',
      searchQuery: trimmed,
      timestamp: Date.now(),
    };

    // Boost categories whose names overlap with search query words
    const updatedWeights = { ...profile.categoryWeights };
    const queryWords = trimmed.split(/\s+/).filter(w => w.length > 2);
    for (const cat of categories) {
      const catWords = cat.name.toLowerCase().split(/\s+/);
      const hasOverlap = catWords.some(cw =>
        cw.length > 2 && queryWords.some(qw => qw.includes(cw) || cw.includes(qw))
      );
      if (hasOverlap) {
        updatedWeights[cat.id] = clampWeight((updatedWeights[cat.id] || 0) + 0.10);
      }
    }

    const searchHistory = [...(profile.searchHistory || [])];
    searchHistory.push({ query: trimmed, timestamp: Date.now() });
    if (searchHistory.length > MAX_SEARCH_HISTORY) {
      searchHistory.splice(0, searchHistory.length - MAX_SEARCH_HISTORY);
    }

    const engagementLog = [...profile.engagementLog, entry];
    if (engagementLog.length > MAX_ENGAGEMENT_LOG) {
      engagementLog.splice(0, engagementLog.length - MAX_ENGAGEMENT_LOG);
    }

    const updatedProfile: InterestProfile = {
      ...profile,
      categoryWeights: updatedWeights,
      engagementLog,
      searchHistory,
      lastUpdated: Date.now(),
    };
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  };
}

export function createSignalSearchResultTap(get: GetState, set: SetState) {
  return (article: Article, query: string) => {
    const { profile } = get();
    const trimmed = query.trim().toLowerCase();

    const entry: EngagementEntry = {
      pageId: article.pageId,
      title: article.title,
      categories: article.categories,
      action: 'search_result_tap',
      searchQuery: trimmed,
      timestamp: Date.now(),
    };

    // Very strong boost: user searched AND tapped
    const updatedWeights = { ...profile.categoryWeights };
    boostCategories(updatedWeights, article.categories, 0.20);

    // Also boost categories matching the query (for articles with no categories yet)
    const queryWords = trimmed.split(/\s+/).filter(w => w.length > 2);
    for (const cat of categories) {
      const catWords = cat.name.toLowerCase().split(/\s+/);
      const hasOverlap = catWords.some(cw =>
        cw.length > 2 && queryWords.some(qw => qw.includes(cw) || cw.includes(qw))
      );
      if (hasOverlap) {
        updatedWeights[cat.id] = clampWeight((updatedWeights[cat.id] || 0) + 0.10);
      }
    }

    // Mark the most recent matching search as tapped
    const searchHistory = [...(profile.searchHistory || [])];
    for (let i = searchHistory.length - 1; i >= 0; i--) {
      if (searchHistory[i].query === trimmed) {
        searchHistory[i] = { ...searchHistory[i], tappedTitle: article.title };
        break;
      }
    }

    const updatedProfile = updateProfile(profile, updatedWeights, entry, article);
    updatedProfile.searchHistory = searchHistory;
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  };
}

export function createSignalPathSaved(get: GetState, set: SetState) {
  return (articles: { pageId: number; title: string; categories: string[] }[], maxDepth: number) => {
    const { profile } = get();
    const updatedWeights = { ...profile.categoryWeights };
    const depthMultiplier = 1 + Math.min(maxDepth, 10) * 0.1;

    // Boost categories from all articles in the path
    for (const article of articles) {
      boostCategories(updatedWeights, article.categories, 0.20 * depthMultiplier);
    }

    // Record cross-category pairs between all articles in the path
    let updatedPairs = [...(profile.topicPairs || [])];
    for (let i = 0; i < articles.length; i++) {
      for (let j = i + 1; j < articles.length; j++) {
        updatedPairs = updateTopicPairs(
          updatedPairs,
          articles[i].categories,
          articles[j].categories
        );
      }
    }

    // Log engagement entries
    const engagementLog = [...profile.engagementLog];
    for (const article of articles) {
      engagementLog.push({
        pageId: article.pageId,
        title: article.title,
        categories: article.categories,
        action: 'path_saved',
        trailDepth: maxDepth,
        timestamp: Date.now(),
      });
    }
    if (engagementLog.length > MAX_ENGAGEMENT_LOG) {
      engagementLog.splice(0, engagementLog.length - MAX_ENGAGEMENT_LOG);
    }

    const updatedProfile: InterestProfile = {
      ...profile,
      categoryWeights: updatedWeights,
      topicPairs: updatedPairs,
      engagementLog,
      lastUpdated: Date.now(),
    };
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  };
}

export function createSignalPathRevisited(get: GetState, set: SetState) {
  return (articles: { pageId: number; title: string; categories: string[] }[]) => {
    const { profile } = get();
    const updatedWeights = { ...profile.categoryWeights };

    for (const article of articles) {
      boostCategories(updatedWeights, article.categories, 0.10);
    }

    const engagementLog = [...profile.engagementLog];
    for (const article of articles) {
      engagementLog.push({
        pageId: article.pageId,
        title: article.title,
        categories: article.categories,
        action: 'path_revisited',
        timestamp: Date.now(),
      });
    }
    if (engagementLog.length > MAX_ENGAGEMENT_LOG) {
      engagementLog.splice(0, engagementLog.length - MAX_ENGAGEMENT_LOG);
    }

    const updatedProfile: InterestProfile = {
      ...profile,
      categoryWeights: updatedWeights,
      engagementLog,
      lastUpdated: Date.now(),
    };
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  };
}
