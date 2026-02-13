export const FONTS = {
  googleSans: {
    regular: 'GoogleSansFlex_400Regular' as const,
    medium: 'GoogleSansFlex_500Medium' as const,
    semibold: 'GoogleSansFlex_600SemiBold' as const,
    bold: 'GoogleSansFlex_700Bold' as const,
  },
  crimsonPro: {
    bold: 'CrimsonPro_700Bold' as const,
    extraBold: 'CrimsonPro_800ExtraBold' as const,
  },
} as const;

export const typography = {
  logo: {
    fontSize: 28,
    fontFamily: FONTS.crimsonPro.extraBold,
    lineHeight: 36,
    letterSpacing: -0.3,
  },

  // Crimson Pro for article titles (cards + hero)
  articleTitle: {
    fontFamily: FONTS.crimsonPro.bold,
  },

  h1: {
    fontSize: 32,
    fontFamily: FONTS.googleSans.bold,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 16,
    fontFamily: FONTS.googleSans.medium,
    lineHeight: 22,
    letterSpacing: -0.1,
  },

  body: {
    fontSize: 16,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontSize: 17,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 28,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodyBold: {
    fontSize: 16,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 24,
    letterSpacing: 0,
  },

  caption: {
    fontSize: 13,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 18,
    letterSpacing: 0,
  },
  captionBold: {
    fontSize: 13,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 18,
    letterSpacing: 0.1,
  },

  timestamp: {
    fontSize: 11,
    fontFamily: FONTS.googleSans.medium,
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  input: {
    fontSize: 16,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 24,
    letterSpacing: 0,
  },

  button: {
    fontSize: 15,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 20,
    letterSpacing: 0.3,
  },

  tag: {
    fontSize: 14,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  label: {
    fontSize: 14,
    fontFamily: FONTS.googleSans.medium,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
} as const;

export const desktopTypography = {
  logo: {
    fontSize: 32,
    fontFamily: FONTS.crimsonPro.extraBold,
    lineHeight: 40,
    letterSpacing: -0.5,
  },

  h1: {
    fontSize: 36,
    fontFamily: FONTS.googleSans.bold,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 18,
    fontFamily: FONTS.googleSans.medium,
    lineHeight: 24,
    letterSpacing: -0.1,
  },

  body: {
    fontSize: 17,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 26,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontSize: 18,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 30,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 15,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyBold: {
    fontSize: 17,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 26,
    letterSpacing: 0,
  },

  caption: {
    fontSize: 14,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 20,
    letterSpacing: 0,
  },
  captionBold: {
    fontSize: 14,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  timestamp: {
    fontSize: 12,
    fontFamily: FONTS.googleSans.medium,
    lineHeight: 18,
    letterSpacing: 0.2,
  },

  input: {
    fontSize: 17,
    fontFamily: FONTS.googleSans.regular,
    lineHeight: 26,
    letterSpacing: 0,
  },

  button: {
    fontSize: 16,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 22,
    letterSpacing: 0.3,
  },

  tag: {
    fontSize: 15,
    fontFamily: FONTS.googleSans.semibold,
    lineHeight: 22,
    letterSpacing: 0.1,
  },

  label: {
    fontSize: 15,
    fontFamily: FONTS.googleSans.medium,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
} as const;
