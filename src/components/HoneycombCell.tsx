import React, { useCallback, useEffect, useMemo } from 'react';
import { Text, Pressable, StyleSheet, View, Platform } from 'react-native';
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
import { useEffectiveColorScheme } from '../theme';
import { FONTS } from '../theme/typography';
import { tapFeedback } from '../utils/haptics';
import type { CuriosityHook } from '../types';

// ─── Category color palette ─────────────────────────────────────
// Each category gets an HSL-based hue. We store [hue, saturation, lightness]
// so we can derive light/dark/selected/unselected variants.
const CATEGORY_HSL: Record<string, [number, number, number]> = {
  science:        [210, 55, 55],  // blue
  history:        [35,  60, 52],  // amber
  space:          [255, 45, 50],  // indigo
  nature:         [140, 45, 45],  // green
  technology:     [185, 50, 45],  // teal
  psychology:     [275, 40, 55],  // violet
  'true-crime':   [0,   50, 48],  // crimson
  mythology:      [30,  55, 48],  // bronze
  exploration:    [20,  55, 52],  // terracotta
  arts:           [340, 45, 55],  // rose
  medicine:       [355, 50, 52],  // coral
  engineering:    [215, 35, 50],  // steel blue
  disasters:      [15,  55, 48],  // ember
  inventions:     [45,  60, 50],  // gold
  paranormal:     [280, 40, 42],  // deep purple
  music:          [320, 45, 52],  // magenta
  'pop-culture':  [330, 50, 55],  // hot pink
  mathematics:    [220, 30, 52],  // blue-gray
  philosophy:     [80,  30, 48],  // sage
  economics:      [155, 40, 42],  // forest
  sports:         [120, 50, 48],  // bright green
  military:       [75,  30, 42],  // olive
  food:           [25,  60, 55],  // warm orange
  religion:       [290, 35, 48],  // mauve
  languages:      [175, 45, 45],  // cyan-teal
  royalty:        [265, 50, 48],  // royal purple
  games:          [200, 55, 52],  // bright blue
  media:          [10,  55, 52],  // red-orange
  business:       [225, 40, 40],  // navy
  geography:      [30,  40, 42],  // earth brown
  environment:    [155, 50, 45],  // emerald
  archaeology:    [18,  45, 45],  // sienna
  transportation: [210, 30, 48],  // slate
};

const DEFAULT_HSL: [number, number, number] = [30, 30, 50];

/**
 * Derive bubble background & border colors from category HSL.
 * Light theme: pastel bg, muted border. Dark theme: deeper bg, lighter border.
 * Selected: more saturated and vivid.
 */
function getCategoryColors(
  categoryId: string,
  isDark: boolean,
  isSelected: boolean,
): { bg: string; border: string; shadow: string } {
  const [h, s, l] = CATEGORY_HSL[categoryId] ?? DEFAULT_HSL;

  if (isSelected) {
    // Rich, saturated version
    const bgL = isDark ? 22 : 88;
    const bgS = isDark ? s + 15 : s + 10;
    const borderL = isDark ? l + 10 : l - 5;
    return {
      bg: `hsla(${h}, ${bgS}%, ${bgL}%, ${isDark ? 0.55 : 0.45})`,
      border: `hsl(${h}, ${s + 10}%, ${borderL}%)`,
      shadow: `hsl(${h}, ${s}%, ${l}%)`,
    };
  }

  // Unselected: gentle tint
  const bgL = isDark ? 14 : 94;
  const bgS = isDark ? s * 0.5 : s * 0.6;
  const borderL = isDark ? 28 : 78;
  const borderS = isDark ? s * 0.35 : s * 0.4;
  return {
    bg: `hsla(${h}, ${bgS}%, ${bgL}%, ${isDark ? 0.4 : 0.5})`,
    border: `hsl(${h}, ${borderS}%, ${borderL}%)`,
    shadow: `hsl(${h}, ${s}%, ${l}%)`,
  };
}

interface HoneycombCellProps {
  hook: CuriosityHook;
  posX: number;
  posY: number;
  panX: SharedValue<number>;
  panY: SharedValue<number>;
  viewportWidth: number;
  viewportHeight: number;
  cellDiameter: number;
  selected: boolean;
  onPress: (id: string) => void;
  entryDelay: number;
}

