import { useCallback, useEffect } from 'react';

import { useCartStore } from '@store/cartStore';
import { isEtaFresh, useEtaStore } from '@store/etaStore';
import { formatEtaLabel } from '@services/delivery.api';

/**
 * Keeps dynamic ETA in sync with user location + cart contents.
 */
export function useDeliveryEta(options?: {
  latitude?: number | null;
  longitude?: number | null;
  pincode?: string | null;
  autoFetch?: boolean;
}) {
  const eta = useEtaStore((s) => s.eta);
  const isLoading = useEtaStore((s) => s.isLoading);
  const error = useEtaStore((s) => s.error);
  const fetchedAt = useEtaStore((s) => s.fetchedAt);
  const setLocation = useEtaStore((s) => s.setLocation);
  const fetchEta = useEtaStore((s) => s.fetchEta);
  const items = useCartStore((s) => s.items);

  const refresh = useCallback(async () => {
    const cartItems = items
      .filter((i) => i.productId)
      .map((i) => ({
        productId: i.productId!,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
    return fetchEta(cartItems.length ? cartItems : undefined);
  }, [fetchEta, items]);

  useEffect(() => {
    if (options?.latitude != null && options?.longitude != null) {
      setLocation(options.latitude, options.longitude, options.pincode);
    }
  }, [options?.latitude, options?.longitude, options?.pincode, setLocation]);

  useEffect(() => {
    if (options?.autoFetch === false) return;
    const { latitude, longitude } = useEtaStore.getState();
    if (latitude == null || longitude == null) return;
    if (isEtaFresh(fetchedAt) && eta) return;
    void refresh();
  }, [options?.autoFetch, fetchedAt, eta, refresh]);

  return {
    eta,
    isLoading,
    error,
    label: formatEtaLabel(eta),
    deliveryMessage: eta?.deliveryMessage ?? formatEtaLabel(eta),
    estimatedMinutes: eta?.deliveryETA ?? null,
    deliveringBy: eta?.deliveringBy ?? null,
    deliveryDay: eta?.deliveryDay ?? null,
    serviceable: eta?.serviceable ?? false,
    deliveryCharge: eta?.deliveryCharge ?? null,
    refresh,
  };
}
