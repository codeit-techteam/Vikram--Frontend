/**
 * Spacing scale (dp). Prefer these over hardcoded numbers in UI.
 */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const layout = {
  headerHeight: 72,
  headerIconHit: 48,
  searchHeight: 52,
  tabBarContent: 52,
  screenPad: 16,
} as const;

export type SpacingKey = keyof typeof spacing;
