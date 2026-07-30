import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  fetchHomeProducts,
  type HomeProductsData,
} from '@services/productService';
import { useDeliveryStore } from '@store/deliveryStore';

export const HOME_PRODUCTS_QUERY_KEY = 'home-products';
export const HOME_PRODUCTS_STALE_TIME = 1000 * 60 * 5;

const EMPTY: HomeProductsData = {
  featured: [],
  popular: [],
  offers: [],
  recentlyAdded: [],
};

export function useHomeProducts(options?: { enabled?: boolean }) {
  const profileSite = useDeliveryStore((s) => {
    const selected = s.profileSites.find((x) => x.id === s.selectedSiteId);
    return selected ?? s.profileSites.find((x) => x.isPrimary) ?? s.profileSites[0];
  });

  const locationKey =
    profileSite?.latitude != null && profileSite?.longitude != null
      ? `${profileSite.latitude},${profileSite.longitude}`
      : 'no-location';

  const query = useQuery({
    queryKey: [HOME_PRODUCTS_QUERY_KEY, locationKey],
    queryFn: () =>
      fetchHomeProducts({
        latitude: profileSite?.latitude,
        longitude: profileSite?.longitude,
        limit: 10,
      }),
    staleTime: HOME_PRODUCTS_STALE_TIME,
    enabled: options?.enabled !== false,
    placeholderData: (previous) => previous,
  });

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const data = query.data ?? EMPTY;

  return useMemo(
    () => ({
      featured: data.featured,
      popular: data.popular,
      offers: data.offers,
      recentlyAdded: data.recentlyAdded,
      isLoading: query.isLoading && !query.data,
      isRefreshing: query.isRefetching,
      error: query.error,
      refresh,
    }),
    [
      data.featured,
      data.popular,
      data.offers,
      data.recentlyAdded,
      query.isLoading,
      query.data,
      query.isRefetching,
      query.error,
      refresh,
    ],
  );
}
