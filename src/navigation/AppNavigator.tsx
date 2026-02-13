import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeColors } from '../theme';
import { useOnboardingStore } from '../store/onboardingStore';
import { useInterestStore } from '../store/interestStore';
import { useSessionStore } from '../store/sessionStore';
import { WebLayoutWrapper } from '../components/WebLayoutWrapper';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ResponsiveNavigator } from './ResponsiveNavigator';
import { isWeb } from '../utils/platform';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const colors = useThemeColors();
  const { status: onboardingStatus, isLoaded: onboardingLoaded } = useOnboardingStore();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Persist session summary when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        // App moving to background — save session summary
        const summary = useSessionStore.getState().buildSummary();
        if (summary.articlesRead > 0) {
          useInterestStore.getState().persistSessionSummary(summary);
        }
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  // Also persist on web page unload
  useEffect(() => {
    if (!isWeb) return;
    const handleBeforeUnload = () => {
      const summary = useSessionStore.getState().buildSummary();
      if (summary.articlesRead > 0) {
        useInterestStore.getState().persistSessionSummary(summary);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Determine onboarding state once on initial load — do NOT react to later status changes
  // (TopicsScreen toggles can change status, but should never re-trigger onboarding)
  useEffect(() => {
    if (onboardingLoaded && showOnboarding === null) {
      setShowOnboarding(onboardingStatus !== 'completed');
    }
  }, [onboardingLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  const handleResetOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  // Still loading onboarding state
  if (showOnboarding === null) return null;

  const navigationContent = (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showOnboarding ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main" component={ResponsiveNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );

  return isWeb ? (
    <WebLayoutWrapper backgroundColor={colors.background}>
      {navigationContent}
    </WebLayoutWrapper>
  ) : (
    navigationContent
  );
};
