import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Notebook, SavedArticle, Path, PathTab } from '../types';
import { useTabStore, type Tab } from './tabStore';
import { useInterestStore } from './interestStore';
import { useSessionStore } from './sessionStore';

interface NotebookStoreState {
  notebooks: Notebook[];
  savedArticles: SavedArticle[];
  paths: Path[];
  isLoaded: boolean;

  // Notebook actions
  createNotebook: (name: string) => Promise<Notebook>;
  renameNotebook: (id: string, name: string) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;

  // Save article actions
  saveArticle: (article: Omit<SavedArticle, 'savedAt' | 'notebookIds'>, notebookId?: string) => Promise<void>;
  unsaveArticle: (pageId: number) => Promise<void>;
  addToNotebook: (pageId: number, notebookId: string) => Promise<void>;
  removeFromNotebook: (pageId: number, notebookId: string) => Promise<void>;
  isArticleSaved: (pageId: number) => boolean;

  // Path actions
  savePath: (name: string, rootTabId: string) => Promise<Path | null>;
  loadPath: (pathId: string) => void;
  deletePath: (pathId: string) => Promise<void>;
  renamePath: (pathId: string, name: string) => Promise<void>;

  // Loading
  loadData: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const STORAGE_KEYS = {
  NOTEBOOKS: '@rabbithole:notebooks',
  SAVED_ARTICLES: '@rabbithole:savedArticles',
  PATHS: '@rabbithole:paths',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

const MAX_PATHS = 50;

export const useNotebookStore = create<NotebookStoreState>((set, get) => ({
  notebooks: [],
  savedArticles: [],
  paths: [],
  isLoaded: false,

  createNotebook: async (name) => {
    const notebook: Notebook = {
      id: generateId(),
      name,
      articleIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [...get().notebooks, notebook];
    set({ notebooks: updated });
    await saveNotebooks(updated);
    return notebook;
  },

  renameNotebook: async (id, name) => {
    const updated = get().notebooks.map(n =>
      n.id === id ? { ...n, name, updatedAt: Date.now() } : n
    );
    set({ notebooks: updated });
    await saveNotebooks(updated);
  },

  deleteNotebook: async (id) => {
    const updated = get().notebooks.filter(n => n.id !== id);
    set({ notebooks: updated });

    // Remove notebook reference from saved articles
    const updatedArticles = get().savedArticles.map(a => ({
      ...a,
      notebookIds: a.notebookIds.filter(nId => nId !== id),
    }));
    set({ savedArticles: updatedArticles });

    await Promise.all([
      saveNotebooks(updated),
      saveSavedArticles(updatedArticles),
    ]);
  },

  saveArticle: async (article, notebookId) => {
    const { savedArticles, notebooks } = get();
    const existing = savedArticles.find(a => a.pageId === article.pageId);

    if (existing) {
      // Article already saved — optionally add to notebook
      if (notebookId && !existing.notebookIds.includes(notebookId)) {
        const updatedArticles = savedArticles.map(a =>
          a.pageId === article.pageId
            ? { ...a, notebookIds: [...a.notebookIds, notebookId] }
            : a
        );
        set({ savedArticles: updatedArticles });
        // Also update notebook articleIds
        const updatedNotebooks = notebooks.map(n =>
          n.id === notebookId && !n.articleIds.includes(article.pageId)
            ? { ...n, articleIds: [...n.articleIds, article.pageId], updatedAt: Date.now() }
            : n
        );
        set({ notebooks: updatedNotebooks });
        await Promise.all([
          saveSavedArticles(updatedArticles),
          saveNotebooks(updatedNotebooks),
        ]);
      }
      return;
    }

    // New save
    const saved: SavedArticle = {
      ...article,
      savedAt: Date.now(),
      notebookIds: notebookId ? [notebookId] : [],
    };

    const updatedArticles = [...savedArticles, saved];
    set({ savedArticles: updatedArticles });

    if (notebookId) {
      const updatedNotebooks = notebooks.map(n =>
        n.id === notebookId
          ? { ...n, articleIds: [...n.articleIds, article.pageId], updatedAt: Date.now() }
          : n
      );
      set({ notebooks: updatedNotebooks });
      await saveNotebooks(updatedNotebooks);
    }

    await saveSavedArticles(updatedArticles);
  },

  unsaveArticle: async (pageId) => {
    const { savedArticles, notebooks } = get();
    const updatedArticles = savedArticles.filter(a => a.pageId !== pageId);
    set({ savedArticles: updatedArticles });

    // Remove from all notebooks
    const updatedNotebooks = notebooks.map(n => ({
      ...n,
      articleIds: n.articleIds.filter(id => id !== pageId),
      updatedAt: Date.now(),
    }));
    set({ notebooks: updatedNotebooks });

    await Promise.all([
      saveSavedArticles(updatedArticles),
      saveNotebooks(updatedNotebooks),
    ]);
  },

  addToNotebook: async (pageId, notebookId) => {
    const { savedArticles, notebooks } = get();

    const updatedArticles = savedArticles.map(a =>
      a.pageId === pageId && !a.notebookIds.includes(notebookId)
        ? { ...a, notebookIds: [...a.notebookIds, notebookId] }
        : a
    );
    const updatedNotebooks = notebooks.map(n =>
      n.id === notebookId && !n.articleIds.includes(pageId)
        ? { ...n, articleIds: [...n.articleIds, pageId], updatedAt: Date.now() }
        : n
    );

    set({ savedArticles: updatedArticles, notebooks: updatedNotebooks });
    await Promise.all([
      saveSavedArticles(updatedArticles),
      saveNotebooks(updatedNotebooks),
    ]);
  },

  removeFromNotebook: async (pageId, notebookId) => {
    const { savedArticles, notebooks } = get();

    const updatedArticles = savedArticles.map(a =>
      a.pageId === pageId
        ? { ...a, notebookIds: a.notebookIds.filter(id => id !== notebookId) }
        : a
    );
    const updatedNotebooks = notebooks.map(n =>
      n.id === notebookId
        ? { ...n, articleIds: n.articleIds.filter(id => id !== pageId), updatedAt: Date.now() }
        : n
    );

    set({ savedArticles: updatedArticles, notebooks: updatedNotebooks });
    await Promise.all([
      saveSavedArticles(updatedArticles),
      saveNotebooks(updatedNotebooks),
    ]);
  },

  isArticleSaved: (pageId) => {
    return get().savedArticles.some(a => a.pageId === pageId);
  },

  // ─── Path actions ────────────────────────────────────────

  savePath: async (name, _rootTabId) => {
    const tabState = useTabStore.getState();

    // Collect ALL article tabs from ALL roots (not just one subtree)
    const allArticleTabs: Tab[] = [];
    const depthMap = new Map<string, number>();
    for (const rootId of tabState.tabOrder) {
      const queue: { id: string; depth: number }[] = [{ id: rootId, depth: 0 }];
      while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        const tab = tabState.tabs[id];
        if (!tab) continue;
        depthMap.set(id, depth);
        if (tab.type === 'article') allArticleTabs.push(tab);
        for (const childId of tab.childIds) {
          queue.push({ id: childId, depth: depth + 1 });
        }
      }
    }
    if (allArticleTabs.length === 0) return null;

    const pathTabs: PathTab[] = allArticleTabs.map(tab => ({
      id: tab.id,
      pageId: tab.pageId || 0,
      title: tab.title || '',
      displayTitle: tab.displayTitle || tab.title || '',
      thumbnailUrl: tab.thumbnailUrl,
      categories: tab.categories || [],
      scrollDepthPct: tab.scrollDepthPct || 0,
      parentId: tab.parentId,
      childIds: tab.childIds,
      depth: depthMap.get(tab.id) || 0,
    }));

    const allCategories = new Set<string>();
    for (const pt of pathTabs) {
      for (const cat of pt.categories) allCategories.add(cat);
    }

    const maxDepth = Math.max(0, ...pathTabs.map(pt => pt.depth));
    const rootTab = allArticleTabs[0];

    const path: Path = {
      id: generateId(),
      name,
      tabs: pathTabs,
      rootTitle: rootTab?.displayTitle || rootTab?.title || name,
      thumbnailUrl: rootTab?.thumbnailUrl,
      categories: Array.from(allCategories),
      articleCount: pathTabs.length,
      maxDepth,
      createdAt: Date.now(),
      lastOpenedAt: Date.now(),
    };

    let updated = [...get().paths, path];
    // Enforce max paths — remove oldest first
    if (updated.length > MAX_PATHS) {
      updated = updated
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, MAX_PATHS);
    }

    set({ paths: updated });
    await savePaths(updated);

    // Fire algorithm signals
    const articles = pathTabs.map(pt => ({
      pageId: pt.pageId,
      title: pt.title,
      categories: pt.categories,
    }));
    useInterestStore.getState().signalPathSaved(articles, maxDepth);
    useSessionStore.getState().recordPathSaved();

    return path;
  },

  loadPath: (pathId) => {
    const { paths } = get();
    const path = paths.find(p => p.id === pathId);
    if (!path || path.tabs.length === 0) return;

    // Update lastOpenedAt
    const updatedPaths = paths.map(p =>
      p.id === pathId ? { ...p, lastOpenedAt: Date.now() } : p
    );
    set({ paths: updatedPaths });
    savePaths(updatedPaths);

    // Rebuild tabs in tabStore
    const tabStore = useTabStore.getState();

    // Clear existing tabs and start fresh
    const feedTab = tabStore.tabs[tabStore.feedTabId];
    const newTabs: Record<string, Tab> = {
      [tabStore.feedTabId]: { ...feedTab, lastAccessedAt: Date.now() },
    };
    const newTabOrder: string[] = [];

    // Re-create article tabs from the path snapshot
    for (const pt of path.tabs) {
      newTabs[pt.id] = {
        id: pt.id,
        type: 'article',
        pageId: pt.pageId,
        title: pt.title,
        displayTitle: pt.displayTitle,
        thumbnailUrl: pt.thumbnailUrl,
        categories: pt.categories,
        scrollDepthPct: pt.scrollDepthPct,
        parentId: pt.parentId,
        childIds: pt.childIds,
        mostRecentChildId: pt.childIds.length > 0 ? pt.childIds[pt.childIds.length - 1] : null,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      };
      // Root-level article tabs (no parent or parent not in this path)
      if (!pt.parentId || !path.tabs.some(t => t.id === pt.parentId)) {
        newTabOrder.push(pt.id);
      }
    }

    // Set active to the last (deepest) tab for immediate reading
    const activeTabId = path.tabs[path.tabs.length - 1]?.id || tabStore.feedTabId;

    // Update feed tab's mostRecentChildId so forward nav works
    newTabs[tabStore.feedTabId] = {
      ...newTabs[tabStore.feedTabId],
      mostRecentChildId: activeTabId,
    };

    useTabStore.setState({
      tabs: newTabs,
      activeTabId,
      tabOrder: newTabOrder,
      pendingNewRoot: false,
    });

    // Fire algorithm signal
    const articles = path.tabs.map(pt => ({
      pageId: pt.pageId,
      title: pt.title,
      categories: pt.categories,
    }));
    useInterestStore.getState().signalPathRevisited(articles);
  },

  deletePath: async (pathId) => {
    const updated = get().paths.filter(p => p.id !== pathId);
    set({ paths: updated });
    await savePaths(updated);
  },

  renamePath: async (pathId, name) => {
    const updated = get().paths.map(p =>
      p.id === pathId ? { ...p, name } : p
    );
    set({ paths: updated });
    await savePaths(updated);
  },

  loadData: async () => {
    try {
      const [notebooksJson, articlesJson, pathsJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.NOTEBOOKS),
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_ARTICLES),
        AsyncStorage.getItem(STORAGE_KEYS.PATHS),
      ]);

      set({
        notebooks: notebooksJson ? JSON.parse(notebooksJson) : [],
        savedArticles: articlesJson ? JSON.parse(articlesJson) : [],
        paths: pathsJson ? JSON.parse(pathsJson) : [],
        isLoaded: true,
      });
    } catch (error) {
      console.error('[NotebookStore] Failed to load data:', error);
      set({ isLoaded: true });
    }
  },

  clearAll: async () => {
    set({ notebooks: [], savedArticles: [], paths: [] });
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.NOTEBOOKS),
        AsyncStorage.removeItem(STORAGE_KEYS.SAVED_ARTICLES),
        AsyncStorage.removeItem(STORAGE_KEYS.PATHS),
      ]);
    } catch (error) {
      console.error('[NotebookStore] Failed to clear data:', error);
    }
  },
}));

async function saveNotebooks(notebooks: Notebook[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify(notebooks));
  } catch (error) {
    console.error('[NotebookStore] Failed to save notebooks:', error);
  }
}

async function saveSavedArticles(articles: SavedArticle[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_ARTICLES, JSON.stringify(articles));
  } catch (error) {
    console.error('[NotebookStore] Failed to save articles:', error);
  }
}

async function savePaths(paths: Path[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PATHS, JSON.stringify(paths));
  } catch (error) {
    console.error('[NotebookStore] Failed to save paths:', error);
  }
}
