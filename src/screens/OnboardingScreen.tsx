import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, spacing, borderRadius } from '../theme';
import { typography, FONTS } from '../theme/typography';
import { useOnboardingStore } from '../store/onboardingStore';
import { useInterestStore } from '../store/interestStore';
import { getShuffledHooks, getHookById } from '../services/curiosityHooks';
import { HoneycombGrid } from '../components/HoneycombGrid';

const MIN_HOOKS = 5;

export const OnboardingScreen: React.FC<{ onComplete: () => void }> = ({
  onComplete,
}) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const {
    selectedHookIds,
    toggleHook,
    completeOnboarding,
  } = useOnboardingStore();

  const { initializeFromHooks } = useInterestStore();

  // Stable shuffled order per session
  const [shuffledHooks] = useState(() => getShuffledHooks());

  // Measure full screen area for the grid
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const handleScreenLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setScreenSize({ width, height });
  }, []);

  const count = selectedHookIds.length;
  const canFinish = count >= MIN_HOOKS;

  const handleFinish = useCallback(async () => {
    if (!canFinish) return;
    const hooks = selectedHookIds
      .map(id => getHookById(id))
      .filter(Boolean) as NonNullable<ReturnType<typeof getHookById>>[];
    await initializeFromHooks(hooks);
    await completeOnboarding();
    onComplete();
  }, [canFinish, selectedHookIds, initializeFromHooks, completeOnboarding, onComplete]);

  const footerText = useMemo(() => {
    if (count === 0) return `Tap at least ${MIN_HOOKS} that grab you`;
    if (count < MIN_HOOKS) return `${count} selected (need ${MIN_HOOKS - count} more)`;
    return `${count} selected`;
  }, [count]);

  // Gradient colors: solid at edge → transparent toward grid
  const bgSolid = colors.background;
  const bgTransparent = colors.background + '00';

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      onLayout={handleScreenLayout}
    >
      {/* Honeycomb grid — fills entire screen, renders behind everything */}
      {screenSize.width > 0 && screenSize.height > 0 && (
        <View style={StyleSheet.absoluteFill}>
          <HoneycombGrid
            hooks={shuffledHooks}
            selectedIds={selectedHookIds}
            onToggle={toggleHook}
            width={screenSize.width}
            height={screenSize.height}
          />
        </View>
      )}

      {/* Header overlay with gradient fade */}
      <View style={styles.headerOverlay} pointerEvents="none">
        <LinearGradient
          colors={[bgSolid, bgSolid, bgTransparent]}
          locations={[0, 0.5, 1]}
          style={[styles.headerGradient, { paddingTop: insets.top }]}
        >
          <SafeAreaView edges={[]} style={styles.headerContent}>
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
            >
              <Text style={[styles.logo, { color: colors.primary }]}>
                rabbithole
              </Text>
            </MotiView>
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 500, delay: 150 }}
            >
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                What makes you curious?
              </Text>
            </MotiView>
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 500, delay: 300 }}
            >
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Tap at least {MIN_HOOKS} that grab you
              </Text>
            </MotiView>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* Footer overlay with gradient fade */}
      <View style={styles.footerOverlay} pointerEvents="box-none">
        <LinearGradient
          colors={[bgTransparent, bgSolid, bgSolid]}
          locations={[0, 0.45, 1]}
          style={[styles.footerGradient, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          pointerEvents="box-none"
        >
          <View style={styles.footerContent} pointerEvents="auto">
            <Text style={[styles.footerCount, { color: colors.textSecondary }]}>
              {footerText}
            </Text>
            <Pressable
              onPress={handleFinish}
              disabled={!canFinish}
              style={[
                styles.finishButton,
                {
                  backgroundColor: canFinish ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.finishButtonText,
                  {
                    color: canFinish ? '#FFFDF9' : colors.textTertiary,
                  },
                ]}
              >
                Build my feed
              </Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ─── Header ──────────────────────────────────────
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    paddingBottom: spacing.xl,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  logo: {
    fontSize: 36,
    fontFamily: FONTS.crimsonPro.extraBold,
    textAlign: 'center',
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 500,
    lineHeight: 22,
  },

  // ─── Footer ──────────────────────────────────────
  footerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  footerGradient: {
    paddingTop: spacing.xl,
  },
  footerContent: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  footerCount: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  finishButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    minWidth: 200,
  },
  finishButtonText: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 16,
  },
});
