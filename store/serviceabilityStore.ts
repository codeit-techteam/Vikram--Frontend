import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  checkServiceability,
  type ServiceabilityResult,
} from '@services/serviceability.api';
import { useEtaStore } from '@store/etaStore';

interface ServiceabilityState {
  serviceable: boolean;
  deliveryETA: number | null;
  deliveryMessage: string | null;
  reason: string | null;
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  error: string | null;
  checkedAt: number | null;

  check: (lat: number, lng: number, pincode?: string | null) => Promise<ServiceabilityResult | null>;
  clear: () => void;
}

const CHECK_STALE_MS = 1000 * 60 * 2;

export const useServiceabilityStore = create<ServiceabilityState>()(
  persist(
    (set, get) => ({
      serviceable: false,
      deliveryETA: null,
      deliveryMessage: null,
      reason: null,
      latitude: null,
      longitude: null,
      isLoading: false,
      error: null,
      checkedAt: null,

      check: async (lat, lng, pincode = null) => {
        set({
          latitude: lat,
          longitude: lng,
          isLoading: true,
          error: null,
        });

        try {
          const result = await checkServiceability({
            latitude: lat,
            longitude: lng,
          });

          set({
            serviceable: result.serviceable,
            deliveryETA: result.deliveryETA,
            deliveryMessage: result.deliveryMessage,
            reason: result.reason ?? null,
            isLoading: false,
            checkedAt: Date.now(),
            error: null,
          });

          useEtaStore.getState().setLocation(lat, lng, pincode);
          void useEtaStore.getState().fetchEta();

          if (__DEV__) {
            console.log('[Serviceability]', {
              customer: { lat, lng },
              serviceable: result.serviceable,
              deliveryETA: result.deliveryETA,
              deliveryMessage: result.deliveryMessage,
              reason: result.reason,
            });
          }

          return result;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Serviceability check failed';
          set({ isLoading: false, error: message });
          return null;
        }
      },

      clear: () =>
        set({
          serviceable: false,
          deliveryETA: null,
          deliveryMessage: null,
          reason: null,
          checkedAt: null,
          error: null,
        }),
    }),
    {
      name: 'bajriwala-serviceability',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        serviceable: state.serviceable,
        deliveryETA: state.deliveryETA,
        deliveryMessage: state.deliveryMessage,
        latitude: state.latitude,
        longitude: state.longitude,
        checkedAt: state.checkedAt,
      }),
    },
  ),
);

export function isServiceabilityFresh(checkedAt: number | null): boolean {
  if (!checkedAt) return false;
  return Date.now() - checkedAt < CHECK_STALE_MS;
}
