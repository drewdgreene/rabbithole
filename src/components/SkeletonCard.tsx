import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useThemeColors, spacing, borderRadius } from '../theme';
import { isWeb } from '../utils/platform';

export const SkeletonCard: React.FC = () => {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const boneColor = colors.backgroundSecondary;

  return (
    <View style={[styles.card, isWeb && styles.cardWeb, isWeb && { breakInside: 'avoid' } as any, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Hero image placeholder */}
      <Animated.View
        style={[styles.heroImage, { backgroundColor: boneColor, opacity }]}
      />

      {/* Content placeholder */}
      <View style={styles.content}>
        <Animated.View
          style={[styles.titleBone, { backgroundColor: boneColor, opacity }]}
        />
        <Animated.View
          style={[styles.titleBoneShort, { backgroundColor: boneColor, opacity }]}
        />
        <Animated.View
          style={[styles.excerptBone, { backgroundColor: boneColor, opacity }]}
        />
        <Animated.View
          style={[styles.excerptBone, { backgroundColor: boneColor, opacity }]}
        />
        <Animated.View
          style={[styles.dotBone, { backgroundColor: boneColor, opacity }]}
        />
      </View>
    </View>
  );
};

export const SkeletonFeed: React.FC<{ count?: number }> = ({ count = 3 }) => {
  if (isWeb) {
    const half = Math.ceil(count / 2);
    return (
      <View style={styles.feedContainerWeb}>
        <View style={styles.skeletonColumn}>
          {Array.from({ length: half }, (_, i) => (
            <SkeletonCard key={`l${i}`} />
          ))}
        </View>
        <View style={styles.skeletonColumn}>
          {Array.from({ length: count - half }, (_, i) => (
            <SkeletonCard key={`r${i}`} />
          ))}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.feedContainer}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  feedContainer: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  feedContainerWeb: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  skeletonColumn: {
    flex: 1,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'column',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
  },
  cardWeb: {
    marginHorizontal: 0,
    marginBottom: spacing.md,
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: spacing.md,
    gap: 10,
  },
  titleBone: {
    height: 16,
    borderRadius: 4,
    width: '80%',
  },
  titleBoneShort: {
    height: 16,
    borderRadius: 4,
    width: '50%',
  },
  excerptBone: {
    height: 12,
    borderRadius: 3,
    width: '95%',
  },
  dotBone: {
    height: 6,
    borderRadius: 3,
    width: 60,
    marginTop: 4,
  },
});
