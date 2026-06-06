import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Product } from '@/types/catalog';
import type { ActiveFilters, CategoryFilterConfig } from '@/types/filter.types';
import {
  createDefaultFilters,
  countActiveFilters,
  extractBrandFromProduct,
  extractEtaFromBadge,
  getCategoryFilterConfig,
  isPriceRangeActive,
  normalizeGrade,
  statusToAvailability,
} from '@constants/filterOptions';

interface UseFilterStateOptions {
  products: Product[];
  categoryId: string;
}

function applyFilters(
  products: Product[],
  filters: ActiveFilters,
  config: CategoryFilterConfig,
  categoryId: string,
): Product[] {
  return products.filter((product) => {
    if (filters.grade.length > 0) {
      const productGrade = normalizeGrade(product.grade, categoryId);
      if (!filters.grade.some((g) => productGrade.toLowerCase() === g.toLowerCase())) {
        return false;
      }
    }

    if (filters.eta) {
      const productEta = extractEtaFromBadge(product.badge);
      if (productEta !== filters.eta) return false;
    }

    if (filters.brand) {
      const productBrand = extractBrandFromProduct(product, categoryId);
      if (productBrand !== filters.brand) return false;
    }

    if (isPriceRangeActive(filters, config.priceBounds)) {
      const price = product.retailPriceValue;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }
    }

    if (filters.availability.length > 0) {
      const availability = statusToAvailability(product.status);
      if (!filters.availability.includes(availability)) return false;
    }

    return true;
  });
}

export function useFilterState({ products, categoryId }: UseFilterStateOptions) {
  const config = useMemo(
    () => getCategoryFilterConfig(categoryId, products),
    [categoryId, products],
  );

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(() =>
    createDefaultFilters(config.priceBounds),
  );
  const [draftFilters, setDraftFilters] = useState<ActiveFilters>(() =>
    createDefaultFilters(config.priceBounds),
  );

  useEffect(() => {
    const defaults = createDefaultFilters(config.priceBounds);
    setActiveFilters(defaults);
    setDraftFilters(defaults);
  }, [categoryId, config.priceBounds[0], config.priceBounds[1]]);

  const syncDraft = useCallback(() => {
    setDraftFilters({ ...activeFilters, priceRange: [...activeFilters.priceRange] as [number, number] });
  }, [activeFilters]);

  const filteredProducts = useMemo(
    () => applyFilters(products, activeFilters, config, categoryId),
    [products, activeFilters, config, categoryId],
  );

  const draftFilteredCount = useMemo(
    () => applyFilters(products, draftFilters, config, categoryId).length,
    [products, draftFilters, config, categoryId],
  );

  const activeCount = useMemo(
    () => countActiveFilters(activeFilters, config.priceBounds),
    [activeFilters, config.priceBounds],
  );

  const toggleGrade = useCallback((grade: string, target: 'active' | 'draft' = 'draft') => {
    const updater = (prev: ActiveFilters) => {
      const exists = prev.grade.includes(grade);
      return {
        ...prev,
        grade: exists ? prev.grade.filter((g) => g !== grade) : [...prev.grade, grade],
      };
    };
    if (target === 'active') setActiveFilters(updater);
    else setDraftFilters(updater);
  }, []);

  const setETA = useCallback(
    (eta: string | null, target: 'active' | 'draft' = 'draft') => {
      const updater = (prev: ActiveFilters) => ({
        ...prev,
        eta: prev.eta === eta ? null : eta,
      });
      if (target === 'active') setActiveFilters(updater);
      else setDraftFilters(updater);
    },
    [],
  );

  const setBrand = useCallback(
    (brand: string | null, target: 'active' | 'draft' = 'draft') => {
      const updater = (prev: ActiveFilters) => ({
        ...prev,
        brand: prev.brand === brand ? null : brand,
      });
      if (target === 'active') setActiveFilters(updater);
      else setDraftFilters(updater);
    },
    [],
  );

  const setPriceRange = useCallback(
    (min: number, max: number, target: 'active' | 'draft' = 'draft') => {
      const updater = (prev: ActiveFilters) => ({
        ...prev,
        priceRange: [min, max] as [number, number],
      });
      if (target === 'active') setActiveFilters(updater);
      else setDraftFilters(updater);
    },
    [],
  );

  const toggleAvailability = useCallback(
    (type: string, target: 'active' | 'draft' = 'draft') => {
      const updater = (prev: ActiveFilters) => {
        const exists = prev.availability.includes(type);
        return {
          ...prev,
          availability: exists
            ? prev.availability.filter((a) => a !== type)
            : [...prev.availability, type],
        };
      };
      if (target === 'active') setActiveFilters(updater);
      else setDraftFilters(updater);
    },
    [],
  );

  const clearFilter = useCallback(
    (key: keyof ActiveFilters) => {
      setActiveFilters((prev) => {
        const next = { ...prev };
        switch (key) {
          case 'grade':
            next.grade = [];
            break;
          case 'eta':
            next.eta = null;
            break;
          case 'brand':
            next.brand = null;
            break;
          case 'priceRange':
            next.priceRange = [...config.priceBounds] as [number, number];
            break;
          case 'availability':
            next.availability = [];
            break;
        }
        return next;
      });
      setDraftFilters((prev) => {
        const next = { ...prev };
        switch (key) {
          case 'grade':
            next.grade = [];
            break;
          case 'eta':
            next.eta = null;
            break;
          case 'brand':
            next.brand = null;
            break;
          case 'priceRange':
            next.priceRange = [...config.priceBounds] as [number, number];
            break;
          case 'availability':
            next.availability = [];
            break;
        }
        return next;
      });
    },
    [config.priceBounds],
  );

  const clearAll = useCallback(() => {
    const defaults = createDefaultFilters(config.priceBounds);
    setActiveFilters(defaults);
    setDraftFilters(defaults);
  }, [config.priceBounds]);

  const applyDraft = useCallback(() => {
    setActiveFilters({
      ...draftFilters,
      grade: [...draftFilters.grade],
      availability: [...draftFilters.availability],
      priceRange: [...draftFilters.priceRange] as [number, number],
    });
  }, [draftFilters]);

  const resetDraft = useCallback(() => {
    setDraftFilters(createDefaultFilters(config.priceBounds));
  }, [config.priceBounds]);

  const setDraft = useCallback((filters: ActiveFilters) => {
    setDraftFilters({
      ...filters,
      grade: [...filters.grade],
      availability: [...filters.availability],
      priceRange: [...filters.priceRange] as [number, number],
    });
  }, []);

  const updateFilters = useCallback((filters: ActiveFilters) => {
    const next = {
      ...filters,
      grade: [...filters.grade],
      availability: [...filters.availability],
      priceRange: [...filters.priceRange] as [number, number],
    };
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
    toggleGrade,
    setETA,
    setBrand,
    setPriceRange,
    toggleAvailability,
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
