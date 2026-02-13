export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export type Breakpoint = keyof typeof breakpoints;

export const deviceTypes = {
  mobile: {
    maxWidth: breakpoints.tablet - 1,
  },
  tablet: {
    minWidth: breakpoints.tablet,
    maxWidth: breakpoints.desktop - 1,
  },
  desktop: {
    minWidth: breakpoints.desktop,
  },
  wide: {
    minWidth: breakpoints.wide,
  },
} as const;

export const matchesBreakpoint = (
  width: number,
  breakpoint: Breakpoint
): boolean => {
  switch (breakpoint) {
    case 'mobile':
      return width < breakpoints.tablet;
    case 'tablet':
      return width >= breakpoints.tablet && width < breakpoints.desktop;
    case 'desktop':
      return width >= breakpoints.desktop && width < breakpoints.wide;
    case 'wide':
      return width >= breakpoints.wide;
    default:
      return false;
  }
};

export const getBreakpoint = (width: number): Breakpoint => {
  if (width >= breakpoints.wide) return 'wide';
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
};
