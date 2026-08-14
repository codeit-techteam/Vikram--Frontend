import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  fetchDeliveryEta,
  type DeliveryEtaCartItem,
  type DeliveryEtaResult,
} from '@services/delivery.api';

interface EtaState {
  eta: DeliveryEtaResult | null;
  latitude: number | null;
  longitude: number | null;
  pincode: string | null;
  isLoading: boolean;
  error: string | null;
  fetchedAt: number | null;

  setLocation: (lat: number, lng: number, pincode?: string | null) => void;
  fetchEta: (cartItems?: DeliveryEtaCartItem[]) => Promise<DeliveryEtaResult | null>;
  clearEta: () => void;
}

const ETA_STALE_MS = 1000 * 60 * 2;
let etaRequestSeq = 0;

export const useEtaStore = create<EtaState>()(
  persist(
    (set, get) => ({
      eta: null,
      latitude: null,
      longitude: null,
      pincode: null,
      isLoading: false,
      error: null,
      fetchedAt: null,

      setLocation: (lat, lng, pincode = null) =>
        set({ latitude: lat, longitude: lng, pincode }),

      fetchEta: async (cartItems) => {
        const { latitude, longitude, pincode } = get();
        if (latitude == null || longitude == null) {
          set({ error: 'Select delivery location to calculate ETA' });
          return get().eta;
        }

        const requestId = ++etaRequestSeq;
        set({ isLoading: true, error: null });
        try {
          const eta = await fetchDeliveryEta({
            latitude,
            longitude,
            pincode: pincode ?? undefined,
            cartItems,
          });
          if (requestId !== etaRequestSeq) return eta;
          set({ eta, isLoading: false, fetchedAt: Date.now(), error: null });
          return eta;
        } catch (err) {
          if (requestId !== etaRequestSeq) return null;
          const message =
            err instanceof Error
              ? err.message
              : err && typeof err === 'object' && 'message' in err
                ? String((err as { message?: unknown }).message ?? '')
                : 'Failed to calculate ETA';
          if (/cancel/i.test(message)) {
            set({ isLoading: false });
            return get().eta;
          }
          set({ isLoading: false, error: message });
          return get().eta;
        }
      },

      clearEta: () =>
        set({
          eta: null,
          error: null,
          fetchedAt: null,
        }),
    }),
    {
      name: 'bajriwala-eta',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        latitude: state.latitude,
        longitude: state.longitude,
        pincode: state.pincode,
      }),
    },
  ),
);

export function isEtaFresh(fetchedAt: number | null): boolean {
  if (!fetchedAt) return false;
  return Date.now() - fetchedAt < ETA_STALE_MS;
}
