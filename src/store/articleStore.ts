import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Article } from '../types';

interface ArticleStoreState {
  cache: Record<number, Article>; // keyed by pageId
  currentArticleId: number | null;
  isLoaded: boolean;

  // Actions
  cacheArticle: (article: Article) => void;
  cacheArticles: (articles: Article[]) => void;
  getArticle: (pageId: number) => Article | undefined;
  setCurrentArticle: (pageId: number | null) => void;
  loadCache: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const STORAGE_KEY = '@rabbithole:articleCache';
const MAX_CACHE_SIZE = 200;

export const useArticleStore = create<ArticleStoreState>((set, get) => ({
  cache: {},
  currentArticleId: null,
  isLoaded: false,

  cacheArticle: (article) => {
    const { cache } = get();
    const updated = { ...cache, [article.pageId]: article };
    pruneCache(updated);
    set({ cache: updated });
    saveCache(updated);
  },

  cacheArticles: (articles) => {
    const { cache } = get();
    const updated = { ...cache };
    for (const article of articles) {
      updated[article.pageId] = article;
    }
    pruneCache(updated);
    set({ cache: updated });
    saveCache(updated);
  },

  getArticle: (pageId) => {
    return get().cache[pageId];
  },

  setCurrentArticle: (pageId) => {
    set({ currentArticleId: pageId });
  },

  loadCache: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const cache = JSON.parse(json) as Record<number, Article>;
        set({ cache, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('[ArticleStore] Failed to load cache:', error);
      set({ isLoaded: true });
    }
  },

  clearCache: async () => {
    set({ cache: {}, currentArticleId: null });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[ArticleStore] Failed to clear cache:', error);
    }
  },
}));

function pruneCache(cache: Record<number, Article>): void {
  const entries = Object.entries(cache);
  if (entries.length <= MAX_CACHE_SIZE) return;

  // Remove oldest entries by fetchedAt
  entries.sort(([, a], [, b]) => a.fetchedAt - b.fetchedAt);
  const toRemove = entries.length - MAX_CACHE_SIZE;
  for (let i = 0; i < toRemove; i++) {
    delete cache[Number(entries[i][0])];
  }
}

async function saveCache(cache: Record<number, Article>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('[ArticleStore] Failed to save cache:', error);
  }
}
