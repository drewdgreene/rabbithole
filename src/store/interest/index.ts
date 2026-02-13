import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  InterestProfile,
  Article,
  FeedSourceType,
  CuriosityHook,
  CuriosityStyle,
  SessionSummary,
} from '../../types';
import { categories, getParentCategory } from '../../services/categoryData';
import {
  createEmptyProfile,
  clampWeight,
  STORAGE_KEY,
} from './interestHelpers';
import { saveProfile, loadProfileFromStorage, removeProfile } from './interestPersistence';
import {
  createSignalArticleOpened,
  createSignalArticleRead,
  createSignalDeepRead,
  createSignalArticleSaved,
  createSignalLinkFollowed,
  createSignalScrolledPast,
  createSignalCardDwell,
  createSignalSearchQuery,
  createSignalSearchResultTap,
  createSignalPathSaved,
  createSignalPathRevisited,
} from './interestSignals';

interface InterestStoreState {
  profile: InterestProfile;
  isLoaded: boolean;

  // Initialization
  initializeFromOnboarding: (
    selectedCategoryIds: string[],
    selectedSubcategoryIds: string[]
  ) => Promise<void>;
  initializeFromHooks: (hooks: CuriosityHook[]) => Promise<void>;
  loadProfile: () => Promise<void>;

  // Learning signals (called from UI interactions)
  signalArticleOpened: (article: Article, sourcePool?: FeedSourceType) => void;
  signalArticleRead: (article: Article, timeSpentMs: number, scrollDepthPct?: number) => void;
  signalDeepRead: (article: Article, timeSpentMs: number, scrollDepthPct: number) => void;
  signalArticleSaved: (article: Article) => void;
  signalLinkFollowed: (fromArticle: Article, toTitle: string) => void;
  signalScrolledPast: (article: Article) => void;
  signalCardDwell: (article: Article, dwellMs: number, sourcePool: FeedSourceType) => void;
  signalSearchQuery: (query: string) => void;
  signalSearchResultTap: (article: Article, query: string) => void;
  signalPathSaved: (articles: { pageId: number; title: string; categories: string[] }[], maxDepth: number) => void;
  signalPathRevisited: (articles: { pageId: number; title: string; categories: string[] }[]) => void;

  // Feed generation persistence
  incrementFeedGeneration: () => void;

  // Session persistence
  persistSessionSummary: (summary: SessionSummary) => void;

  // Topic management (post-onboarding)
  adjustTopicWeight: (id: string, selected: boolean) => void;

  // Utilities
  getTopCategories: (n: number) => string[];
  resetProfile: () => Promise<void>;
}

