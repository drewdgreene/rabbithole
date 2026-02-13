import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FeedSourceType } from '../types';

// ─── Types ──────────────────────────────────────────────────

export interface Tab {
  id: string;
  type: 'feed' | 'article';
  // Article-specific fields
  pageId?: number;
  title?: string;
  displayTitle?: string;
  source?: FeedSourceType;
  sourceDetail?: string;
  scrollDepthPct?: number;
  thumbnailUrl?: string;
  categories?: string[];
  // Tree structure
  parentId: string | null;
  childIds: string[];
  mostRecentChildId: string | null;
  // Metadata
  createdAt: number;
  lastAccessedAt: number;
}

export interface TabTreeNode {
  tab: Tab;
  depth: number;
  children: TabTreeNode[];
}

interface TabStoreState {
  tabs: Record<string, Tab>;
  activeTabId: string;
  feedTabId: string;
  tabOrder: string[]; // root-level article tab IDs in creation order
  pendingNewRoot: boolean;
  isLoaded: boolean;

  // Lifecycle
  loadTabs: () => Promise<void>;
  clearAll: () => Promise<void>;

  // Tab creation
  openArticleFromFeed: (
    pageId: number,
    title: string,
    displayTitle: string,
    source: FeedSourceType,
    sourceDetail?: string,
    thumbnailUrl?: string,
    categories?: string[],
  ) => string;
  openArticleFromLink: (
    pageId: number,
    title: string,
    displayTitle: string,
    source?: FeedSourceType,
    sourceDetail?: string,
  ) => string;

  // Navigation
  goToParent: () => void;
  goToChild: () => void;
  goToFeed: () => void;
  switchToTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;

  // State updates
  updateScrollDepth: (tabId: string, pct: number) => void;
  updateTabArticle: (tabId: string, pageId: number, displayTitle: string, categories?: string[], thumbnailUrl?: string) => void;

  // Getters (computed from state)
  getActiveTab: () => Tab;
  getParentTab: () => Tab | null;
  getChildTab: () => Tab | null;
  getActiveTabIndex: () => { current: number; total: number };
  getTabTree: () => TabTreeNode[];
  getFlatTabOrder: () => Tab[];
  getTrailTabs: (rootTabId: string) => Tab[];
  getArticleTabCount: () => number;
  hasParent: () => boolean;
  hasChild: () => boolean;
}

// ─── Constants ──────────────────────────────────────────────

const STORAGE_KEY = '@rabbithole:tabs';
const MAX_TABS = 20;
const FEED_TAB_ID = '__feed__';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function createFeedTab(): Tab {
  return {
    id: FEED_TAB_ID,
    type: 'feed',
    parentId: null,
    childIds: [],
    mostRecentChildId: null,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  };
}

// ─── Persistence (debounced) ────────────────────────────────

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(state: Pick<TabStoreState, 'tabs' | 'activeTabId' | 'feedTabId' | 'tabOrder' | 'pendingNewRoot'>): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const data = {
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        tabOrder: state.tabOrder,
        pendingNewRoot: state.pendingNewRoot,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[TabStore] Failed to save tabs:', error);
    }
  }, 300);
}

// ─── DFS helpers ────────────────────────────────────────────

function buildTreeFromTab(tabs: Record<string, Tab>, tabId: string, depth: number): TabTreeNode | null {
  const tab = tabs[tabId];
  if (!tab) return null;
  return {
    tab,
    depth,
    children: tab.childIds
      .map(childId => buildTreeFromTab(tabs, childId, depth + 1))
      .filter((n): n is TabTreeNode => n !== null),
  };
}

function flattenTree(node: TabTreeNode): Tab[] {
  const result: Tab[] = [node.tab];
  for (const child of node.children) {
    result.push(...flattenTree(child));
  }
  return result;
}

function collectSubtreeArticleTabs(tabs: Record<string, Tab>, rootId: string): Tab[] {
  const result: Tab[] = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const tab = tabs[id];
    if (!tab) continue;
    if (tab.type === 'article') result.push(tab);
    queue.push(...tab.childIds);
  }
  return result;
}

// ─── Store ──────────────────────────────────────────────────

