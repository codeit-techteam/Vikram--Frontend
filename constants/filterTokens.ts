export const FILTER_COLORS = {
  primary: '#FEB623',
  primaryLight: '#FFF4D1',
  primaryBorder: '#FEB623',
  primaryDark: '#E5A41F',

  surface: '#FFFFFF',
  surfaceMuted: '#F7F7F7',
  surfacePressed: '#F0F0F0',
  sidebar: '#F5F5F5',

  text: '#1A1A1A',
  textMuted: '#888888',
  textDisabled: '#CCCCCC',

  border: '#E5E5E5',
  divider: '#F0F0F0',

  success: '#22C55E',
  successLight: '#F0FDF4',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  overlay: 'rgba(0,0,0,0.45)',
} as const;

export const FILTER_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const FILTER_RADIUS = {
  chip: 18,
  card: 12,
  sheet: 32,
  input: 12,
  checkbox: 8,
  pill: 20,
} as const;

/** Shared spring for sheet / chip micro-interactions */
export const FILTER_SPRING = {
  sheet: {
    damping: 24,
    stiffness: 260,
    mass: 0.75,
    overshootClamping: false,
    energyThreshold: 0.01,
  },
  press: {
    damping: 14,
    stiffness: 320,
  },
} as const;

export const FILTER_LAYOUT = {
  sidebarWidth: 96,
  touchMin: 48,
  footerHeight: 52,
  snapPercent: '85%',
} as const;
