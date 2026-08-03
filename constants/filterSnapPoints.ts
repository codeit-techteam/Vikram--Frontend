import type { QuickFilterKey } from '@/types/filter.types';

/** Single snap points so content fits without nested scrolling where possible. */
export const FILTER_SNAP_POINTS: Record<QuickFilterKey | 'all', string[]> = {
  grade: ['55%'],
  brand: ['90%'],
  priceRange: ['90%'],
  all: ['90%'],
};

export const DEFAULT_QUICK_SNAP_POINTS = ['90%'];

export function getQuickFilterSnapPoints(key: QuickFilterKey): string[] {
  return FILTER_SNAP_POINTS[key] ?? DEFAULT_QUICK_SNAP_POINTS;
}