export const useTabStore = create<TabStoreState>((set, get) => ({
  tabs: { [FEED_TAB_ID]: createFeedTab() },
  activeTabId: FEED_TAB_ID,
  feedTabId: FEED_TAB_ID,
  tabOrder: [],
  pendingNewRoot: true,
  isLoaded: false,

  loadTabs: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        const tabs: Record<string, Tab> = data.tabs || {};

        // Ensure feed tab exists
        if (!tabs[FEED_TAB_ID]) {
          tabs[FEED_TAB_ID] = createFeedTab();
        }

        // Validate: remove orphaned tabs (parent not in tabs)
        const validIds = new Set(Object.keys(tabs));
        for (const [id, tab] of Object.entries(tabs)) {
          if (tab.parentId && !validIds.has(tab.parentId)) {
            // Orphaned — reparent to feed or remove
            if (tab.type === 'article') {
              tabs[id] = { ...tab, parentId: null };
            }
          }
          // Clean up invalid childIds
          tabs[id] = {
            ...tab,
            childIds: tab.childIds.filter(cid => validIds.has(cid)),
            mostRecentChildId: tab.mostRecentChildId && validIds.has(tab.mostRecentChildId)
              ? tab.mostRecentChildId
              : tab.childIds.filter(cid => validIds.has(cid)).pop() || null,
          };
        }

        // Validate active tab
        const activeTabId = validIds.has(data.activeTabId) ? data.activeTabId : FEED_TAB_ID;

        // Validate tabOrder
        const tabOrder = (data.tabOrder || []).filter((id: string) =>
          validIds.has(id) && tabs[id]?.type === 'article' && tabs[id]?.parentId === null
        );

        set({
          tabs,
          activeTabId,
          feedTabId: FEED_TAB_ID,
          tabOrder,
          pendingNewRoot: data.pendingNewRoot ?? true,
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('[TabStore] Failed to load tabs:', error);
      set({ isLoaded: true });
    }
  },

  clearAll: async () => {
    const feedTab = createFeedTab();
    set({
      tabs: { [FEED_TAB_ID]: feedTab },
      activeTabId: FEED_TAB_ID,
      tabOrder: [],
      pendingNewRoot: true,
    });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[TabStore] Failed to clear tabs:', error);
    }
  },

  openArticleFromFeed: (pageId, title, displayTitle, source, sourceDetail, thumbnailUrl, categories) => {
    const state = get();
    const id = generateId();
    const now = Date.now();

    const newTab: Tab = {
      id,
      type: 'article',
      pageId,
      title,
      displayTitle,
      source,
      sourceDetail,
      thumbnailUrl,
      categories,
      scrollDepthPct: 0,
      parentId: null,
      childIds: [],
      mostRecentChildId: null,
      createdAt: now,
      lastAccessedAt: now,
    };

    // Determine if this is a new root or child of the most recent root
    let parentId: string | null = null;
    if (!state.pendingNewRoot && state.tabOrder.length > 0) {
      // Attach as child of the current active tab's root branch
      parentId = state.activeTabId === FEED_TAB_ID
        ? null
        : state.activeTabId;
    }

    newTab.parentId = parentId;

    const updatedTabs = { ...state.tabs, [id]: newTab };

    // Update parent's childIds
    if (parentId && updatedTabs[parentId]) {
      updatedTabs[parentId] = {
        ...updatedTabs[parentId],
        childIds: [...updatedTabs[parentId].childIds, id],
        mostRecentChildId: id,
      };
    }

    const updatedTabOrder = parentId === null
      ? [...state.tabOrder, id]
      : state.tabOrder;

    // Update feed tab — track most recent root article for forward navigation
    updatedTabs[FEED_TAB_ID] = {
      ...updatedTabs[FEED_TAB_ID],
      lastAccessedAt: now,
      mostRecentChildId: id,
    };

    const newState = {
      tabs: updatedTabs,
      activeTabId: id,
      tabOrder: updatedTabOrder,
      pendingNewRoot: false,
    };

    set(newState);
    scheduleSave({ ...state, ...newState });

    // Prune if over limit (deferred to avoid nested get() issues)
    setTimeout(() => pruneOldestTabs(), 0);

    return id;
  },

  openArticleFromLink: (pageId, title, displayTitle, source, sourceDetail) => {
    const state = get();
    const id = generateId();
    const now = Date.now();
    const parentId = state.activeTabId;

    const newTab: Tab = {
      id,
      type: 'article',
      pageId,
      title,
      displayTitle,
      source: source || 'link',
      sourceDetail,
      scrollDepthPct: 0,
      parentId,
      childIds: [],
      mostRecentChildId: null,
      createdAt: now,
      lastAccessedAt: now,
    };

    const updatedTabs = { ...state.tabs, [id]: newTab };

    // Update parent's childIds
    if (updatedTabs[parentId]) {
      updatedTabs[parentId] = {
        ...updatedTabs[parentId],
        childIds: [...updatedTabs[parentId].childIds, id],
        mostRecentChildId: id,
      };
    }

    const newState = {
      tabs: updatedTabs,
      activeTabId: id,
    };

    set(newState);
    scheduleSave({ ...state, ...newState });

    // Prune if over limit (deferred to avoid nested get() issues)
    setTimeout(() => pruneOldestTabs(), 0);

    return id;
  },

  goToParent: () => {
    const state = get();
    const activeTab = state.tabs[state.activeTabId];
    if (!activeTab) return;

    if (activeTab.parentId && state.tabs[activeTab.parentId]) {
      const updatedTabs = { ...state.tabs };
      updatedTabs[activeTab.parentId] = {
        ...updatedTabs[activeTab.parentId],
        lastAccessedAt: Date.now(),
      };
      const newState = { tabs: updatedTabs, activeTabId: activeTab.parentId };
      set(newState);
      scheduleSave({ ...state, ...newState });
    } else if (activeTab.type === 'article') {
      // Root article tab — go to feed, preserve current article for forward nav
      const updatedTabs = { ...state.tabs };
      updatedTabs[FEED_TAB_ID] = {
        ...updatedTabs[FEED_TAB_ID],
        lastAccessedAt: Date.now(),
        mostRecentChildId: state.activeTabId,
      };
      const newState = { tabs: updatedTabs, activeTabId: FEED_TAB_ID };
      set(newState);
      scheduleSave({ ...state, ...newState });
    }
  },

  goToChild: () => {
    const state = get();
    const activeTab = state.tabs[state.activeTabId];
    if (!activeTab?.mostRecentChildId) return;

    const childId = activeTab.mostRecentChildId;
    if (!state.tabs[childId]) return;

    const updatedTabs = { ...state.tabs };
    updatedTabs[childId] = { ...updatedTabs[childId], lastAccessedAt: Date.now() };
    const newState = { tabs: updatedTabs, activeTabId: childId };
    set(newState);
    scheduleSave({ ...state, ...newState });
  },

  goToFeed: () => {
    const state = get();
    const updatedTabs = { ...state.tabs };
    // Preserve current article as feed's mostRecentChildId so forward (>) returns to it
    const currentActiveId = state.activeTabId !== FEED_TAB_ID ? state.activeTabId : undefined;
    updatedTabs[FEED_TAB_ID] = {
      ...updatedTabs[FEED_TAB_ID],
      lastAccessedAt: Date.now(),
      ...(currentActiveId ? { mostRecentChildId: currentActiveId } : {}),
    };
    const newState = { tabs: updatedTabs, activeTabId: FEED_TAB_ID, pendingNewRoot: true };
    set(newState);
    scheduleSave({ ...state, ...newState });
  },

  switchToTab: (tabId) => {
    const state = get();
    if (!state.tabs[tabId]) return;
    const updatedTabs = { ...state.tabs };
    updatedTabs[tabId] = { ...updatedTabs[tabId], lastAccessedAt: Date.now() };
    const newState = { tabs: updatedTabs, activeTabId: tabId, pendingNewRoot: false };
    set(newState);
    scheduleSave({ ...state, ...newState });
  },

  closeTab: (tabId) => {
    const state = get();
    if (tabId === FEED_TAB_ID) return; // Can't close feed tab
    const tab = state.tabs[tabId];
    if (!tab) return;

    const updatedTabs = { ...state.tabs };

    // Reparent children to this tab's parent
    for (const childId of tab.childIds) {
      if (updatedTabs[childId]) {
        updatedTabs[childId] = { ...updatedTabs[childId], parentId: tab.parentId };
      }
    }

    // Update parent's childIds: remove this tab, add its children
    if (tab.parentId && updatedTabs[tab.parentId]) {
      const parent = updatedTabs[tab.parentId];
      const newChildIds = parent.childIds
        .filter(id => id !== tabId)
        .concat(tab.childIds);
      updatedTabs[tab.parentId] = {
        ...parent,
        childIds: newChildIds,
        mostRecentChildId: newChildIds.length > 0
          ? newChildIds[newChildIds.length - 1]
          : null,
      };
    }

    // Remove from tabOrder if it's a root
    const updatedTabOrder = tab.parentId === null
      ? state.tabOrder.filter(id => id !== tabId).concat(
          // If this root had children, they become new roots
          tab.childIds.filter(cid => updatedTabs[cid])
        )
      : state.tabOrder;

    // Delete the tab
    delete updatedTabs[tabId];

    // If we closed the active tab, go to parent or feed
    let activeTabId = state.activeTabId;
    if (activeTabId === tabId) {
      activeTabId = tab.parentId && updatedTabs[tab.parentId]
        ? tab.parentId
        : FEED_TAB_ID;
    }

    const newState = { tabs: updatedTabs, activeTabId, tabOrder: updatedTabOrder };
    set(newState);
    scheduleSave({ ...state, ...newState });
  },

  updateScrollDepth: (tabId, pct) => {
    const state = get();
    if (!state.tabs[tabId]) return;
    const updatedTabs = {
      ...state.tabs,
      [tabId]: { ...state.tabs[tabId], scrollDepthPct: pct },
    };
    set({ tabs: updatedTabs });
    scheduleSave({ ...state, tabs: updatedTabs });
  },

  updateTabArticle: (tabId, pageId, displayTitle, categories, thumbnailUrl) => {
    const state = get();
    if (!state.tabs[tabId]) return;
    const updatedTabs = {
      ...state.tabs,
      [tabId]: {
        ...state.tabs[tabId],
        pageId,
        displayTitle,
        ...(categories !== undefined && { categories }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      },
    };
    set({ tabs: updatedTabs });
    scheduleSave({ ...state, tabs: updatedTabs });
  },

  // ─── Getters ────────────────────────────────────────────

  getActiveTab: () => {
    const state = get();
    return state.tabs[state.activeTabId] || state.tabs[FEED_TAB_ID];
  },

  getParentTab: () => {
    const state = get();
    const active = state.tabs[state.activeTabId];
    if (!active) return null;
    if (active.parentId && state.tabs[active.parentId]) {
      return state.tabs[active.parentId];
    }
    // Root article → parent is feed
    if (active.type === 'article') return state.tabs[FEED_TAB_ID];
    return null;
  },

  getChildTab: () => {
    const state = get();
    const active = state.tabs[state.activeTabId];
    if (!active?.mostRecentChildId) return null;
    return state.tabs[active.mostRecentChildId] || null;
  },

  getActiveTabIndex: () => {
    const flatTabs = get().getFlatTabOrder();
    const activeId = get().activeTabId;
    const idx = flatTabs.findIndex(t => t.id === activeId);
    return { current: idx + 1, total: flatTabs.length };
  },

  getTabTree: () => {
    const state = get();
    const tree: TabTreeNode[] = [];

    // Feed tab first
    const feedNode = buildTreeFromTab(state.tabs, FEED_TAB_ID, 0);
    if (feedNode) tree.push(feedNode);

    // Root article tabs in order
    for (const rootId of state.tabOrder) {
      const node = buildTreeFromTab(state.tabs, rootId, 0);
      if (node) tree.push(node);
    }

    return tree;
  },

  getFlatTabOrder: () => {
    const tree = get().getTabTree();
    const flat: Tab[] = [];
    for (const node of tree) {
      flat.push(...flattenTree(node));
    }
    return flat;
  },

  getTrailTabs: (rootTabId) => {
    const state = get();
    return collectSubtreeArticleTabs(state.tabs, rootTabId);
  },

  getArticleTabCount: () => {
    const state = get();
    return Object.values(state.tabs).filter(t => t.type === 'article').length;
  },

  hasParent: () => {
    const state = get();
    const active = state.tabs[state.activeTabId];
    if (!active) return false;
    if (active.type === 'feed') return false;
    return true; // article always has parent (either another article or conceptually the feed)
  },

  hasChild: () => {
    const state = get();
    const active = state.tabs[state.activeTabId];
    if (!active) return false;
    return !!active.mostRecentChildId && !!state.tabs[active.mostRecentChildId];
  },
}));

