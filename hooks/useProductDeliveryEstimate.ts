import { useEffect, useRef, useState } from 'react';

import {
  fetchDeliveryEta,
  formatEtaLabel,
  type DeliveryEtaResult,
} from '@services/delivery.api';
import { useDeliveryStore } from '@store/deliveryStore';
import { useEtaStore } from '@store/etaStore';

export type DeliveryEstimateStatus = 'idle' | 'calculating' | 'success' | 'error';

const DEBOUNCE_MS = 400;
const UPDATING_LABEL = 'Updating delivery estimate...';
const MISSING_LOCATION_LABEL = 'Select delivery location to calculate ETA';
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value?: string | null): value is string {
  return Boolean(value && UUID_RE.test(value));
}

function resolveCoords() {
  const eta = useEtaStore.getState();
  if (eta.latitude != null && eta.longitude != null) {
    return {
      latitude: eta.latitude,
      longitude: eta.longitude,
      pincode: eta.pincode,
    };
  }
  const delivery = useDeliveryStore.getState();
  const site =
    delivery.profileSites.find((s) => s.id === delivery.selectedSiteId) ??
    delivery.profileSites.find((s) => s.isPrimary) ??
    delivery.profileSites[0];
  if (site?.latitude != null && site?.longitude != null) {
    return {
      latitude: site.latitude,
      longitude: site.longitude,
      pincode: null as string | null,
    };
  }
  return { latitude: null, longitude: null, pincode: null as string | null };
}

/**
 * Product-page / add-to-cart ETA. Always product + qty + destination.
 * Keeps the last valid estimate visible while recalculating.
 */
export function useProductDeliveryEstimate(options: {
  productId?: string;
  variantId?: string;
  quantity: number;
  enabled?: boolean;
}) {
  const enabled = options.enabled !== false;
  const [estimate, setEstimate] = useState<DeliveryEtaResult | null>(null);
  const [status, setStatus] = useState<DeliveryEstimateStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const seqRef = useRef(0);
  const lastGoodRef = useRef<DeliveryEtaResult | null>(null);

  const storedLat = useEtaStore((s) => s.latitude);
  const storedLng = useEtaStore((s) => s.longitude);
  const selectedSiteId = useDeliveryStore((s) => s.selectedSiteId);
  const profileSites = useDeliveryStore((s) => s.profileSites);

  useEffect(() => {
    if (!enabled || !options.productId || options.quantity <= 0) {
      return;
    }

    const coords = resolveCoords();
    if (coords.latitude == null || coords.longitude == null) {
      setStatus('idle');
      setError(null);
      return;
    }

    if (storedLat == null || storedLng == null) {
      useEtaStore
        .getState()
        .setLocation(coords.latitude, coords.longitude, coords.pincode);
    }

    const seq = ++seqRef.current;
    const controller = new AbortController();
    setStatus('calculating');
    setError(null);

    const timer = setTimeout(() => {
      void fetchDeliveryEta({
        latitude: coords.latitude!,
        longitude: coords.longitude!,
        pincode: coords.pincode ?? undefined,
        cartItems: [
          {
            productId: options.productId!,
            variantId: isUuid(options.variantId) ? options.variantId : undefined,
            quantity: options.quantity,
          },
        ],
        signal: controller.signal,
      })
        .then((result) => {
          if (seq !== seqRef.current) return;
          setEstimate(result);
          lastGoodRef.current = result;
          setStatus('success');
        })
        .catch((err: unknown) => {
          if (seq !== seqRef.current) return;
          if (controller.signal.aborted) return;
          const message =
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message?: unknown }).message ?? '')
              : '';
          if (/cancel/i.test(message)) return;
          setError(
            message && !/unavailable/i.test(message)
              ? message
              : 'Delivery estimate unavailable',
          );
          setStatus('error');
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    enabled,
    options.productId,
    options.variantId,
    options.quantity,
    storedLat,
    storedLng,
    selectedSiteId,
    profileSites,
  ]);

  const visible = estimate ?? lastGoodRef.current;
  const missingLocation =
    storedLat == null && storedLng == null && resolveCoords().latitude == null;

  const label = (() => {
    if (visible) return formatEtaLabel(visible);
    if (missingLocation) return MISSING_LOCATION_LABEL;
    if (status === 'calculating') return UPDATING_LABEL;
    if (status === 'error') {
      return error && !/unavailable/i.test(error)
        ? error
        : 'Unable to calculate delivery estimate';
    }
    if (status === 'idle') return MISSING_LOCATION_LABEL;
    return formatEtaLabel(visible);
  })();

  return {
    estimate: visible,
    status,
    error,
    label,
    isCalculating: status === 'calculating',
    missingLocation,
  };
}
