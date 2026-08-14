import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchOfferBySlug, fetchOffers } from '@services/offer.api';
import { fetchProducts } from '@services/productService';
import { useDeliveryStore } from '@store/deliveryStore';
import type { Product } from '@/types/catalog';

export const OFFERS_QUERY_KEY = 'customer-offers';
export const OFFER_DETAIL_QUERY_KEY = 'customer-offer';
export const OFFER_PRODUCTS_QUERY_KEY = 'offer-catalog-products';

export function useOffers(options?: { featured?: boolean; enabled?: boolean }) {
  return useQuery({
    queryKey: [OFFERS_QUERY_KEY, options?.featured ?? 'all'],
    queryFn: () => fetchOffers({ featured: options?.featured }),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
  });
}

export function useOfferDetail(slug: string | undefined) {
  return useQuery({
    queryKey: [OFFER_DETAIL_QUERY_KEY, slug],
    queryFn: () => fetchOfferBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}

export function useOfferCatalogProducts(ids: string[]) {
  const profileSite = useDeliveryStore((s) => {
    const selected = s.profileSites.find((x) => x.id === s.selectedSiteId);
    return selected ?? s.profileSites.find((x) => x.isPrimary) ?? s.profileSites[0];
  });

  const locationKey =
    profileSite?.latitude != null && profileSite?.longitude != null
      ? `${profileSite.latitude},${profileSite.longitude}`
      : 'no-location';

  const query = useQuery({
    queryKey: [OFFER_PRODUCTS_QUERY_KEY, ids, locationKey],
    queryFn: async () => {
      const page = await fetchProducts({
        ids: ids.join(','),
        page: 1,
        limit: Math.min(Math.max(ids.length, 1), 100),
        latitude: profileSite?.latitude,
        longitude: profileSite?.longitude,
      });
      const order = new Map(ids.map((id, index) => [id, index]));
      return [...page.items].sort(
        (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
      );
    },
    enabled: ids.length > 0,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  const products = useMemo<Product[]>(() => query.data ?? [], [query.data]);

  return {
    ...query,
    products,
  };
}
