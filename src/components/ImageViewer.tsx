import React, { useEffect } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SPRING = { damping: 20, stiffness: 200 };

/** Upscale Wikipedia thumbnail URLs for the viewer. */
function getHighResUrl(url: string): string {
  let src = url;
  if (src.startsWith('//')) src = 'https:' + src;
  return src.replace(/\/(\d+)px-([^/]+)$/, '/1200px-$2');
}

interface ImageViewerProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ visible, imageUrl, onClose }) => {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTX = useSharedValue(0);
  const savedTY = useSharedValue(0);

  const highResUrl = visible ? getHighResUrl(imageUrl) : '';

  // Reset transforms on open
  useEffect(() => {
    if (visible) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTX.value = 0;
      savedTY.value = 0;
    }
  }, [visible]);

  // Android back button
  useEffect(() => {
    if (!visible || Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  // Web: wheel zoom + Escape key
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.003;
      const next = Math.max(1, Math.min(6, savedScale.value + delta));
      scale.value = next;
      savedScale.value = next;
      if (next <= 1) {
        translateX.value = withSpring(0, SPRING);
        translateY.value = withSpring(0, SPRING);
        savedTX.value = 0;
        savedTY.value = 0;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, [visible, onClose]);

  // ─── Gestures ─────────────────────────────────────────

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1, SPRING);
        savedScale.value = 1;
        translateX.value = withSpring(0, SPRING);
        translateY.value = withSpring(0, SPRING);
        savedTX.value = 0;
        savedTY.value = 0;
      } else if (scale.value > 6) {
        scale.value = withSpring(6, SPRING);
        savedScale.value = 6;
      } else {
        savedScale.value = scale.value;
      }
    });

  const pan = Gesture.Pan()
    .minDistance(8)
    .onUpdate((e) => {
      translateX.value = savedTX.value + e.translationX;
      translateY.value = savedTY.value + e.translationY;
    })
    .onEnd((e) => {
      // Swipe-to-dismiss at 1x
      if (savedScale.value <= 1.05 && Math.abs(e.translationY) > 80) {
        runOnJS(onClose)();
        return;
      }
      if (savedScale.value <= 1.05) {
        translateX.value = withSpring(0, SPRING);
        translateY.value = withSpring(0, SPRING);
        savedTX.value = 0;
        savedTY.value = 0;
      } else {
        savedTX.value = translateX.value;
        savedTY.value = translateY.value;
      }
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      if (savedScale.value <= 1.05) {
        runOnJS(onClose)();
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > 1.1) {
        scale.value = withSpring(1, SPRING);
        savedScale.value = 1;
        translateX.value = withSpring(0, SPRING);
        translateY.value = withSpring(0, SPRING);
        savedTX.value = 0;
        savedTY.value = 0;
      } else {
        scale.value = withSpring(3, SPRING);
        savedScale.value = 3;
      }
    });

  const taps = Gesture.Exclusive(doubleTap, singleTap);

  const composed = Gesture.Simultaneous(
    taps,
    Gesture.Simultaneous(pinch, pan),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!visible) return null;

  return (
    <View
      style={[
        styles.overlay,
        Platform.OS === 'web' && ({ position: 'fixed' } as any),
      ]}
    >
      {/* Backdrop */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 250 }}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
      />

      {/* Close button */}
      <View style={[styles.closeRow, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Feather name="x" size={22} color="#FFF" />
        </Pressable>
      </View>

      {/* Zoomable image */}
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            {
              width: screenW,
              height: screenH,
              justifyContent: 'center',
              alignItems: 'center',
            },
            animatedStyle,
          ]}
        >
          <Image
            source={{ uri: highResUrl }}
            style={{ width: screenW, height: screenH - insets.top - insets.bottom }}
            contentFit="contain"
            transition={200}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  closeRow: {
    position: 'absolute',
    top: 0,
    right: 16,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
