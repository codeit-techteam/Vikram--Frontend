import { useCallback, useEffect, useMemo } from 'react';

import { formatEtaLabel } from '@services/delivery.api';
import { useCartStore } from '@store/cartStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { useEtaStore } from '@store/etaStore';

/**
 * Keeps dynamic ETA in sync with user location + cart contents.
 * Quantity taps are debounced so the vehicle card does not flicker.
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
  const storedLat = useEtaStore((s) => s.latitude);
  const storedLng = useEtaStore((s) => s.longitude);
  const setLocation = useEtaStore((s) => s.setLocation);
  const fetchEta = useEtaStore((s) => s.fetchEta);
  const items = useCartStore((s) => s.items);
  const selectedSiteId = useDeliveryStore((s) => s.selectedSiteId);
  const profileSites = useDeliveryStore((s) => s.profileSites);

  const cartKey = useMemo(
    () =>
      items
        .filter((i) => i.productId)
        .map((i) => `${i.productId}:${i.variantId ?? ''}:${i.quantity}`)
        .join('|'),
    [items],
  );

  const refresh = useCallback(async () => {
    const cartItems = useCartStore
      .getState()
      .items.filter((i) => i.productId)
      .map((i) => ({
        productId: i.productId!,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
    return fetchEta(cartItems.length ? cartItems : undefined);
  }, [fetchEta]);

  useEffect(() => {
    if (options?.latitude != null && options?.longitude != null) {
      setLocation(options.latitude, options.longitude, options.pincode);
      return;
    }
    if (storedLat != null && storedLng != null) return;
    const site =
      profileSites.find((s) => s.id === selectedSiteId) ??
      profileSites.find((s) => s.isPrimary) ??
      profileSites[0];
    if (site?.latitude != null && site?.longitude != null) {
      setLocation(site.latitude, site.longitude);
    }
  }, [
    options?.latitude,
    options?.longitude,
    options?.pincode,
    setLocation,
    storedLat,
    storedLng,
    selectedSiteId,
    profileSites,
  ]);

  useEffect(() => {
    if (options?.autoFetch === false) return;
    const { latitude, longitude } = useEtaStore.getState();
    if (latitude == null || longitude == null) return;
    const timer = setTimeout(() => {
      void refresh();
    }, 400);
    return () => clearTimeout(timer);
  }, [options?.autoFetch, refresh, cartKey, storedLat, storedLng]);

  const label = formatEtaLabel(eta);

  return {
    eta,
    isLoading,
    error,
    label,
    deliveryMessage: label,
    estimatedMinutes: eta?.deliveryETA ?? null,
    deliveringBy: eta?.deliveringBy ?? null,
    deliveryDay: eta?.deliveryDay ?? null,
    serviceable: eta?.serviceable ?? false,
    deliveryCharge: eta?.deliveryCharge ?? null,
    refresh,
  };
}
