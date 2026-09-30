import { useQuery } from '@tanstack/react-query';

import { fetchDeliveryOptions } from '@services/delivery.api';
import { useAuthStore } from '@store/useAuthStore';
import { logCheckoutEvent } from '@utils/checkoutLogger';

export const DELIVERY_OPTIONS_QUERY_KEY = 'delivery-options';

/**
 * Delivery scheduling (ASAP / today / tomorrow / dated slots) loaded independently of the
 * checkout price preview, so a slow or failed quote never hides scheduling.
 */
export function useCheckoutDeliveryOptions(params: {
  addressId?: string;
  cartSignature: string;
  enabled: boolean;
}) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return useQuery({
    queryKey: [DELIVERY_OPTIONS_QUERY_KEY, params.addressId ?? null, params.cartSignature],
    queryFn: async ({ signal }) => {
      const startedAt = Date.now();
      try {
        const options = await fetchDeliveryOptions(params.addressId, { signal });
        logCheckoutEvent('delivery_options_loaded', {
          ms: Date.now() - startedAt,
          serviceable: options?.serviceable ?? null,
          scheduledDays: options?.scheduled?.length ?? 0,
        });
        return options;
      } catch (error) {
        logCheckoutEvent('delivery_options_failed', {
          ms: Date.now() - startedAt,
          status: (error as { statusCode?: number })?.statusCode ?? null,
          code: (error as { code?: string })?.code ?? null,
        });
        throw error;
      }
    },
    enabled: params.enabled && isLoggedIn && Boolean(params.addressId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    retryDelay: 1500,
    refetchOnWindowFocus: false,
  });
}
