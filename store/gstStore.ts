import { create } from 'zustand';

import {
  deleteGST,
  fetchGST,
  saveGST,
  updateGST,
} from '@services/gst.service';
import { updateProfile } from '@services/customer.api';
import { useUserStore } from '@store/userStore';
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
  setFromProfile: (details: GstDetails | null) => void;
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

function uiStateFromDetails(details: GstDetails | null): GstUiState {
  if (!details?.gstNumber) return 'NOT_ADDED';
  if (details.status === 'verified') return 'VERIFIED';
  if (details.status === 'failed') return 'FAILED';
  if (details.status === 'pending') return 'VERIFYING';
  return 'NOT_ADDED';
}

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
    uiState: uiStateFromDetails(details),
  };
}

function syncUserFromGst(details: GstDetails | null) {
  if (!details) {
    useUserStore.getState().updateUser({
      gstNumber: '',
      pan: '',
      jurisdiction: '',
      gstVerifiedAt: '',
      complianceScore: 0,
    });
    return;
  }

  useUserStore.getState().updateUser({
    gstNumber: details.gstNumber,
    company: details.businessName || useUserStore.getState().user.company,
    pan: details.pan,
    jurisdiction: details.state,
    registeredAddress: details.registeredAddress || useUserStore.getState().user.registeredAddress,
    businessType: details.businessType || useUserStore.getState().user.businessType,
    gstVerifiedAt:
      details.status === 'verified'
        ? details.updatedAt
          ? new Date(details.updatedAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : new Date().toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
        : '',
    complianceScore: details.status === 'verified' ? 100 : details.status === 'pending' ? 40 : 0,
  });
}

export const useGstStore = create<GstState>((set, get) => ({
  ...initialState,

  fetchGST: async () => {
    set({ isLoading: true, loading: true, uiState: 'LOADING' });
    try {
      const details = await fetchGST();
      set({ ...mapDetails(details), isLoading: false, loading: false, validationError: null });
      if (details) syncUserFromGst(details);
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
      businessType: result.businessType,
      updatedAt: result.updatedAt ?? new Date().toISOString(),
      certificateUrl: result.certificateUrl,
    };
    set({ ...mapDetails(details), validationError: null });
    syncUserFromGst(details);
  },

  saveGST: async (payload) => {
    set({ isLoading: true, loading: true, uiState: 'LOADING' });
    try {
      const details = await saveGST(payload);
      const enriched: GstDetails = {
        ...details,
        updatedAt: details.updatedAt ?? new Date().toISOString(),
        businessType: details.businessType ?? useUserStore.getState().user.businessType,
      };
      set({
        ...mapDetails(enriched),
        isLoading: false,
        loading: false,
        validationError: null,
      });
      syncUserFromGst(enriched);
    } catch {
      set({
        isLoading: false,
        loading: false,
        uiState: 'FAILED',
        validationError: 'Failed to save GST',
      });
    }
  },

  saveGstDetails: async (payload) => {
    await get().saveGST(payload);
  },

  updateGST: async (payload) => {
    set({ isLoading: true, loading: true, uiState: 'LOADING' });
    try {
      const details = await updateGST(payload);
      const enriched: GstDetails = {
        ...details,
        updatedAt: details.updatedAt ?? new Date().toISOString(),
        businessType: details.businessType ?? useUserStore.getState().user.businessType,
      };
      set({
        ...mapDetails(enriched),
        isLoading: false,
        loading: false,
        validationError: null,
      });
      syncUserFromGst(enriched);
    } catch {
      set({
        isLoading: false,
        loading: false,
        uiState: 'FAILED',
        validationError: 'Failed to update GST',
      });
    }
  },

  updateGstDetails: async (payload) => {
    await get().updateGST(payload);
  },

  removeGST: async () => {
    set({ isLoading: true, loading: true, uiState: 'LOADING' });
    try {
      await deleteGST();
      try {
        await updateProfile({
          gstNumber: '',
          gstVerified: false,
          panNumber: '',
        });
      } catch {
        // ignore profile clear failures
      }
      set({ ...initialState });
      syncUserFromGst(null);
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

  setFromProfile: (details) => {
    set({ ...mapDetails(details), isLoading: false, loading: false, validationError: null });
  },

  reset: () => set(initialState),
}));
