import { createTamagui, createTokens } from 'tamagui';
import { createAnimations } from '@tamagui/animations-react-native';
import { lightColors, darkColors } from './src/theme/colors';

const animations = createAnimations({
  fast: {
    type: 'timing',
    duration: 150,
  },
  medium: {
    type: 'timing',
    duration: 200,
  },
  slow: {
    type: 'timing',
    duration: 300,
  },
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: 'timing',
    duration: 400,
  },
  quick: {
    type: 'timing',
    duration: 100,
  },
});

const tokens = createTokens({
  color: {
    background: lightColors.background,
    backgroundSecondary: lightColors.backgroundSecondary,
    backgroundTertiary: lightColors.backgroundTertiary,
    backgroundDark: darkColors.background,
    backgroundSecondaryDark: darkColors.backgroundSecondary,
    backgroundTertiaryDark: darkColors.backgroundTertiary,
    transparent: 'transparent',
  },
  space: {
    0: 0,
    xs: 4,
    sm: 8,
    md: 16,
    true: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  size: {
    0: 0,
    sm: 8,
    md: 16,
    true: 16,
    lg: 24,
    full: '100%',
  },
  radius: {
    0: 0,
    true: 8,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
  },
});

const lightTheme = {
  background: tokens.color.background,
  backgroundSecondary: tokens.color.backgroundSecondary,
  backgroundTertiary: tokens.color.backgroundTertiary,
};

const darkTheme = {
  background: tokens.color.backgroundDark,
  backgroundSecondary: tokens.color.backgroundSecondaryDark,
  backgroundTertiary: tokens.color.backgroundTertiaryDark,
};

export const config = createTamagui({
  tokens,
  animations,
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  shorthands: {
    bg: 'backgroundColor',
  } as const,
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
