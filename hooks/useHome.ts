import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchHomeCatalog } from '@services/homeService';
import { isHomeFresh, useCatalogStore } from '@store/catalogStore';

export const HOME_QUERY_KEY = 'home';
export const HOME_STALE_TIME = 1000 * 60 * 5;

export function useHomeCatalog(options?: { enabled?: boolean }) {
  const setHome = useCatalogStore((s) => s.setHome);
  const setCategories = useCatalogStore((s) => s.setCategories);
  const storedHome = useCatalogStore((s) => s.home);
  const homeFetchedAt = useCatalogStore((s) => s.homeFetchedAt);

  const query = useQuery({
    queryKey: [HOME_QUERY_KEY],
    queryFn: fetchHomeCatalog,
    staleTime: HOME_STALE_TIME,
    enabled: options?.enabled !== false,
    placeholderData: isHomeFresh(homeFetchedAt) ? storedHome ?? undefined : undefined,
  });

  useEffect(() => {
    if (!query.data) return;
    setHome(query.data);
    const cats =
      query.data.topCategories.length > 0
        ? query.data.topCategories
        : query.data.featuredCategories;
    if (cats.length > 0) setCategories(cats);
  }, [query.data, setHome, setCategories]);

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const home = query.data ?? (isHomeFresh(homeFetchedAt) ? storedHome : null);

  return {
    home,
    featuredCategories: home?.featuredCategories ?? [],
    topCategories: home?.topCategories ?? [],
    featuredProducts: home?.featuredProducts ?? [],
    bestSellingProducts: home?.bestSellingProducts ?? [],
    recommendedProducts: home?.recommendedProducts ?? [],
    isLoading: query.isLoading && !home,
    isRefreshing: query.isRefetching,
    error: query.error,
    refresh,
  };
}
