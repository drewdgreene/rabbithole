import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { breakpoints, getBreakpoint, type Breakpoint } from '../theme/breakpoints';
import { isWeb } from '../utils/platform';

export interface ResponsiveInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isPortrait: boolean;
  isLandscape: boolean;
}

export const useResponsive = (): ResponsiveInfo => {
  const [dimensions, setDimensions] = useState<ScaledSize>(() =>
    Dimensions.get('window')
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const { width, height } = dimensions;
  const currentBreakpoint = getBreakpoint(width);

  if (isWeb) {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isWide: width >= breakpoints.wide,
      width,
      height,
      breakpoint: 'desktop' as Breakpoint,
      isPortrait: height > width,
      isLandscape: width > height,
    };
  }

  return {
    isMobile: width < breakpoints.tablet,
    isTablet: width >= breakpoints.tablet && width < breakpoints.desktop,
    isDesktop: width >= breakpoints.desktop,
    isWide: width >= breakpoints.wide,
    width,
    height,
    breakpoint: currentBreakpoint,
    isPortrait: height > width,
    isLandscape: width > height,
  };
};
