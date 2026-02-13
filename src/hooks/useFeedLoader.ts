import { useCallback, useEffect, useRef } from 'react';
import { useFeedStore } from '../store/feedStore';
import { useInterestStore } from '../store/interestStore';
import { useArticleStore } from '../store/articleStore';
import { useSessionStore } from '../store/sessionStore';
import { useNotebookStore } from '../store/notebookStore';
import { generateFeed, loadMoreFeed } from '../services/feedAlgorithm';
import type { FeedContext, FeedItem } from '../types';

function buildContext(
  mode: FeedContext['mode'],
  profile: ReturnType<typeof useInterestStore.getState>['profile'],
  existingPageIds: Set<number>
): FeedContext {
  const sessionSnap = useSessionStore.getState().getSessionSnapshot();
  const now = new Date();

  // Calculate days since last session
  let daysSinceLastSession = 0;
  let previousSessionSummary = profile.lastSessionSummary || null;
  if (previousSessionSummary) {
    daysSinceLastSession = (Date.now() - previousSessionSummary.endedAt) / 86400000;
  }

  // Get recently saved article titles for link pool seeding
  const savedArticles = useNotebookStore.getState().savedArticles;
  const recentSavedTitles = [...savedArticles]
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, 5)
    .map(s => s.title);

  return {
    mode,
    session: sessionSnap,
    profile,
    existingPageIds,
    hourOfDay: now.getHours(),
    daysSinceLastSession,
    previousSessionSummary,
    recentSavedTitles,
  };
}

export function useFeedLoader() {
  const {
    items,
    isLoading,
    isRefreshing,
    error,
    setItems,
    appendItems,
    setLoading,
    setRefreshing,
    setError,
  } = useFeedStore();

  const { profile } = useInterestStore();
  const { cacheArticles } = useArticleStore();
  const { recordFeedGeneration, shouldResetThread, resetThread } = useSessionStore();
  const loadingRef = useRef(false);

  // Prefetch state (refs to avoid re-renders)
  const prefetchBufferRef = useRef<FeedItem[] | null>(null);
  const isPrefetchingRef = useRef(false);

  // Detect when profile has category weights (i.e., onboarding is done)
  const hasProfile = Object.keys(profile.categoryWeights).length > 0;

  // Load feed when profile becomes available and feed is empty
  useEffect(() => {
    if (!hasProfile || loadingRef.current) return;
    if (items.length > 0) return;

    let cancelled = false;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const ctx = buildContext('initial', profile, new Set());
        const feedItems = await generateFeed(ctx);
        if (!cancelled) {
          setItems(feedItems);
          cacheArticles(feedItems.map(fi => fi.article));
          if (shouldResetThread()) resetThread();
          recordFeedGeneration();
          useInterestStore.getState().incrementFeedGeneration();
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[useFeedLoader] Failed to generate feed:', err);
          setError(err.message || 'Failed to load feed');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    })();

    return () => { cancelled = true; };
  }, [hasProfile]);

  const loadFeed = useCallback(async () => {
    if (isLoading) return;
    setLoading(true);
    setError(null);

    try {
      const ctx = buildContext('initial', profile, new Set());
      const feedItems = await generateFeed(ctx);
      setItems(feedItems);
      cacheArticles(feedItems.map(fi => fi.article));
      if (shouldResetThread()) resetThread();
      recordFeedGeneration();
      useInterestStore.getState().incrementFeedGeneration();
    } catch (err: any) {
      console.error('[useFeedLoader] Failed to generate feed:', err);
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [profile, isLoading, setItems, setLoading, setError, cacheArticles, recordFeedGeneration, shouldResetThread, resetThread]);

  const refreshFeed = useCallback(async () => {
    if (isRefreshing) return;
    setRefreshing(true);
    setError(null);
    prefetchBufferRef.current = null;

    try {
      const ctx = buildContext('refresh', profile, new Set());
      const feedItems = await generateFeed(ctx);
      setItems(feedItems);
      cacheArticles(feedItems.map(fi => fi.article));
      if (shouldResetThread()) resetThread();
      recordFeedGeneration();
      useInterestStore.getState().incrementFeedGeneration();
    } catch (err: any) {
      console.error('[useFeedLoader] Failed to refresh feed:', err);
      setError(err.message || 'Failed to refresh feed');
    } finally {
      setRefreshing(false);
    }
  }, [profile, isRefreshing, setItems, setRefreshing, setError, cacheArticles, recordFeedGeneration, shouldResetThread, resetThread]);

  const prefetchMore = useCallback(async () => {
    if (isPrefetchingRef.current || prefetchBufferRef.current) return;

    isPrefetchingRef.current = true;
    try {
      const currentItems = useFeedStore.getState().items;
      const existingIds = new Set(currentItems.map(i => i.article.pageId));
      const ctx = buildContext('load_more', profile, existingIds);
      const moreItems = await loadMoreFeed(ctx);
      prefetchBufferRef.current = moreItems;
      cacheArticles(moreItems.map(fi => fi.article));
    } catch (err) {
      console.error('[useFeedLoader] Prefetch failed:', err);
    } finally {
      isPrefetchingRef.current = false;
    }
  }, [profile, cacheArticles]);

  const loadMore = useCallback(async () => {
    if (isLoading || isRefreshing) return;

    // Fast path: use prefetched items
    const buffered = prefetchBufferRef.current;
    if (buffered && buffered.length > 0) {
      prefetchBufferRef.current = null;
      appendItems(buffered);
      // Kick off next prefetch
      setTimeout(() => prefetchMore(), 100);
      return;
    }

    // Slow path: fetch on-demand
    setLoading(true);
    try {
      const existingIds = new Set(items.map(i => i.article.pageId));
      const ctx = buildContext('load_more', profile, existingIds);
      const moreItems = await loadMoreFeed(ctx);
      appendItems(moreItems);
      cacheArticles(moreItems.map(fi => fi.article));
      // Kick off next prefetch
      setTimeout(() => prefetchMore(), 100);
    } catch (err: any) {
      console.error('[useFeedLoader] Failed to load more:', err);
    } finally {
      setLoading(false);
    }
  }, [profile, items, isLoading, isRefreshing, appendItems, setLoading, cacheArticles, prefetchMore]);

  return {
    items,
    isLoading,
    isRefreshing,
    error,
    loadFeed,
    refreshFeed,
    loadMore,
    prefetchMore,
  };
}
