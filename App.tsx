import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';
import * as Font from 'expo-font';
import { useThemeStore } from './src/store/themeStore';
import { useOnboardingStore } from './src/store/onboardingStore';
import { useInterestStore } from './src/store/interestStore';
import { useArticleStore } from './src/store/articleStore';
import { useNotebookStore } from './src/store/notebookStore';
import { useHistoryStore } from './src/store/historyStore';
import { useTabStore } from './src/store/tabStore';
import { AppNavigator } from './src/navigation/AppNavigator';
import { isWeb } from './src/utils/platform';
import { config } from './tamagui.config';
import { lightColors, darkColors } from './src/theme/colors';

export default function App() {
  const systemColorScheme = useColorScheme();
  const { themeMode, isLoaded: themeLoaded } = useThemeStore();
  const { isLoaded: onboardingLoaded } = useOnboardingStore();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const effectiveColorScheme = themeMode === 'system'
    ? (systemColorScheme || 'light')
    : themeMode;

  const colors = effectiveColorScheme === 'dark' ? darkColors : lightColors;

  // Load fonts
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        GoogleSansFlex_400Regular: require('./assets/fonts/GoogleSansFlex_400Regular.ttf'),
        GoogleSansFlex_500Medium: require('./assets/fonts/GoogleSansFlex_500Medium.ttf'),
        GoogleSansFlex_600SemiBold: require('./assets/fonts/GoogleSansFlex_600SemiBold.ttf'),
        GoogleSansFlex_700Bold: require('./assets/fonts/GoogleSansFlex_700Bold.ttf'),
        CrimsonPro_700Bold: require('./assets/fonts/CrimsonPro_700Bold.ttf'),
        CrimsonPro_800ExtraBold: require('./assets/fonts/CrimsonPro_800ExtraBold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  // Initialize all stores
  useEffect(() => {
    useThemeStore.getState().loadThemePreferences();
    useOnboardingStore.getState().loadOnboardingState();
    useInterestStore.getState().loadProfile();
    useArticleStore.getState().loadCache();
    useNotebookStore.getState().loadData();
    useHistoryStore.getState().loadData();
    useTabStore.getState().loadTabs();
  }, []);

  // Inject web CSS for scrollbars and input focus
  useEffect(() => {
    if (!isWeb || typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      #root {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      input:focus,
      textarea:focus,
      [contenteditable]:focus {
        outline: none !important;
        box-shadow: none !important;
      }

      :root {
        --scrollbar-thumb: rgba(107, 66, 38, 0.4);
        --scrollbar-thumb-hover: rgba(107, 66, 38, 0.6);
        --scrollbar-thumb-active: rgba(107, 66, 38, 0.8);
        --scrollbar-track: transparent;
      }

      ::-webkit-scrollbar {
        width: 14px;
        height: 14px;
      }
      ::-webkit-scrollbar-track {
        background: var(--scrollbar-track);
      }
      ::-webkit-scrollbar-thumb {
        background: var(--scrollbar-thumb);
        border-radius: 10px;
        border: 3px solid transparent;
        background-clip: padding-box;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: var(--scrollbar-thumb-hover);
        border: 3px solid transparent;
        background-clip: padding-box;
      }
      ::-webkit-scrollbar-thumb:active {
        background: var(--scrollbar-thumb-active);
        border: 3px solid transparent;
        background-clip: padding-box;
      }
      ::-webkit-scrollbar-corner {
        background: transparent;
      }

      * {
        scrollbar-width: auto;
        scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Show loading screen while fonts, theme, and onboarding state initialize
  if (!fontsLoaded || !themeLoaded || !onboardingLoaded) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  const webContainerStyle = isWeb ? {
    height: '100%' as any,
    maxHeight: '100%' as any,
    overflow: 'hidden' as const,
    display: 'flex' as const,
    flexDirection: 'column' as const,
  } : { flex: 1 };

  return (
    <TamaguiProvider config={config} defaultTheme={effectiveColorScheme}>
      <SafeAreaProvider style={webContainerStyle}>
        <GestureHandlerRootView style={{ flex: 1, minHeight: 0, overflow: 'hidden' as any }}>
          <View style={isWeb ? { flex: 1, minHeight: 0 } : { flex: 1 }}>
            <AppNavigator />
            <StatusBar
              style={effectiveColorScheme === 'dark' ? 'light' : 'dark'}
              backgroundColor={colors.background}
            />
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </TamaguiProvider>
  );
}
