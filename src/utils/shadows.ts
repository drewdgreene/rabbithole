import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
};

export const platformShadow = (shadow: ShadowStyle): ViewStyle => {
  if (Platform.OS === 'web') {
    const {
      shadowColor = '#000',
      shadowOffset = { width: 0, height: 0 },
      shadowOpacity = 0,
      shadowRadius = 0,
    } = shadow;

    const rgba = shadowColor.startsWith('#')
      ? hexToRgba(shadowColor, shadowOpacity)
      : `rgba(0, 0, 0, ${shadowOpacity})`;

    const boxShadow = `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px 0px ${rgba}`;

    return {
      boxShadow,
    } as any;
  }

  return shadow as ViewStyle;
};

function hexToRgba(hex: string, opacity: number): string {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
