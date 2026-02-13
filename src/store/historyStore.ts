import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryEntry } from '../types';

interface HistoryStoreState {
  entries: HistoryEntry[];
  isLoaded: boolean;

  recordVisit: (article: {
    pageId: number;
    title: string;
    displayTitle: string;
    excerpt: string;
    thumbnailUrl?: string;
  }) => Promise<void>;
  updateScrollPosition: (pageId: number, scrollDepthPct: number) => Promise<void>;
  removeEntry: (pageId: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  getEntry: (pageId: number) => HistoryEntry | undefined;
  loadData: () => Promise<void>;
}

const STORAGE_KEY = '@rabbithole:history';
const MAX_ENTRIES = 200;

async function saveHistory(entries: HistoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('[HistoryStore] Failed to save history:', error);
  }
}

export const useHistoryStore = create<HistoryStoreState>((set, get) => ({
  entries: [],
  isLoaded: false,

  recordVisit: async (article) => {
    const { entries } = get();
    const existing = entries.find(e => e.pageId === article.pageId);

    let updated: HistoryEntry[];
    if (existing) {
      updated = entries.map(e =>
        e.pageId === article.pageId
          ? {
              ...e,
              displayTitle: article.displayTitle,
              excerpt: article.excerpt,
              thumbnailUrl: article.thumbnailUrl,
              lastViewedAt: Date.now(),
              viewCount: e.viewCount + 1,
            }
          : e
      );
    } else {
      updated = [
        ...entries,
        {
          pageId: article.pageId,
          title: article.title,
          displayTitle: article.displayTitle,
          excerpt: article.excerpt,
          thumbnailUrl: article.thumbnailUrl,
          scrollDepthPct: 0,
          lastViewedAt: Date.now(),
          viewCount: 1,
        },
      ];
    }

    // Sort most recent first, cap at MAX_ENTRIES
    updated.sort((a, b) => b.lastViewedAt - a.lastViewedAt);
    if (updated.length > MAX_ENTRIES) {
      updated = updated.slice(0, MAX_ENTRIES);
    }

    set({ entries: updated });
    await saveHistory(updated);
  },

  updateScrollPosition: async (pageId, scrollDepthPct) => {
    const { entries } = get();
    const idx = entries.findIndex(e => e.pageId === pageId);
    if (idx === -1) return;

    const updated = [...entries];
    updated[idx] = { ...updated[idx], scrollDepthPct };
    set({ entries: updated });
    await saveHistory(updated);
  },

  removeEntry: async (pageId) => {
    const updated = get().entries.filter(e => e.pageId !== pageId);
    set({ entries: updated });
    await saveHistory(updated);
  },

  clearHistory: async () => {
    set({ entries: [] });
    await saveHistory([]);
  },

  getEntry: (pageId) => {
    return get().entries.find(e => e.pageId === pageId);
  },

  loadData: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const entries: HistoryEntry[] = json ? JSON.parse(json) : [];
      set({ entries, isLoaded: true });
    } catch (error) {
      console.error('[HistoryStore] Failed to load history:', error);
      set({ isLoaded: true });
    }
  },
}));
