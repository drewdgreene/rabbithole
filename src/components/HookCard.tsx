import React, { useCallback, useEffect } from 'react';
import { Text, Pressable, StyleSheet, View, Platform, LayoutChangeEvent } from 'react-native';
import { MotiView } from 'moti';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolation,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useThemeColors, spacing } from '../theme';
import { FONTS } from '../theme/typography';
import { tapFeedback } from '../utils/haptics';
import type { CuriosityHook } from '../types';

interface HookCardProps {
  hook: CuriosityHook;
  selected: boolean;
  onPress: (id: string) => void;
  index: number;
  scrollY: SharedValue<number>;
  viewportHeight: number;
  gridOffset: SharedValue<number>;
}

export const HookCard: React.FC<HookCardProps> = React.memo(({
  hook, selected, onPress, index, scrollY, viewportHeight, gridOffset,
}) => {
  const colors = useThemeColors();

  // Layout measurement for magnification
  const cardY = useSharedValue(0);
  const cardH = useSharedValue(0);

  // Selection pulse
  const pulseScale = useSharedValue(1);

  // Ambient float for selected items
  const floatY = useSharedValue(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    cardY.value = y;
    cardH.value = height;
  }, [cardY, cardH]);

  const handlePress = useCallback(() => {
    tapFeedback();
    // Pulse on selection
    pulseScale.value = withSequence(
      withSpring(1.12, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );
    onPress(hook.id);
  }, [hook.id, onPress, pulseScale]);

  // Ambient floating for selected items — staggered start for natural phase offset
  useEffect(() => {
    if (selected) {
      const delay = (index % 12) * 200;
      const timeout = setTimeout(() => {
        floatY.value = withRepeat(
          withTiming(1.5, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
          -1,
          true
        );
      }, delay);
      return () => clearTimeout(timeout);
    } else {
      floatY.value = withTiming(0, { duration: 300 });
    }
  }, [selected, index, floatY]);

  // Combined magnification + pulse + float
  const magnifyStyle = useAnimatedStyle(() => {
    let magScale = 1;
    let magOpacity = 1;

    if (cardH.value > 0) {
      const cardCenter = gridOffset.value + cardY.value + cardH.value / 2;
      const viewCenter = scrollY.value + viewportHeight / 2;
      const dist = Math.abs(cardCenter - viewCenter);
      const halfScreen = viewportHeight / 2;

      magScale = interpolate(
        dist,
        [0, halfScreen * 0.4, halfScreen],
        [1.05, 1.0, 0.92],
        Extrapolation.CLAMP
      );

      magOpacity = interpolate(
        dist,
        [0, halfScreen * 0.5, halfScreen * 1.2],
        [1, 0.92, 0.6],
        Extrapolation.CLAMP
      );
    }

    return {
      transform: [
        { scale: magScale * pulseScale.value },
        { translateY: floatY.value },
      ],
      opacity: magOpacity,
    };
  });

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 150,
        delay: Math.min(index * 30, 600),
      }}
      style={styles.wrapper}
    >
      <Animated.View style={magnifyStyle} onLayout={handleLayout}>
        <Pressable
          onPress={handlePress}
          style={[
            styles.pill,
            {
              backgroundColor: selected ? colors.primary + '18' : colors.surface,
              borderColor: selected ? colors.primary : colors.border,
            },
            selected && {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.35,
              shadowRadius: 14,
              elevation: 4,
            },
          ]}
        >
          <Text
            style={[styles.claim, { color: colors.textPrimary }]}
            numberOfLines={4}
          >
            {hook.claim}
          </Text>
          {selected && (
            <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
              <Feather name="check" size={10} color="#FFFDF9" />
            </View>
          )}
        </Pressable>
      </Animated.View>
    </MotiView>
  );
});

HookCard.displayName = 'HookCard';

const styles = StyleSheet.create({
  wrapper: {
    width: '48%',
  },
  pill: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 4,
    minHeight: 56,
    justifyContent: 'center',
    position: 'relative',
  },
  claim: {
    fontSize: 13.5,
    fontFamily: FONTS.crimsonPro.bold,
    lineHeight: 18,
    paddingRight: spacing.md + 2,
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm + 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
