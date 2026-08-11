import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Product } from '@/types/catalog';
import type { ActiveFilters } from '@/types/filter.types';
import {
  applyProductFilters,
  cloneFilters,
  countActiveFilters,
  createDefaultFilters,
  filtersEqual,
  getCategoryFilterConfig,
  normalizeFilters,
  reconcileFiltersWithBounds,
} from '@constants/filterOptions';
import { useCategoryFilterStore } from '@store/categoryFilterStore';

interface UseFilterStateOptions {
  /** Original, never-mutated product list from the API. */
  products: Product[];
  categoryId: string;
  /** True while the first product page is still loading. */
  isLoadingProducts?: boolean;
}

const SEARCH_DEBOUNCE_MS = 280;

export function useFilterState({
  products,
  categoryId,
  isLoadingProducts = false,
}: UseFilterStateOptions) {
  const getStored = useCategoryFilterStore((s) => s.getCategoryFilters);
  const setStored = useCategoryFilterStore((s) => s.setCategoryFilters);
  const clearStored = useCategoryFilterStore((s) => s.clearCategoryFilters);

  const productsReady = !isLoadingProducts && products.length >= 0;
  const hasCatalog = products.length > 0;

  const config = useMemo(
    () => getCategoryFilterConfig(categoryId, products),
    [categoryId, products],
  );

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(() => {
    const stored = getStored(categoryId);
    // Start with clean defaults — never restore a stale price range before catalog loads
    return normalizeFilters(
      stored ?? createDefaultFilters([0, 5000]),
      [0, 5000],
    );
  });
  const [draftFilters, setDraftFilters] = useState<ActiveFilters>(() =>
    cloneFilters(activeFilters),
  );
  const [searchInput, setSearchInput] = useState(activeFilters.search);

  const prevCategoryRef = useRef(categoryId);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore / reset when category changes — always start clean (no phantom filters)
  useEffect(() => {
    if (prevCategoryRef.current === categoryId) return;
    prevCategoryRef.current = categoryId;

    const stored = getStored(categoryId);
    const next = reconcileFiltersWithBounds(
      normalizeFilters(stored ?? createDefaultFilters(config.priceBounds), config.priceBounds),
      config.priceBounds,
      { productsReady: hasCatalog },
    );
    setActiveFilters(next);
    setDraftFilters(cloneFilters(next));
    setSearchInput(next.search);
  }, [categoryId, config.priceBounds, getStored, hasCatalog]);

  /**
   * Synchronous reconcile: when products arrive and bounds change, correct
   * stale price ranges in the SAME render as filtering — eliminates the
   * Loading → 0 Products → Products flicker.
   */
  const resolvedActiveFilters = useMemo(
    () =>
      reconcileFiltersWithBounds(activeFilters, config.priceBounds, {
        productsReady: hasCatalog,
      }),
    [activeFilters, config.priceBounds, hasCatalog],
  );

  const resolvedDraftFilters = useMemo(
    () =>
      reconcileFiltersWithBounds(draftFilters, config.priceBounds, {
        productsReady: hasCatalog,
      }),
    [draftFilters, config.priceBounds, hasCatalog],
  );

  // Persist the reconciled shape back into state (avoids repeated reconcile work)
  useEffect(() => {
    if (!filtersEqual(activeFilters, resolvedActiveFilters)) {
      setActiveFilters(resolvedActiveFilters);
    }
  }, [activeFilters, resolvedActiveFilters]);

  useEffect(() => {
    if (!filtersEqual(draftFilters, resolvedDraftFilters)) {
      setDraftFilters(resolvedDraftFilters);
    }
  }, [draftFilters, resolvedDraftFilters]);

  // Persist filters so product detail → back keeps them
  useEffect(() => {
    if (!categoryId || isLoadingProducts) return;
    setStored(categoryId, resolvedActiveFilters);
  }, [resolvedActiveFilters, categoryId, setStored, isLoadingProducts]);

  const syncDraft = useCallback(() => {
    setDraftFilters(cloneFilters(resolvedActiveFilters));
  }, [resolvedActiveFilters]);

  /** Always derived from original `products` — never from a prior filtered list. */
  const filteredProducts = useMemo(() => {
    if (isLoadingProducts) return [];
    return applyProductFilters(
      products,
      resolvedActiveFilters,
      config,
      categoryId,
    );
  }, [
    products,
    resolvedActiveFilters,
    config,
    categoryId,
    isLoadingProducts,
  ]);

  const draftFilteredCount = useMemo(() => {
    if (isLoadingProducts) return 0;
    return applyProductFilters(
      products,
      { ...resolvedDraftFilters, search: resolvedActiveFilters.search },
      config,
      categoryId,
    ).length;
  }, [
    products,
    resolvedDraftFilters,
    resolvedActiveFilters.search,
    config,
    categoryId,
    isLoadingProducts,
  ]);

  const activeCount = useMemo(
    () =>
      hasCatalog
        ? countActiveFilters(resolvedActiveFilters, config.priceBounds)
        : 0,
    [resolvedActiveFilters, config.priceBounds, hasCatalog],
  );

  const setSearch = useCallback((search: string) => {
    setSearchInput(search);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    // Clear instantly; debounce typed queries
    if (!search.trim()) {
      setActiveFilters((prev) => ({ ...prev, search: '' }));
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      setActiveFilters((prev) => ({ ...prev, search }));
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  useEffect(
    () => () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    },
    [],
  );

  const clearFilter = useCallback(
    (key: keyof ActiveFilters) => {
      const applyClear = (prev: ActiveFilters): ActiveFilters => {
        const next = cloneFilters(prev);
        switch (key) {
          case 'grade':
            next.grade = [];
            break;
          case 'productType':
            next.productType = [];
            break;
          case 'brand':
            next.brand = [];
            break;
          case 'priceRange':
            next.priceRange = [...config.priceBounds] as [number, number];
            next.pricePresets = [];
            break;
          case 'pricePresets':
            next.pricePresets = [];
            next.priceRange = [...config.priceBounds] as [number, number];
            break;
          case 'discount':
            next.discount = null;
            break;
          case 'bulkPricing':
            next.bulkPricing = null;
            break;
          case 'sort':
            next.sort = 'recommended';
            break;
          case 'search':
            next.search = '';
            break;
        }
        return next;
      };
      setActiveFilters(applyClear);
      setDraftFilters(applyClear);
      if (key === 'search') setSearchInput('');
    },
    [config.priceBounds],
  );

  /** Clear everything — active + draft + persistence — and restore full grid. */
  const clearAll = useCallback(() => {
    const defaults = createDefaultFilters(config.priceBounds);
    setActiveFilters(defaults);
    setDraftFilters(cloneFilters(defaults));
    setSearchInput('');
    if (categoryId) clearStored(categoryId);
  }, [categoryId, clearStored, config.priceBounds]);

  const applyDraft = useCallback(() => {
    setActiveFilters((prev) => ({
      ...cloneFilters(resolvedDraftFilters),
      search: prev.search,
    }));
  }, [resolvedDraftFilters]);

  /** Reset draft only (sheet Reset before Apply). Does not touch active list. */
  const resetDraft = useCallback(() => {
    const defaults = createDefaultFilters(config.priceBounds);
    setDraftFilters({ ...defaults, search: resolvedActiveFilters.search });
  }, [resolvedActiveFilters.search, config.priceBounds]);

  /**
   * Clear Filters in the full sheet: reset draft AND apply immediately
   * so the grid restores without requiring a second Apply press.
   */
  const clearDraftAndApply = useCallback(() => {
    const defaults = createDefaultFilters(config.priceBounds);
    const next = { ...defaults, search: '' };
    setDraftFilters(next);
    setActiveFilters(next);
    setSearchInput('');
    if (categoryId) clearStored(categoryId);
  }, [categoryId, clearStored, config.priceBounds]);

  const setDraft = useCallback((filters: ActiveFilters) => {
    setDraftFilters(cloneFilters(filters));
  }, []);

  const updateFilters = useCallback((filters: ActiveFilters) => {
    const next = cloneFilters(filters);
    setActiveFilters(next);
    setDraftFilters(next);
    setSearchInput(next.search);
  }, []);

  return {
    originalProducts: products,
    config,
    /** Reconciled filters used for UI + filtering (never stale price). */
    activeFilters: {
      ...resolvedActiveFilters,
      // Keep input responsive while debounce catches up
      search: searchInput,
    },
    draftFilters: resolvedDraftFilters,
    filteredProducts,
    draftFilteredCount,
    activeCount,
    /** Filters are safe to show as "active" only after catalog is known. */
    filtersReady: productsReady && hasCatalog,
    setSearch,
    clearFilter,
    clearAll,
    applyDraft,
    resetDraft,
    clearDraftAndApply,
    syncDraft,
    setDraft,
    updateFilters,
  };
}

export type UseFilterStateReturn = ReturnType<typeof useFilterState>;
