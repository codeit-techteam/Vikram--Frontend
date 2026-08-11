import type { QuickFilterKey } from '@/types/filter.types';
import { FILTER_LAYOUT } from '@constants/filterTokens';

/** Unified filter sheet snap — Brand / Type / Grade / Price share one sheet. */
export const FILTER_SNAP_POINTS: Record<QuickFilterKey | 'all', string[]> = {
  grade: [FILTER_LAYOUT.snapPercent],
  productType: [FILTER_LAYOUT.snapPercent],
  brand: [FILTER_LAYOUT.snapPercent],
  priceRange: [FILTER_LAYOUT.snapPercent],
  all: [FILTER_LAYOUT.snapPercent],
};

export const DEFAULT_QUICK_SNAP_POINTS = [FILTER_LAYOUT.snapPercent];

export function getQuickFilterSnapPoints(_key?: QuickFilterKey): string[] {
  return DEFAULT_QUICK_SNAP_POINTS;
}
