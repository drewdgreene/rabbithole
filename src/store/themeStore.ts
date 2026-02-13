import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '../types';

interface ThemeState {
  themeMode: ThemeMode;
  isLoaded: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  loadThemePreferences: () => Promise<void>;
}

const STORAGE_KEYS = {
  THEME_MODE: '@rabbithole:themeMode',
};

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: 'system',
  isLoaded: false,

  setThemeMode: async (mode: ThemeMode) => {
    set({ themeMode: mode });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch (error) {
      console.error('[ThemeStore] Failed to save theme mode:', error);
    }
  },

  loadThemePreferences: async () => {
    try {
      const themeMode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
      set({
        themeMode: (themeMode as ThemeMode) || 'system',
        isLoaded: true,
      });
    } catch (error) {
      console.error('[ThemeStore] Failed to load theme preferences:', error);
      set({ isLoaded: true });
    }
  },
}));
