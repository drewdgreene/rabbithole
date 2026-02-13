import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Feather } from '@expo/vector-icons';
import { useThemeColors, spacing, borderRadius } from '../theme';
import { FONTS } from '../theme/typography';

interface CategoryChipProps {
  id: string;
  name: string;
  iconName?: string;
  selected: boolean;
  onPress: (id: string) => void;
  size?: 'large' | 'small';
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  id,
  name,
  iconName,
  selected,
  onPress,
  size = 'large',
}) => {
  const colors = useThemeColors();
  const isLarge = size === 'large';

  return (
    <MotiView
      from={{ scale: 0.92, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 400 }}
    >
      <Pressable
        onPress={() => onPress(id)}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? colors.primary : colors.surface,
            borderColor: selected ? colors.primary : colors.border,
            paddingHorizontal: isLarge ? spacing.md : spacing.sm + 4,
            paddingVertical: isLarge ? spacing.md : spacing.sm,
            minWidth: isLarge ? 140 : undefined,
          },
        ]}
      >
        {iconName && (
          <Feather
            name={iconName as any}
            size={isLarge ? 24 : 16}
            color={selected ? '#FFFDF9' : colors.icon}
          />
        )}
        <Text
          style={[
            styles.label,
            {
              color: selected ? '#FFFDF9' : colors.textPrimary,
              fontSize: isLarge ? 15 : 13,
              fontFamily: selected ? FONTS.googleSans.semibold : FONTS.googleSans.regular,
            },
          ]}
          numberOfLines={isLarge ? 2 : 1}
        >
          {name}
        </Text>
        {selected && (
          <View
            style={[
              styles.checkBadge,
              { backgroundColor: 'rgba(255,255,255,0.3)' },
            ]}
          >
            <Feather name="check" size={12} color="#fff" />
          </View>
        )}
      </Pressable>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    gap: 6,
    position: 'relative',
  },
  label: {
    fontFamily: FONTS.googleSans.regular,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
