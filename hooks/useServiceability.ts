import { useCallback, useEffect } from 'react';

import {
  isServiceabilityFresh,
  useServiceabilityStore,
} from '@store/serviceabilityStore';
import { useEtaStore } from '@store/etaStore';

/**
 * Backend-driven delivery serviceability for the customer's current coordinates.
 */
export function useServiceability(options?: {
  latitude?: number | null;
  longitude?: number | null;
  pincode?: string | null;
  autoCheck?: boolean;
}) {
  const serviceable = useServiceabilityStore((s) => s.serviceable);
  const deliveryETA = useServiceabilityStore((s) => s.deliveryETA);
  const deliveryMessage = useServiceabilityStore((s) => s.deliveryMessage);
  const reason = useServiceabilityStore((s) => s.reason);
  const isLoading = useServiceabilityStore((s) => s.isLoading);
  const error = useServiceabilityStore((s) => s.error);
  const checkedAt = useServiceabilityStore((s) => s.checkedAt);
  const check = useServiceabilityStore((s) => s.check);
  const eta = useEtaStore((s) => s.eta);

  const deliveryCharge = eta?.deliveryCharge ?? null;
  const freeDelivery = eta?.freeDelivery ?? false;
  const etaMinutes = eta?.deliveryETA ?? deliveryETA ?? null;
  const etaLabel = eta?.deliveryMessage ?? deliveryMessage ?? null;

  const refresh = useCallback(async () => {
    const lat = options?.latitude ?? useServiceabilityStore.getState().latitude;
    const lng = options?.longitude ?? useServiceabilityStore.getState().longitude;
    if (lat == null || lng == null) return null;
    return check(lat, lng, options?.pincode);
  }, [check, options?.latitude, options?.longitude, options?.pincode]);

  useEffect(() => {
    if (options?.autoCheck === false) return;
    const lat = options?.latitude;
    const lng = options?.longitude;
    if (lat == null || lng == null) return;

    const { latitude: storedLat, longitude: storedLng } =
      useServiceabilityStore.getState();
    const sameCoords =
      storedLat === lat && storedLng === lng && isServiceabilityFresh(checkedAt);
    if (sameCoords && deliveryMessage) return;

    void check(lat, lng, options?.pincode);
  }, [
    options?.autoCheck,
    options?.latitude,
    options?.longitude,
    options?.pincode,
    check,
    checkedAt,
    deliveryMessage,
  ]);

  return {
    serviceable,
    deliveryETA: etaMinutes,
    deliveryMessage: etaLabel,
    reason,
    isLoading,
    error,
    deliveryCharge,
    freeDelivery,
    refresh,
  };
}
