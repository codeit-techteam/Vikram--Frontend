import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchCategories, fetchCategoryBySlug } from '@services/categoryService';
import {
  areCategoriesFresh,
  useCatalogStore,
} from '@store/catalogStore';
import { useCategoryStore } from '@store/categoryStore';

export const CATEGORIES_QUERY_KEY = 'categories';
export const CATEGORIES_STALE_TIME = 1000 * 60 * 10;

export function useCategories(options?: { featured?: boolean; enabled?: boolean }) {
  const setCategories = useCatalogStore((s) => s.setCategories);
  const storeCategories = useCatalogStore((s) => s.categories);
  const fetchedAt = useCatalogStore((s) => s.categoriesFetchedAt);
  const setCategoryStore = useCategoryStore((s) => s.setCategories);

  const query = useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, options?.featured ?? 'all'],
    queryFn: () => fetchCategories(options?.featured),
    staleTime: CATEGORIES_STALE_TIME,
    enabled: options?.enabled !== false,
  });

  useEffect(() => {
    if (query.data && options?.featured !== true) {
      setCategories(query.data);
      setCategoryStore(query.data);
    }
  }, [query.data, options?.featured, setCategories, setCategoryStore]);

  const categories =
    query.data ??
    (options?.featured !== true && areCategoriesFresh(fetchedAt) ? storeCategories : []);

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    categories,
    isLoading: query.isLoading && categories.length === 0,
    isRefreshing: query.isRefetching,
    error: query.error,
    refresh,
  };
}

export function useCategory(slug?: string) {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, 'detail', slug],
    queryFn: () => fetchCategoryBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: CATEGORIES_STALE_TIME,
  });
}
