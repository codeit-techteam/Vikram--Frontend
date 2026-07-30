export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const theme = {
  // ── BRAND COLORS ──
  primary: '#FEB623',
  primaryDark: '#E5A01F',
  primaryLight: '#FFF4D1',
  primaryUltraLight: '#FFFBEE',

  // ── SEMANTIC COLORS ──
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#1A73E8',

  // ── NEUTRALS ──
  black: '#1A1A1A',
  darkGray: '#333333',
  gray: '#666666',
  mediumGray: '#999999',
  lightGray: '#E0E0E0',
  ultraLightGray: '#F5F5F5',
  white: '#FFFFFF',

  // ── BACKGROUND ──
  bgMain: '#F5F5F5',
  bgCard: '#FFFFFF',
  bgPrimary: '#FFF4D1',

  // ── TEXT ──
  textPrimary: '#1C1C1C',
  textSecondary: '#757575',
  textMuted: '#999999',
  textOnPrimary: '#1A1A1A',
  textLink: '#FEB623',

  // ── BORDER ──
  border: '#ECECEC',
  borderFocus: '#FEB623',

  // ── BRAND NAME ──
  appName: 'Bajriwala',
  appTagline: 'Construction Materials Delivered Fast',
  trustBadge: 'Trusted by 500+ Contractors across Delhi',
} as const;

export const Logo = require('../assets/images/logo.png');
export const LogoSmall = require('../assets/images/logo.png');

export type Theme = typeof theme;

/** Design-system re-exports for a single import surface. */
export { AppIcons, ICON_SIZE, TOUCH_TARGET } from './icons';
export { spacing as space, layout } from './spacing';
export { typography } from './typography';
