import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchDeliveryPromotions } from '@services/deliveryPromotion.api';
import { useAuthStore } from '@store/useAuthStore';
import type { CmsDeliveryPromotion } from '@/types/cms';

export const DELIVERY_PROMOTIONS_QUERY_KEY = 'cms-delivery-promotions';
export const DELIVERY_PROMOTIONS_STALE_TIME = 1000 * 30;

export function useDeliveryPromotions(options?: { enabled?: boolean }) {
  const customerId = useAuthStore((s) => s.customer?.id ?? 'guest');

  const query = useQuery({
    queryKey: [DELIVERY_PROMOTIONS_QUERY_KEY, customerId],
    queryFn: fetchDeliveryPromotions,
    staleTime: DELIVERY_PROMOTIONS_STALE_TIME,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60,
    enabled: options?.enabled !== false,
    retry: 1,
  });

  const refetch = query.refetch;
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const promotions = query.data ?? [];
  const featured: CmsDeliveryPromotion | null = promotions[0] ?? null;

  return {
    promotions,
    featured,
    isLoading: query.isLoading && !query.data,
    isRefreshing: query.isRefetching,
    error: query.error,
    refresh,
  };
}
