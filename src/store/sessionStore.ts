import { create } from 'zustand';
import type { SessionSnapshot, SessionSummary, UnfinishedThread, FeedSourceType } from '../types';
import { categories } from '../services/categoryData';

function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

interface CardVisibility {
  pageId: number;
  becameVisibleAt: number;
  dwellMs: number;
  wasOpened: boolean;
}

interface SessionStoreState extends SessionSnapshot {
  cardVisibilityLog: CardVisibility[];
  tabsCreated: number;
  maxTabDepth: number;
  pathsSaved: number;

  // Flow state tracking
  recentReadTimestamps: number[];
  recentScrollDepths: number[];

  // Category suppression (internal)
  categorySkipCounts: Record<string, number>;
  shownNotOpenedSet: Set<number>; // internal Set; serialized to array in snapshot

  // Actions
  recordArticleOpened: (pageId: number, title: string, cats: string[], sourcePool?: FeedSourceType) => void;
  recordArticleRead: (pageId: number, title: string, cats: string[], timeSpentMs: number, scrollDepthPct?: number) => void;
  recordArticleSaved: () => void;
  recordLinkFollowed: (fromTitle: string) => void;
  recordCardVisibility: (pageId: number, dwellMs: number, wasOpened: boolean) => void;
  recordFeedGeneration: () => void;
  recordSearchQuery: (query: string) => void;
  recordTabCreated: (depth: number) => void;
  recordPathSaved: () => void;
  resetThread: () => void;
  shouldResetThread: () => boolean;
  getSessionSnapshot: () => SessionSnapshot;
  buildSummary: () => SessionSummary;

  // Flow state + suppression actions
  computeFlowState: () => void;
  recordCategorySkip: (categoryId: string) => void;
  resetCategorySkip: (categoryId: string) => void;
  recordCardShown: (pageId: number) => void;
}

