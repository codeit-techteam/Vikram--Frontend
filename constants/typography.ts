/**
 * Typography tokens for Bajriwala Customer App.
 * Use Poppins when loaded; system sans is the safe fallback.
 */
export const typography = {
  fontFamily: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    hero: 24,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  headerBrand: {
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: -0.4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
} as const;