export const useInterestStore = create<InterestStoreState>((set, get) => ({
  profile: createEmptyProfile(),
  isLoaded: false,

  initializeFromOnboarding: async (selectedCategoryIds, selectedSubcategoryIds) => {
    const weights: Record<string, number> = {};

    for (const catId of selectedCategoryIds) {
      weights[catId] = 0.5;
    }

    for (const subId of selectedSubcategoryIds) {
      weights[subId] = 0.7;
      const parent = getParentCategory(subId);
      if (parent && weights[parent.id] !== undefined) {
        weights[parent.id] = clampWeight(weights[parent.id] + 0.1);
      }
    }

    for (const cat of categories) {
      if (!weights[cat.id]) {
        weights[cat.id] = 0.05;
      }
    }

    const profile: InterestProfile = {
      categoryWeights: weights,
      readHistory: [],
      engagementLog: [],
      lastUpdated: Date.now(),
      profileVersion: 2,
    };

    set({ profile });
    await saveProfile(profile);
  },

  initializeFromHooks: async (hooks: CuriosityHook[]) => {
    const weights: Record<string, number> = {};

    // All categories start at floor
    for (const cat of categories) {
      weights[cat.id] = 0.05;
      for (const sub of cat.subcategories) {
        weights[sub.id] = 0.05;
      }
    }

    // Count hooks per subcategory and category
    const subCounts: Record<string, number> = {};
    const catCounts: Record<string, number> = {};
    for (const hook of hooks) {
      subCounts[hook.subcategoryId] = (subCounts[hook.subcategoryId] || 0) + 1;
      catCounts[hook.categoryId] = (catCounts[hook.categoryId] || 0) + 1;
    }

    // Apply subcategory weights: 0.7 base + 0.1 per additional hook, clamped to 1.0
    for (const [subId, count] of Object.entries(subCounts)) {
      weights[subId] = clampWeight(0.7 + (count - 1) * 0.1);
    }

    // Apply category weights: 0.5 base + 0.08 per additional hook, clamped to 1.0
    for (const [catId, count] of Object.entries(catCounts)) {
      weights[catId] = clampWeight(0.5 + (count - 1) * 0.08);
    }

    // Compute curiosity style preferences (normalized 0-1 proportions)
    const styleCounts: Record<string, number> = {};
    for (const hook of hooks) {
      styleCounts[hook.curiosityStyle] = (styleCounts[hook.curiosityStyle] || 0) + 1;
    }
    const total = hooks.length || 1;
    const stylePrefs: Record<CuriosityStyle, number> = {
      scarcity: (styleCounts['scarcity'] || 0) / total,
      mystery: (styleCounts['mystery'] || 0) / total,
      superlative: (styleCounts['superlative'] || 0) / total,
      conflict: (styleCounts['conflict'] || 0) / total,
      contrast: (styleCounts['contrast'] || 0) / total,
      number: (styleCounts['number'] || 0) / total,
    };

    const profile: InterestProfile = {
      categoryWeights: weights,
      readHistory: [],
      engagementLog: [],
      lastUpdated: Date.now(),
      profileVersion: 2,
      curiosityStylePreferences: stylePrefs,
    };

    set({ profile });
    await saveProfile(profile);
  },

  loadProfile: async () => {
    const profile = await loadProfileFromStorage();
    if (profile) {
      // Initialize missing persistent fields (backward compat)
      if (!profile.dismissedArticles) profile.dismissedArticles = [];
      if (!profile.persistedCategorySkips) profile.persistedCategorySkips = {};
      if (profile.totalFeedGenerations == null) profile.totalFeedGenerations = 0;

      // Decay persistent category skip counts (natural forgetting across restarts)
      const skips = profile.persistedCategorySkips;
      for (const catId of Object.keys(skips)) {
        skips[catId] = Math.floor(skips[catId] / 2);
        if (skips[catId] <= 0) delete skips[catId];
      }

      set({ profile, isLoaded: true });
      await saveProfile(profile); // Persist the decayed values
    } else {
      set({ isLoaded: true });
    }
  },

  // Wire up all signal handlers
  signalArticleOpened: createSignalArticleOpened(get, set),
  signalArticleRead: createSignalArticleRead(get, set),
  signalDeepRead: createSignalDeepRead(get, set),
  signalArticleSaved: createSignalArticleSaved(get, set),
  signalLinkFollowed: createSignalLinkFollowed(get, set),
  signalScrolledPast: createSignalScrolledPast(get, set),
  signalCardDwell: createSignalCardDwell(get, set),
  signalSearchQuery: createSignalSearchQuery(get, set),
  signalSearchResultTap: createSignalSearchResultTap(get, set),
  signalPathSaved: createSignalPathSaved(get, set),
  signalPathRevisited: createSignalPathRevisited(get, set),

  incrementFeedGeneration: () => {
    const { profile } = get();
    const updatedProfile = {
      ...profile,
      totalFeedGenerations: (profile.totalFeedGenerations || 0) + 1,
      lastUpdated: Date.now(),
    };
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  },

  persistSessionSummary: (summary) => {
    const { profile } = get();
    const updatedProfile = {
      ...profile,
      lastSessionSummary: summary,
      lastUpdated: Date.now(),
    };
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  },

  adjustTopicWeight: (id, selected) => {
    const { profile } = get();
    const updatedWeights = { ...profile.categoryWeights };
    const isSubcategory = !!getParentCategory(id);
    const defaultWeight = isSubcategory ? 0.7 : 0.5;

    if (selected) {
      updatedWeights[id] = Math.max(updatedWeights[id] || 0, defaultWeight);
    } else {
      updatedWeights[id] = 0.05;
    }

    const updatedProfile = {
      ...profile,
      categoryWeights: updatedWeights,
      lastUpdated: Date.now(),
    };
    set({ profile: updatedProfile });
    saveProfile(updatedProfile);
  },

  getTopCategories: (n) => {
    const { profile } = get();
    return Object.entries(profile.categoryWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, n)
      .map(([id]) => id);
  },

  resetProfile: async () => {
    const empty = createEmptyProfile();
    set({ profile: empty });
    await removeProfile();
  },
}));