export const HoneycombCell: React.FC<HoneycombCellProps> = React.memo(({
  hook, posX, posY, panX, panY,
  viewportWidth, viewportHeight, cellDiameter,
  selected, onPress, entryDelay,
}) => {
  const colors = useThemeColors();
  const isDark = useEffectiveColorScheme() === 'dark';

  // Category-derived colors
  const catColors = useMemo(
    () => getCategoryColors(hook.categoryId, isDark, selected),
    [hook.categoryId, isDark, selected],
  );

  // Selection pulse
  const pulseScale = useSharedValue(1);

  // Ambient float for selected items
  const floatY = useSharedValue(0);

  const handlePress = useCallback(() => {
    tapFeedback();
    pulseScale.value = withSequence(
      withSpring(1.15, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 200 }),
    );
    onPress(hook.id);
  }, [hook.id, onPress, pulseScale]);

  // Ambient floating for selected items
  useEffect(() => {
    if (selected) {
      floatY.value = withRepeat(
        withTiming(2, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      floatY.value = withTiming(0, { duration: 300 });
    }
  }, [selected, floatY]);

  // 2D radial fisheye magnification + radial push
  const magnifyStyle = useAnimatedStyle(() => {
    // Viewport center in grid space is at (-panX, -panY)
    const viewCenterX = -panX.value;
    const viewCenterY = -panY.value;

    const dx = posX - viewCenterX;
    const dy = posY - viewCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const magRadius = Math.min(viewportWidth, viewportHeight) * 0.5;

    const cellScale = interpolate(
      dist,
      [0, magRadius * 0.25, magRadius * 0.6, magRadius],
      [1.15, 1.05, 0.85, 0.65],
      Extrapolation.CLAMP,
    );

    const cellOpacity = interpolate(
      dist,
      [0, magRadius * 0.4, magRadius],
      [1, 0.92, 0.55],
      Extrapolation.CLAMP,
    );

    // Push neighbors outward from the center bubble to give it breathing room.
    // Peaks at the nearest ring, tapers smoothly to zero at the edge.
    const pushStrength = cellDiameter * 0.2;
    const nearRing = cellDiameter * 0.8;
    const farRing = magRadius * 0.7;
    const pushAmount = dist > 0.1
      ? interpolate(
          dist,
          [0, nearRing, farRing],
          [0, pushStrength, 0],
          Extrapolation.CLAMP,
        )
      : 0;

    // Radial unit vector away from center
    const nx = dist > 0.1 ? dx / dist : 0;
    const ny = dist > 0.1 ? dy / dist : 0;

    return {
      transform: [
        { translateX: nx * pushAmount },
        { translateY: ny * pushAmount + floatY.value },
        { scale: cellScale * pulseScale.value },
      ],
      opacity: cellOpacity,
    };
  });

  const innerSize = cellDiameter * 0.75;
  const checkSize = Math.max(16, cellDiameter * 0.2);

  // Dynamic font size based on claim length so text never truncates
  const claimStyle = useMemo(() => {
    const len = hook.claim.length;
    let fontSize: number;
    let lineHeight: number;

    if (len <= 35) {
      fontSize = 16;
      lineHeight = 19;
    } else if (len <= 50) {
      fontSize = 14;
      lineHeight = 17;
    } else if (len <= 70) {
      fontSize = 12;
      lineHeight = 15;
    } else {
      fontSize = 10.5;
      lineHeight = 13;
    }

    return { fontSize, lineHeight };
  }, [hook.claim.length]);

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 14,
        stiffness: 120,
        delay: entryDelay,
      }}
      style={{
        position: 'absolute',
        left: viewportWidth / 2 + posX - cellDiameter / 2,
        top: viewportHeight / 2 + posY - cellDiameter / 2,
      }}
    >
      <Animated.View style={magnifyStyle}>
        <Pressable
          onPress={handlePress}
          style={[
            styles.circle,
            {
              width: cellDiameter,
              height: cellDiameter,
              borderRadius: cellDiameter / 2,
              backgroundColor: catColors.bg,
              borderColor: catColors.border,
            },
            selected && {
              shadowColor: catColors.shadow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.45,
              shadowRadius: 16,
              elevation: 5,
            },
            // Web: smooth gradient-feel border via box-shadow
            Platform.OS === 'web' && !selected && ({
              boxShadow: `inset 0 0 0 1.5px ${catColors.border}`,
              borderWidth: 0,
            } as any),
          ]}
        >
          <View
            style={[
              styles.textContainer,
              { width: innerSize, height: innerSize },
            ]}
          >
            <Text
              style={[
                styles.claim,
                { color: colors.textPrimary, ...claimStyle },
              ]}
            >
              {hook.claim}
            </Text>
          </View>

          {selected && (
            <View
              style={[
                styles.checkBadge,
                {
                  backgroundColor: catColors.shadow,
                  width: checkSize,
                  height: checkSize,
                  borderRadius: checkSize / 2,
                },
              ]}
            >
              <Feather name="check" size={checkSize * 0.55} color="#FFFDF9" />
            </View>
          )}
        </Pressable>
      </Animated.View>
    </MotiView>
  );
});

HoneycombCell.displayName = 'HoneycombCell';

const styles = StyleSheet.create({
  circle: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  claim: {
    fontFamily: FONTS.crimsonPro.bold,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
