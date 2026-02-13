import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from './colors';
import { platformShadow } from '../utils/shadows';
import { useThemeStore } from '../store/themeStore';

export { lightColors, darkColors } from './colors';
export { typography, desktopTypography, FONTS } from './typography';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const desktopSpacing = {
  xs: 5,
  sm: 10,
  md: 20,
  lg: 30,
  xl: 40,
  xxl: 60,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  pill: 999,
} as const;

const shadowConfigs = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

export const platformShadows = {
  sm: platformShadow(shadowConfigs.sm),
  md: platformShadow(shadowConfigs.md),
  lg: platformShadow(shadowConfigs.lg),
} as const;

export const useEffectiveColorScheme = (): 'light' | 'dark' => {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useThemeStore();

  if (themeMode === 'system') {
    return systemColorScheme || 'light';
  }
  return themeMode;
};

export const useThemeColors = () => {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useThemeStore();

  let effectiveScheme: 'light' | 'dark';
  if (themeMode === 'system') {
    effectiveScheme = systemColorScheme || 'light';
  } else {
    effectiveScheme = themeMode;
  }

  return effectiveScheme === 'dark' ? darkColors : lightColors;
};

export const colors = lightColors;
