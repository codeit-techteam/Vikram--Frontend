import type { QuickFilterKey } from '@/types/filter.types';

export const FILTER_SNAP_POINTS: Record<QuickFilterKey | 'all', string[]> = {
  eta: ['52%', '70%'],
  grade: ['55%', '80%'],
  brand: ['70%', '92%'],
  priceRange: ['58%', '78%'],
  availability: ['52%', '70%'],
  all: ['88%', '96%'],
};

export const DEFAULT_QUICK_SNAP_POINTS = ['55%', '80%'];

export function getQuickFilterSnapPoints(key: QuickFilterKey): string[] {
  return FILTER_SNAP_POINTS[key] ?? DEFAULT_QUICK_SNAP_POINTS;
}
