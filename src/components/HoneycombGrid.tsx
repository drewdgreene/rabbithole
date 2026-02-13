import React, { useMemo, useEffect, useRef } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
} from 'react-native-reanimated';
import { generateHexPositions, getHexBounds } from '../utils/hexGrid';
import { HoneycombCell } from './HoneycombCell';
import { isWeb } from '../utils/platform';
import type { CuriosityHook } from '../types';

const GAP = 22;

interface HoneycombGridProps {
  hooks: CuriosityHook[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  width: number;
  height: number;
}

export const HoneycombGrid: React.FC<HoneycombGridProps> = ({
  hooks, selectedIds, onToggle, width, height,
}) => {
  const cellDiameter = width < 360 ? 105 : (isWeb ? 160 : 135);

  const positions = useMemo(
    () => generateHexPositions(hooks.length, cellDiameter, GAP),
    [hooks.length, cellDiameter],
  );

  const bounds = useMemo(
    () => getHexBounds(positions, cellDiameter),
    [positions, cellDiameter],
  );

  // Pan state
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const savedPanX = useSharedValue(0);
  const savedPanY = useSharedValue(0);

  // Compute pan limits
  const padding = cellDiameter * 1.5;
  const halfGridW = (bounds.maxX - bounds.minX) / 2 + cellDiameter / 2;
  const halfGridH = (bounds.maxY - bounds.minY) / 2 + cellDiameter / 2;
  const maxPanX = Math.max(0, halfGridW - width / 2 + padding);
  const maxPanY = Math.max(0, halfGridH - height / 2 + padding);

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onUpdate((e) => {
      'worklet';
      panX.value = savedPanX.value + e.translationX;
      panY.value = savedPanY.value + e.translationY;
    })
    .onEnd((e) => {
      'worklet';
      savedPanX.value = panX.value;
      savedPanY.value = panY.value;
      panX.value = withDecay(
        {
          velocity: e.velocityX,
          clamp: [-maxPanX, maxPanX],
          deceleration: 0.997,
        },
        (finished) => {
          'worklet';
          if (finished) savedPanX.value = panX.value;
        },
      );
      panY.value = withDecay(
        {
          velocity: e.velocityY,
          clamp: [-maxPanY, maxPanY],
          deceleration: 0.997,
        },
        (finished) => {
          'worklet';
          if (finished) savedPanY.value = panY.value;
        },
      );
    });

  const gridStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: panX.value },
      { translateY: panY.value },
    ],
  }));

  // Web: mouse wheel / trackpad scrolling
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const el = (containerRef.current as any)?._nativeTag
      ?? (containerRef.current as any);
    if (!el) return;

    // Find the actual DOM node
    const domNode = el instanceof HTMLElement ? el
      : document.querySelector('[data-honeycomb-grid]');
    if (!domNode) return;

    const onWheel = (e: Event) => {
      const we = e as unknown as { preventDefault: () => void; deltaX: number; deltaY: number };
      we.preventDefault();
      const nextX = Math.max(-maxPanX, Math.min(maxPanX, panX.value - we.deltaX));
      const nextY = Math.max(-maxPanY, Math.min(maxPanY, panY.value - we.deltaY));
      panX.value = nextX;
      panY.value = nextY;
      savedPanX.value = nextX;
      savedPanY.value = nextY;
    };

    domNode.addEventListener('wheel', onWheel, { passive: false } as any);
    return () => domNode.removeEventListener('wheel', onWheel);
  }, [maxPanX, maxPanY, panX, panY, savedPanX, savedPanY]);

  if (width === 0 || height === 0) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        ref={containerRef as any}
        // @ts-ignore — web-only data attribute for wheel handler
        dataSet={isWeb ? { honeycombGrid: true } : undefined}
        style={[
          styles.container,
          { width, height },
          isWeb && ({ cursor: 'grab' } as any),
        ]}
      >
        <Animated.View style={[{ width, height }, gridStyle]}>
          {hooks.map((hook, i) => (
            <HoneycombCell
              key={hook.id}
              hook={hook}
              posX={positions[i].x}
              posY={positions[i].y}
              panX={panX}
              panY={panY}
              viewportWidth={width}
              viewportHeight={height}
              cellDiameter={cellDiameter}
              selected={selectedIds.includes(hook.id)}
              onPress={onToggle}
              entryDelay={Math.min(i * 20, 800)}
            />
          ))}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
