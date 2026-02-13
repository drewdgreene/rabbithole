import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingStatus } from '../types';
import { getHookById } from '../services/curiosityHooks';

export interface CustomTopic {
  id: string;          // 'custom:' + wikiCategory
  name: string;        // Display name
  wikiCategory: string; // Wikipedia category name
}

interface OnboardingStoreState {
  status: OnboardingStatus;
  selectedCategoryIds: string[];
  selectedSubcategoryIds: string[];
  selectedHookIds: string[];
  customTopics: CustomTopic[];
  currentStep: number; // 0 = category selection, 1+ = subcategory steps
  isLoaded: boolean;

  // Actions
  toggleCategory: (categoryId: string) => void;
  toggleSubcategory: (subcategoryId: string) => void;
  toggleHook: (hookId: string) => void;
  addCustomTopic: (name: string, wikiCategory: string) => void;
  removeCustomTopic: (wikiCategory: string) => void;
  isCustomTopicSelected: (wikiCategory: string) => boolean;
  setCurrentStep: (step: number) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  loadOnboardingState: () => Promise<void>;
}

const STORAGE_KEYS = {
  STATUS: '@rabbithole:onboardingStatus',
  CATEGORIES: '@rabbithole:onboardingCategories',
  SUBCATEGORIES: '@rabbithole:onboardingSubcategories',
  HOOKS: '@rabbithole:onboardingHooks',
  CUSTOM_TOPICS: '@rabbithole:customTopics',
};

export const useOnboardingStore = create<OnboardingStoreState>((set, get) => ({
  status: 'not_started',
  selectedCategoryIds: [],
  selectedSubcategoryIds: [],
  selectedHookIds: [],
  customTopics: [],
  currentStep: 0,
  isLoaded: false,

  toggleCategory: (categoryId: string) => {
    const { selectedCategoryIds, status } = get();
    const updated = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId];

    // Only transition to in_progress if not already completed (avoid re-triggering onboarding)
    const newStatus = status === 'completed' ? 'completed' : 'in_progress';
    set({ selectedCategoryIds: updated, status: newStatus });

    // Persist
    AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated)).catch(
      err => console.error('[OnboardingStore] Failed to save categories:', err)
    );
    if (newStatus !== status) {
      AsyncStorage.setItem(STORAGE_KEYS.STATUS, newStatus).catch(
        err => console.error('[OnboardingStore] Failed to save status:', err)
      );
    }
  },

  toggleSubcategory: (subcategoryId: string) => {
    const { selectedSubcategoryIds } = get();
    const updated = selectedSubcategoryIds.includes(subcategoryId)
      ? selectedSubcategoryIds.filter(id => id !== subcategoryId)
      : [...selectedSubcategoryIds, subcategoryId];
    set({ selectedSubcategoryIds: updated });

    AsyncStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(updated)).catch(
      err => console.error('[OnboardingStore] Failed to save subcategories:', err)
    );
  },

  toggleHook: (hookId: string) => {
    const { selectedHookIds } = get();
    const updated = selectedHookIds.includes(hookId)
      ? selectedHookIds.filter(id => id !== hookId)
      : [...selectedHookIds, hookId];

    // Derive category/subcategory selections from hooks for TopicsScreen compat
    const hooks = updated.map(id => getHookById(id)).filter(Boolean);
    const categoryIds = [...new Set(hooks.map(h => h!.categoryId))];
    const subcategoryIds = [...new Set(hooks.map(h => h!.subcategoryId))];

    set({
      selectedHookIds: updated,
      selectedCategoryIds: categoryIds,
      selectedSubcategoryIds: subcategoryIds,
      status: 'in_progress',
    });

    // Persist
    AsyncStorage.setItem(STORAGE_KEYS.HOOKS, JSON.stringify(updated)).catch(
      err => console.error('[OnboardingStore] Failed to save hooks:', err)
    );
    AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categoryIds)).catch(
      err => console.error('[OnboardingStore] Failed to save categories:', err)
    );
    AsyncStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(subcategoryIds)).catch(
      err => console.error('[OnboardingStore] Failed to save subcategories:', err)
    );
    AsyncStorage.setItem(STORAGE_KEYS.STATUS, 'in_progress').catch(
      err => console.error('[OnboardingStore] Failed to save status:', err)
    );
  },

  addCustomTopic: (name: string, wikiCategory: string) => {
    const { customTopics } = get();
    if (customTopics.some(t => t.wikiCategory === wikiCategory)) return;
    const updated = [...customTopics, { id: `custom:${wikiCategory}`, name, wikiCategory }];
    set({ customTopics: updated });
    AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_TOPICS, JSON.stringify(updated)).catch(
      err => console.error('[OnboardingStore] Failed to save custom topics:', err)
    );
  },

  removeCustomTopic: (wikiCategory: string) => {
    const { customTopics } = get();
    const updated = customTopics.filter(t => t.wikiCategory !== wikiCategory);
    set({ customTopics: updated });
    AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_TOPICS, JSON.stringify(updated)).catch(
      err => console.error('[OnboardingStore] Failed to save custom topics:', err)
    );
  },

  isCustomTopicSelected: (wikiCategory: string) => {
    return get().customTopics.some(t => t.wikiCategory === wikiCategory);
  },

  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  completeOnboarding: async () => {
    set({ status: 'completed' });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STATUS, 'completed');
    } catch (error) {
      console.error('[OnboardingStore] Failed to save completion:', error);
    }
  },

  resetOnboarding: async () => {
    set({
      status: 'not_started',
      selectedCategoryIds: [],
      selectedSubcategoryIds: [],
      selectedHookIds: [],
      customTopics: [],
      currentStep: 0,
    });
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.STATUS),
        AsyncStorage.removeItem(STORAGE_KEYS.CATEGORIES),
        AsyncStorage.removeItem(STORAGE_KEYS.SUBCATEGORIES),
        AsyncStorage.removeItem(STORAGE_KEYS.HOOKS),
        AsyncStorage.removeItem(STORAGE_KEYS.CUSTOM_TOPICS),
      ]);
    } catch (error) {
      console.error('[OnboardingStore] Failed to reset:', error);
    }
  },

  loadOnboardingState: async () => {
    try {
      const [status, categoriesJson, subcategoriesJson, hooksJson, customJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.STATUS),
        AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES),
        AsyncStorage.getItem(STORAGE_KEYS.SUBCATEGORIES),
        AsyncStorage.getItem(STORAGE_KEYS.HOOKS),
        AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_TOPICS),
      ]);

      set({
        status: (status as OnboardingStatus) || 'not_started',
        selectedCategoryIds: categoriesJson ? JSON.parse(categoriesJson) : [],
        selectedSubcategoryIds: subcategoriesJson ? JSON.parse(subcategoriesJson) : [],
        selectedHookIds: hooksJson ? JSON.parse(hooksJson) : [],
        customTopics: customJson ? JSON.parse(customJson) : [],
        isLoaded: true,
      });
    } catch (error) {
      console.error('[OnboardingStore] Failed to load state:', error);
      set({ isLoaded: true });
    }
  },
}));
