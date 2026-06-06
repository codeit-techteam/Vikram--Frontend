import type { FilterKey } from '@/types/filter.types';

export const FILTER_SNAP_POINTS: Record<FilterKey | 'all', string[]> = {
  eta: ['52%', '70%'],
  grade: ['55%', '80%'],
  brand: ['65%', '90%'],
  priceRange: ['55%', '75%'],
  availability: ['45%', '65%'],
  all: ['80%', '95%'],
};

export const DEFAULT_QUICK_SNAP_POINTS = ['55%', '80%'];

export function getQuickFilterSnapPoints(key: FilterKey): string[] {
  return FILTER_SNAP_POINTS[key] ?? DEFAULT_QUICK_SNAP_POINTS;
}
