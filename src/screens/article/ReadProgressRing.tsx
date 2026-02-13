import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { isWeb } from '../../utils/platform';

export function ReadProgressRing({
  progress,
  size,
  colors,
}: {
  progress: number;
  size: number;
  colors: any;
}) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  if (clampedProgress >= 100) {
    return <Feather name="check-circle" size={size} color={colors.success || '#2E7D6F'} />;
  }

  const strokeWidth = 2;
  const trackColor = colors.border;
  const fillColor = colors.primary;

  if (isWeb) {
    const deg = Math.round(clampedProgress * 3.6);
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          // @ts-ignore web-only CSS
          background: `conic-gradient(${fillColor} ${deg}deg, ${trackColor} ${deg}deg)`,
        } as any}
      >
        <View
          style={{
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
            borderRadius: (size - strokeWidth * 2) / 2,
            backgroundColor: colors.background,
          }}
        />
      </View>
    );
  }

  // Native: two-half-circle rotation technique
  const half = size / 2;
  const rightDeg = clampedProgress <= 50 ? (clampedProgress / 50) * 180 : 180;
  const leftDeg = clampedProgress > 50 ? ((clampedProgress - 50) / 50) * 180 : 0;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Track circle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: strokeWidth,
          borderColor: trackColor,
        }}
      />
      {/* Right half fill */}
      <View style={{ position: 'absolute', width: half, height: size, left: half, overflow: 'hidden' }}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: strokeWidth,
            borderColor: fillColor,
            borderLeftColor: 'transparent',
            borderBottomColor: 'transparent',
            left: -half,
            transform: [{ rotate: `${rightDeg}deg` }],
          }}
        />
      </View>
      {/* Left half fill */}
      {clampedProgress > 50 && (
        <View style={{ position: 'absolute', width: half, height: size, left: 0, overflow: 'hidden' }}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: strokeWidth,
              borderColor: fillColor,
              borderRightColor: 'transparent',
              borderTopColor: 'transparent',
              transform: [{ rotate: `${leftDeg}deg` }],
            }}
          />
        </View>
      )}
      {/* Inner mask */}
      <View
        style={{
          position: 'absolute',
          top: strokeWidth,
          left: strokeWidth,
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          borderRadius: (size - strokeWidth * 2) / 2,
          backgroundColor: colors.background,
        }}
      />
    </View>
  );
}
