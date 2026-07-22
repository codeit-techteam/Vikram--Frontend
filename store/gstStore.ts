import { create } from 'zustand';

import {
  deleteGST,
  fetchGST,
  saveGST,
  updateGST,
} from '@services/gst.service';
import type { GstDetails, GstUiState, GstValidationResult, SaveGstPayload } from '@/types/gst';

interface GstState {
  details: GstDetails | null;
  uiState: GstUiState;
  isLoading: boolean;
  checkoutInvoiceEnabled: boolean;
  showSuccessBanner: boolean;
  validationError: string | null;

  gstNumber: string | null;
  businessName: string | null;
  businessAddress: string | null;
  verified: boolean;
  loading: boolean;

  fetchGST: () => Promise<void>;
  loadGst: () => Promise<void>;
  applyGstDetails: (result: GstValidationResult) => Promise<void>;
  saveGST: (payload: SaveGstPayload) => Promise<void>;
  saveGstDetails: (payload: SaveGstPayload) => Promise<void>;
  updateGST: (payload: SaveGstPayload) => Promise<void>;
  updateGstDetails: (payload: SaveGstPayload) => Promise<void>;
  removeGST: () => Promise<void>;
  removeGst: () => Promise<void>;
  setUiState: (state: GstUiState) => void;
  setVerifying: () => void;
  setValidationFailed: (message?: string) => void;
  triggerSuccessBanner: () => void;
  dismissSuccessBanner: () => void;
  setCheckoutInvoiceEnabled: (enabled: boolean) => void;
  reset: () => void;
}

const initialState = {
  details: null as GstDetails | null,
  uiState: 'NOT_ADDED' as GstUiState,
  isLoading: false,
  checkoutInvoiceEnabled: false,
  showSuccessBanner: false,
  validationError: null as string | null,
  gstNumber: null as string | null,
  businessName: null as string | null,
  businessAddress: null as string | null,
  verified: false,
  loading: false,
};

function mapDetails(details: GstDetails | null): Pick<
  GstState,
  | 'details'
  | 'gstNumber'
  | 'businessName'
  | 'businessAddress'
  | 'verified'
  | 'checkoutInvoiceEnabled'
  | 'uiState'
> {
  const verified = details?.status === 'verified';
  return {
    details,
    gstNumber: details?.gstNumber ?? null,
    businessName: details?.businessName ?? null,
    businessAddress: details?.registeredAddress ?? null,
    verified,
    checkoutInvoiceEnabled: verified,
    uiState: verified ? 'VERIFIED' : 'NOT_ADDED',
  };
}

export const useGstStore = create<GstState>((set, get) => ({
  ...initialState,

  fetchGST: async () => {
    set({ isLoading: true, loading: true, uiState: 'LOADING' });
    try {
      const details = await fetchGST();
      set({ ...mapDetails(details), isLoading: false, loading: false, validationError: null });
    } catch {
      set({ isLoading: false, loading: false, uiState: 'NOT_ADDED' });
    }
  },

  loadGst: async () => {
    await get().fetchGST();
  },

  applyGstDetails: async (result) => {
    const details: GstDetails = {
      gstNumber: result.gstNumber,
      businessName: result.businessName,
      registeredAddress: result.registeredAddress,
      state: result.state,
      pan: result.pan,
      status: result.status,
    };
    set({ ...mapDetails(details), validationError: null });
  },

  saveGST: async (payload) => {
    set({ isLoading: true, loading: true, uiState: 'LOADING' });
    try {
      const details = await saveGST(payload);
      set({
        ...mapDetails(details),
        isLoading: false,
        loading: false,
        validationError: null,
        uiState: 'VERIFIED',
      });
    } catch {
      set({ isLoading: false, loading: false, uiState: 'FAILED', validationError: 'Failed to save GST' });
    }
  },

  saveGstDetails: async (payload) => {
    await get().saveGST(payload);
  },

  updateGST: async (payload) => {
    set({ isLoading: true, loading: true, uiState: 'LOADING' });
    try {
      const details = await updateGST(payload);
      set({
        ...mapDetails(details),
        isLoading: false,
        loading: false,
        validationError: null,
        uiState: 'VERIFIED',
      });
    } catch {
      set({ isLoading: false, loading: false, uiState: 'FAILED', validationError: 'Failed to update GST' });
    }
  },

  updateGstDetails: async (payload) => {
    await get().updateGST(payload);
  },

  removeGST: async () => {
    set({ isLoading: true, loading: true, uiState: 'LOADING' });
    try {
      await deleteGST();
      set({ ...initialState });
    } finally {
      set({ isLoading: false, loading: false });
    }
  },

  removeGst: async () => {
    await get().removeGST();
  },

  setUiState: (uiState) => set({ uiState }),

  setVerifying: () => set({ uiState: 'VERIFYING', validationError: null }),

  setValidationFailed: (message) =>
    set({ uiState: 'FAILED', validationError: message ?? 'Invalid GST Number' }),

  triggerSuccessBanner: () => set({ showSuccessBanner: true }),

  dismissSuccessBanner: () => set({ showSuccessBanner: false }),

  setCheckoutInvoiceEnabled: (enabled) => {
    if (!get().details) {
      set({ checkoutInvoiceEnabled: false });
      return;
    }
    set({ checkoutInvoiceEnabled: enabled });
  },

  reset: () => set(initialState),
}));