// ─── Pruning (standalone, accesses store via useTabStore.getState) ──

function pruneOldestTabs(): void {
  const state = useTabStore.getState();
  const articleCount = state.getArticleTabCount();
  if (articleCount <= MAX_TABS) return;

  const updatedTabs = { ...state.tabs };
  let updatedTabOrder = [...state.tabOrder];

  // Build set of protected tabs: active tab and its ancestors
  const protectedIds = new Set<string>();
  let current: string | null = state.activeTabId;
  while (current) {
    protectedIds.add(current);
    current = updatedTabs[current]?.parentId || null;
  }

  let toRemove = articleCount - MAX_TABS;

  while (toRemove > 0) {
    // Find leaf article tabs (no children), sorted by lastAccessedAt
    const leaves = Object.values(updatedTabs)
      .filter(t =>
        t.type === 'article' &&
        t.childIds.length === 0 &&
        !protectedIds.has(t.id)
      )
      .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

    if (leaves.length === 0) break; // Can't prune any more

    const leaf = leaves[0];

    // Remove from parent's childIds
    if (leaf.parentId && updatedTabs[leaf.parentId]) {
      const parent = updatedTabs[leaf.parentId];
      const newChildIds = parent.childIds.filter(id => id !== leaf.id);
      updatedTabs[leaf.parentId] = {
        ...parent,
        childIds: newChildIds,
        mostRecentChildId: newChildIds.length > 0
          ? newChildIds[newChildIds.length - 1]
          : null,
      };
    }

    // Remove from tabOrder if root
    if (!leaf.parentId) {
      updatedTabOrder = updatedTabOrder.filter(id => id !== leaf.id);
    }

    delete updatedTabs[leaf.id];
    toRemove--;
  }

  const newState = { tabs: updatedTabs, tabOrder: updatedTabOrder };
  useTabStore.setState(newState);
  scheduleSave({ ...useTabStore.getState(), ...newState });
}

// Export for external use (e.g., algorithm signals on prune)
export { pruneOldestTabs };
