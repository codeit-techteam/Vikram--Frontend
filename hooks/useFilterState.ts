import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Product } from '@/types/catalog';
import type { ActiveFilters, CategoryFilterConfig } from '@/types/filter.types';
import {
  applyProductFilters,
  cloneFilters,
  countActiveFilters,
  createDefaultFilters,
} from '@constants/filterOptions';
import { getCategoryFilterConfig } from '@constants/filterOptions';
import { useCategoryFilterStore } from '@store/categoryFilterStore';

interface UseFilterStateOptions {
  products: Product[];
  categoryId: string;
}

function isFullPriceRange(range: [number, number], bounds: [number, number]): boolean {
  return range[0] <= bounds[0] && range[1] >= bounds[1];
}

function withUpdatedPriceBounds(
  filters: ActiveFilters,
  prevBounds: [number, number] | null,
  nextBounds: [number, number],
): ActiveFilters {
  const next = cloneFilters(filters);

  // User had the full previous range selected → adopt the new product-derived bounds
  if (prevBounds && isFullPriceRange(filters.priceRange, prevBounds)) {
    next.priceRange = [...nextBounds] as [number, number];
    return next;
  }

  // First sync after remount: only replace placeholder defaults, keep real user ranges
  if (!prevBounds) {
    const looksLikePlaceholder =
      filters.priceRange[0] === 0 && filters.priceRange[1] >= 5000;
    if (looksLikePlaceholder || isFullPriceRange(filters.priceRange, nextBounds)) {
      next.priceRange = [...nextBounds] as [number, number];
      return next;
    }
  }

  // Clamp an active custom range into the new bounds
  next.priceRange = [
    Math.max(nextBounds[0], Math.min(filters.priceRange[0], nextBounds[1])),
    Math.min(nextBounds[1], Math.max(filters.priceRange[1], nextBounds[0])),
  ];
  return next;
}

export function useFilterState({ products, categoryId }: UseFilterStateOptions) {
  const getStored = useCategoryFilterStore((s) => s.getCategoryFilters);
  const setStored = useCategoryFilterStore((s) => s.setCategoryFilters);

  const config = useMemo(
    () => getCategoryFilterConfig(categoryId, products),
    [categoryId, products],
  );

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(() => {
    const stored = getStored(categoryId);
    return stored ?? createDefaultFilters(config.priceBounds);
  });
  const [draftFilters, setDraftFilters] = useState<ActiveFilters>(() => {
    const stored = getStored(categoryId);
    return stored ?? createDefaultFilters(config.priceBounds);
  });

  const prevCategoryRef = useRef(categoryId);
  const prevBoundsRef = useRef<[number, number] | null>(null);

  // Restore / reset when category changes
  useEffect(() => {
    if (prevCategoryRef.current === categoryId) return;
    prevCategoryRef.current = categoryId;
    const stored = getStored(categoryId);
    const next = stored ?? createDefaultFilters(config.priceBounds);
    setActiveFilters(next);
    setDraftFilters(cloneFilters(next));
    prevBoundsRef.current = config.priceBounds;
  }, [categoryId, config.priceBounds, getStored]);

  // Keep price range in sync with product-derived bounds without wiping filters
  useEffect(() => {
    const nextBounds = config.priceBounds;
    const prevBounds = prevBoundsRef.current;
    if (
      prevBounds &&
      prevBounds[0] === nextBounds[0] &&
      prevBounds[1] === nextBounds[1]
    ) {
      return;
    }

    setActiveFilters((prev) => withUpdatedPriceBounds(prev, prevBounds, nextBounds));
    setDraftFilters((prev) => withUpdatedPriceBounds(prev, prevBounds, nextBounds));
    prevBoundsRef.current = nextBounds;
  }, [config.priceBounds[0], config.priceBounds[1]]);

  // Persist filters so product detail → back keeps them
  useEffect(() => {
    if (!categoryId) return;
    setStored(categoryId, activeFilters);
  }, [activeFilters, categoryId, setStored]);

  const syncDraft = useCallback(() => {
    setDraftFilters(cloneFilters(activeFilters));
  }, [activeFilters]);

  const filteredProducts = useMemo(
    () => applyProductFilters(products, activeFilters, config, categoryId),
    [products, activeFilters, config, categoryId],
  );

  const draftFilteredCount = useMemo(
    () =>
      applyProductFilters(
        products,
        { ...draftFilters, search: activeFilters.search },
        config,
        categoryId,
      ).length,
    [products, draftFilters, activeFilters.search, config, categoryId],
  );

  const activeCount = useMemo(
    () => countActiveFilters(activeFilters, config.priceBounds),
    [activeFilters, config.priceBounds],
  );

  const setSearch = useCallback((search: string) => {
    setActiveFilters((prev) => ({ ...prev, search }));
  }, []);

  const clearFilter = useCallback(
    (key: keyof ActiveFilters) => {
      const applyClear = (prev: ActiveFilters): ActiveFilters => {
        const next = cloneFilters(prev);
        switch (key) {
          case 'grade':
            next.grade = [];
            break;
          case 'eta':
            next.eta = null;
            break;
          case 'brand':
            next.brand = [];
            break;
          case 'priceRange':
            next.priceRange = [...config.priceBounds] as [number, number];
            break;
          case 'availability':
            next.availability = [...createDefaultFilters(config.priceBounds).availability];
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
    },
    [config.priceBounds],
  );

  const clearAll = useCallback(() => {
    const defaults = createDefaultFilters(config.priceBounds);
    setActiveFilters(defaults);
    setDraftFilters(defaults);
  }, [config.priceBounds]);

  const applyDraft = useCallback(() => {
    setActiveFilters((prev) => ({
      ...cloneFilters(draftFilters),
      search: prev.search,
    }));
  }, [draftFilters]);

  const resetDraft = useCallback(() => {
    setDraftFilters(createDefaultFilters(config.priceBounds));
  }, [config.priceBounds]);

  const setDraft = useCallback((filters: ActiveFilters) => {
    setDraftFilters(cloneFilters(filters));
  }, []);

  const updateFilters = useCallback((filters: ActiveFilters) => {
    const next = cloneFilters(filters);
    setActiveFilters(next);
    setDraftFilters(next);
  }, []);

  return {
    config,
    activeFilters,
    draftFilters,
    filteredProducts,
    draftFilteredCount,
    activeCount,
    setSearch,
    clearFilter,
    clearAll,
    applyDraft,
    resetDraft,
    syncDraft,
    setDraft,
    updateFilters,
  };
}

export type UseFilterStateReturn = ReturnType<typeof useFilterState>;
