import { create } from 'zustand';

import type { ActiveFilters } from '@/types/filter.types';
import { cloneFilters, createDefaultFilters, normalizeFilters } from '@constants/filterOptions';

interface CategoryFilterStoreState {
  byCategory: Record<string, ActiveFilters>;
  setCategoryFilters: (categoryId: string, filters: ActiveFilters) => void;
  getCategoryFilters: (categoryId: string) => ActiveFilters | undefined;
  clearCategoryFilters: (categoryId: string) => void;
  clearAll: () => void;
}

export const useCategoryFilterStore = create<CategoryFilterStoreState>((set, get) => ({
  byCategory: {},

  setCategoryFilters: (categoryId, filters) => {
    if (!categoryId) return;
    set((state) => ({
      byCategory: {
        ...state.byCategory,
        [categoryId]: cloneFilters(filters),
      },
    }));
  },

  getCategoryFilters: (categoryId) => {
    if (!categoryId) return undefined;
    const stored = get().byCategory[categoryId];
    if (!stored) return undefined;
    const bounds = (stored.priceRange ?? [0, 5000]) as [number, number];
    const normalized = normalizeFilters(stored, bounds);
    // Drop empty shells / phantom full-range price so callers never treat them
    // as user-applied filters.
    const hasFacet =
      normalized.grade.length > 0 ||
      normalized.productType.length > 0 ||
      normalized.brand.length > 0 ||
      normalized.pricePresets.length > 0 ||
      normalized.discount != null ||
      normalized.bulkPricing != null ||
      normalized.sort !== 'recommended' ||
      Boolean(normalized.search.trim());
    if (!hasFacet) return undefined;
    return normalized;
  },

  clearCategoryFilters: (categoryId) => {
    if (!categoryId) return;
    set((state) => {
      const next = { ...state.byCategory };
      delete next[categoryId];
      return { byCategory: next };
    });
  },

  clearAll: () => set({ byCategory: {} }),
}));

/** Helper for tests / resets */
export function emptyCategoryFilters(): ActiveFilters {
  return createDefaultFilters([0, 5000]);
}