const MAX_VISIBILITY_LOG = 50;

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  sessionId: generateSessionId(),
  startedAt: Date.now(),
  articlesOpenedThisSession: 0,
  articlesReadThisSession: 0,
  articlesSavedThisSession: 0,
  lastReadArticle: null,
  lastReadAt: null,
  categoryCountsThisSession: {},
  consecutiveSameTopic: 0,
  currentTopicStreak: null,
  deepReadCount: 0,
  threadDepth: 0,
  threadSeedTitle: null,
  feedGenerationCount: 0,
  lastSearchQuery: null,
  isInFlowState: false,
  engagementVelocity: 0,
  avgRecentScrollDepth: 0,
  suppressedCategories: [],
  shownNotOpened: [],
  cardVisibilityLog: [],
  tabsCreated: 0,
  maxTabDepth: 0,
  pathsSaved: 0,
  recentReadTimestamps: [],
  recentScrollDepths: [],
  categorySkipCounts: {},
  shownNotOpenedSet: new Set(),

  recordArticleOpened: (pageId, title, cats, _sourcePool) => {
    set(state => {
      // Remove from shownNotOpened since it was opened
      const newSet = new Set(state.shownNotOpenedSet);
      newSet.delete(pageId);
      return {
        articlesOpenedThisSession: state.articlesOpenedThisSession + 1,
        lastReadArticle: { pageId, title, categories: cats },
        shownNotOpenedSet: newSet,
        shownNotOpened: [...newSet],
      };
    });
  },

  recordArticleRead: (pageId, title, cats, timeSpentMs, scrollDepthPct) => {
    const state = get();

    // Determine top-level category for streak tracking
    const topCat = findTopLevelCategory(cats);
    const isSameTopic = topCat && topCat === state.currentTopicStreak;

    // Update category counts
    const updatedCounts = { ...state.categoryCountsThisSession };
    if (topCat) {
      updatedCounts[topCat] = (updatedCounts[topCat] || 0) + 1;
    }

    const isDeepRead = timeSpentMs > 60000;

    // Track timestamps + scroll depths for flow state detection
    const newTimestamps = [...state.recentReadTimestamps, Date.now()].slice(-10);
    const newDepths = [...state.recentScrollDepths, scrollDepthPct || 0].slice(-10);

    set({
      articlesReadThisSession: state.articlesReadThisSession + 1,
      lastReadArticle: { pageId, title, categories: cats },
      lastReadAt: Date.now(),
      categoryCountsThisSession: updatedCounts,
      consecutiveSameTopic: isSameTopic ? state.consecutiveSameTopic + 1 : 1,
      currentTopicStreak: topCat || state.currentTopicStreak,
      deepReadCount: isDeepRead ? state.deepReadCount + 1 : state.deepReadCount,
      recentReadTimestamps: newTimestamps,
      recentScrollDepths: newDepths,
    });

    // Recompute flow state after every read
    get().computeFlowState();

    // Reset skip count for this article's category (user engaged)
    if (topCat) get().resetCategorySkip(topCat);
  },

  recordArticleSaved: () => {
    set(state => ({
      articlesSavedThisSession: state.articlesSavedThisSession + 1,
    }));
  },

  recordLinkFollowed: (fromTitle) => {
    set(state => ({
      threadDepth: state.threadSeedTitle ? state.threadDepth + 1 : 1,
      threadSeedTitle: state.threadSeedTitle || fromTitle,
    }));
  },

  recordCardVisibility: (pageId, dwellMs, wasOpened) => {
    set(state => {
      const log = [...state.cardVisibilityLog, {
        pageId,
        becameVisibleAt: Date.now() - dwellMs,
        dwellMs,
        wasOpened,
      }];
      if (log.length > MAX_VISIBILITY_LOG) {
        log.splice(0, log.length - MAX_VISIBILITY_LOG);
      }
      return { cardVisibilityLog: log };
    });
  },

  recordFeedGeneration: () => {
    set(state => ({
      feedGenerationCount: state.feedGenerationCount + 1,
      // Thread state persists across feed generations within a session.
      // Only resetThread() clears it (called when idle > 30 min).
    }));
  },

  recordSearchQuery: (query) => {
    set({ lastSearchQuery: query });
  },

  recordTabCreated: (depth) => {
    set(state => ({
      tabsCreated: state.tabsCreated + 1,
      maxTabDepth: Math.max(state.maxTabDepth, depth),
    }));
  },

  recordPathSaved: () => {
    set(state => ({
      pathsSaved: state.pathsSaved + 1,
    }));
  },

  resetThread: () => {
    set({ threadDepth: 0, threadSeedTitle: null });
  },

  shouldResetThread: () => {
    const state = get();
    if (!state.lastReadAt) return false;
    return Date.now() - state.lastReadAt > 30 * 60 * 1000; // 30 min idle
  },

  computeFlowState: () => {
    const state = get();
    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    // Count articles read in last 10 minutes
    const recentReads = state.recentReadTimestamps.filter(ts => now - ts < TEN_MINUTES);
    const velocity = recentReads.length;

    // Average scroll depth of recent reads
    const recentDepths = state.recentScrollDepths.slice(-5);
    const avgDepth = recentDepths.length > 0
      ? recentDepths.reduce((a, b) => a + b, 0) / recentDepths.length
      : 0;

    // Flow state: 3+ articles in 10 min AND avg scroll depth > 40%
    const isInFlow = velocity >= 3 && avgDepth > 40;

    set({
      engagementVelocity: velocity,
      avgRecentScrollDepth: avgDepth,
      isInFlowState: isInFlow,
    });
  },

  recordCategorySkip: (categoryId) => {
    const state = get();
    const newCounts = { ...state.categorySkipCounts };
    newCounts[categoryId] = (newCounts[categoryId] || 0) + 1;

    const suppressed = Object.entries(newCounts)
      .filter(([, count]) => count >= 3)
      .map(([id]) => id);

    set({ categorySkipCounts: newCounts, suppressedCategories: suppressed });
  },

  resetCategorySkip: (categoryId) => {
    const state = get();
    const newCounts = { ...state.categorySkipCounts };
    delete newCounts[categoryId];

    const suppressed = Object.entries(newCounts)
      .filter(([, count]) => count >= 3)
      .map(([id]) => id);

    set({ categorySkipCounts: newCounts, suppressedCategories: suppressed });
  },

  recordCardShown: (pageId) => {
    set(state => {
      const newSet = new Set(state.shownNotOpenedSet);
      newSet.add(pageId);
      return { shownNotOpenedSet: newSet, shownNotOpened: [...newSet] };
    });
  },

  getSessionSnapshot: () => {
    const state = get();
    return {
      sessionId: state.sessionId,
      startedAt: state.startedAt,
      articlesOpenedThisSession: state.articlesOpenedThisSession,
      articlesReadThisSession: state.articlesReadThisSession,
      articlesSavedThisSession: state.articlesSavedThisSession,
      lastReadArticle: state.lastReadArticle,
      lastReadAt: state.lastReadAt,
      categoryCountsThisSession: state.categoryCountsThisSession,
      consecutiveSameTopic: state.consecutiveSameTopic,
      currentTopicStreak: state.currentTopicStreak,
      deepReadCount: state.deepReadCount,
      threadDepth: state.threadDepth,
      threadSeedTitle: state.threadSeedTitle,
      feedGenerationCount: state.feedGenerationCount,
      lastSearchQuery: state.lastSearchQuery,
      isInFlowState: state.isInFlowState,
      engagementVelocity: state.engagementVelocity,
      avgRecentScrollDepth: state.avgRecentScrollDepth,
      suppressedCategories: state.suppressedCategories,
      shownNotOpened: [...state.shownNotOpenedSet],
    };
  },

  buildSummary: () => {
    const state = get();

    // Find top 3 categories this session
    const topCats = Object.entries(state.categoryCountsThisSession)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => id);

    // Build unfinished threads
    const threads: UnfinishedThread[] = [];
    if (state.threadDepth > 0 && state.lastReadArticle && state.threadSeedTitle) {
      const topCat = findTopLevelCategory(state.lastReadArticle.categories);
      threads.push({
        seedPageId: state.lastReadArticle.pageId,
        seedTitle: state.threadSeedTitle,
        categoryId: topCat || '',
        depth: state.threadDepth,
        lastArticleTitle: state.lastReadArticle.title,
      });
    }

    return {
      sessionId: state.sessionId,
      startedAt: state.startedAt,
      endedAt: Date.now(),
      articlesRead: state.articlesReadThisSession,
      articlesSaved: state.articlesSavedThisSession,
      deepReadPageIds: [], // Populated by interestStore from engagement log
      topCategories: topCats,
      unfinishedThreads: threads,
    };
  },
}));

// Map Wikipedia categories to our top-level taxonomy category ID
function findTopLevelCategory(articleCategories: string[]): string | null {
  for (const cat of categories) {
    const hasOverlap = cat.wikiCategories.some(wc =>
      articleCategories.some(ac =>
        ac.toLowerCase().includes(wc.toLowerCase().replace(/_/g, ' ')) ||
        wc.toLowerCase().replace(/_/g, ' ').includes(ac.toLowerCase())
      )
    );
    if (hasOverlap) return cat.id;
  }
  return null;
}
