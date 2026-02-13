import { create } from 'zustand';
import type { FeedItem } from '../types';

interface FeedStoreState {
  items: FeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  lastGeneratedAt: number | null;
  error: string | null;

  // Actions
  setItems: (items: FeedItem[]) => void;
  appendItems: (items: FeedItem[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  clearFeed: () => void;
}

export const useFeedStore = create<FeedStoreState>((set) => ({
  items: [],
  isLoading: false,
  isRefreshing: false,
  lastGeneratedAt: null,
  error: null,

  setItems: (items) => {
    set({ items, lastGeneratedAt: Date.now(), error: null });
  },

  appendItems: (newItems) => {
    set((state) => {
      // Deduplicate by pageId
      const existingIds = new Set(state.items.map(i => i.article.pageId));
      const unique = newItems.filter(i => !existingIds.has(i.article.pageId));
      return { items: [...state.items, ...unique] };
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
  setError: (error) => set({ error }),

  clearFeed: () => {
    set({ items: [], lastGeneratedAt: null, error: null });
  },
}));
