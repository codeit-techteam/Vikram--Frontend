import { create } from 'zustand';

import {
  archiveGstAccount,
  createGstAccount,
  listGstAccounts,
  setDefaultGstAccount,
  verifyGstin as verifyGstinApi,
} from '@services/gst.service';
import { getApiErrorMessage } from '@services/api';
import { useUserStore } from '@store/userStore';
import {
  accountToGstDetails,
  isGstAccountVerified,
  verificationToValidationResult,
  type GstAccount,
  type GstDetails,
  type GstUiState,
  type GstValidationResult,
  type GstVerificationResult,
} from '@/types/gst';

interface GstState {
  accounts: GstAccount[];
  details: GstDetails | null;
  uiState: GstUiState;
  isLoading: boolean;
  checkoutInvoiceEnabled: boolean;
  selectedCheckoutGstAccountId: string | null;
  showSuccessBanner: boolean;
  validationError: string | null;

  gstNumber: string | null;
  businessName: string | null;
  businessAddress: string | null;
  verified: boolean;
  loading: boolean;

  loadAccounts: () => Promise<void>;
  fetchGST: () => Promise<void>;
  loadGst: () => Promise<void>;
  verifyGstin: (gstin: string) => Promise<GstValidationResult>;
  createFromVerification: (
    result: GstValidationResult,
    opts?: { setAsDefault?: boolean; selectForCheckout?: boolean },
  ) => Promise<GstAccount>;
  setDefaultAccount: (id: string) => Promise<void>;
  archiveAccount: (id: string) => Promise<void>;
  selectCheckoutAccount: (id: string | null) => void;
  getCheckoutAccount: () => GstAccount | null;

  applyGstDetails: (result: GstValidationResult) => Promise<void>;
  saveGstDetails: (result: GstValidationResult) => Promise<GstAccount | void>;
  saveGST: (result: GstValidationResult) => Promise<void>;
  updateGST: (result: GstValidationResult) => Promise<void>;
  updateGstDetails: (result: GstValidationResult) => Promise<void>;
  removeGST: (accountId?: string) => Promise<void>;
  removeGst: (accountId?: string) => Promise<void>;
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
  accounts: [] as GstAccount[],
  details: null as GstDetails | null,
  uiState: 'NOT_ADDED' as GstUiState,
  isLoading: false,
  checkoutInvoiceEnabled: false,
  selectedCheckoutGstAccountId: null as string | null,
  showSuccessBanner: false,
  validationError: null as string | null,
  gstNumber: null as string | null,
  businessName: null as string | null,
  businessAddress: null as string | null,
  verified: false,
  loading: false,
};

function activeAccounts(accounts: GstAccount[]): GstAccount[] {
  return accounts.filter((a) => !a.isArchived);
}

function defaultAccount(accounts: GstAccount[]): GstAccount | null {
  const active = activeAccounts(accounts);
  return active.find((a) => a.isDefault) ?? active[0] ?? null;
}

function uiStateFromAccounts(accounts: GstAccount[]): GstUiState {
  const active = activeAccounts(accounts);
  if (active.length === 0) return 'NOT_ADDED';
  const hasVerified = active.some(isGstAccountVerified);
  return hasVerified ? 'VERIFIED' : 'NOT_ADDED';
}

function mapPrimaryDetails(
  accounts: GstAccount[],
  selectedCheckoutId: string | null,
): Pick<
  GstState,
  | 'details'
  | 'gstNumber'
  | 'businessName'
  | 'businessAddress'
  | 'verified'
  | 'uiState'
> {
  const active = activeAccounts(accounts);
  const selected =
    (selectedCheckoutId
      ? active.find((a) => a.id === selectedCheckoutId)
      : null) ?? defaultAccount(accounts);
  const details = selected ? accountToGstDetails(selected) : null;
  return {
    details,
    gstNumber: details?.gstNumber ?? null,
    businessName: details?.businessName ?? null,
    businessAddress: details?.registeredAddress ?? null,
    verified: Boolean(details && details.status === 'verified'),
    uiState: uiStateFromAccounts(accounts),
  };
}

function syncUserFromAccount(account: GstAccount | null) {
  if (!account) {
    useUserStore.getState().updateUser({
      gstNumber: '',
      pan: '',
      jurisdiction: '',
      gstVerifiedAt: '',
      complianceScore: 0,
    });
    return;
  }
  const details = accountToGstDetails(account);
  useUserStore.getState().updateUser({
    gstNumber: details.gstNumber,
    company: details.businessName || useUserStore.getState().user.company,
    pan: details.pan,
    jurisdiction: details.state,
    registeredAddress:
      details.registeredAddress || useUserStore.getState().user.registeredAddress,
    businessType: details.businessType || useUserStore.getState().user.businessType,
    gstVerifiedAt: details.updatedAt
      ? new Date(details.updatedAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
    complianceScore: details.status === 'verified' ? 100 : 0,
  });
}

export const useGstStore = create<GstState>((set, get) => ({
  ...initialState,

  loadAccounts: async () => {
    set({ isLoading: true, loading: true, uiState: 'LOADING' });
    try {
      const accounts = await listGstAccounts();
      const selectedId = get().selectedCheckoutGstAccountId;
      const active = activeAccounts(accounts);
      const stillValid = selectedId && active.some((a) => a.id === selectedId);
      const nextSelected = stillValid ? selectedId : null;
      set({
        accounts,
        selectedCheckoutGstAccountId: nextSelected,
        ...mapPrimaryDetails(accounts, nextSelected),
        isLoading: false,
        loading: false,
        validationError: null,
      });
      syncUserFromAccount(defaultAccount(accounts));
    } catch {
      set({ isLoading: false, loading: false, uiState: 'NOT_ADDED' });
    }
  },

  fetchGST: async () => {
    await get().loadAccounts();
  },

  loadGst: async () => {
    await get().loadAccounts();
  },

  verifyGstin: async (gstin) => {
    set({ uiState: 'VERIFYING', validationError: null });
    try {
      const data: GstVerificationResult = await verifyGstinApi(gstin);
      const mapped = verificationToValidationResult(data);
      if (!mapped.verified) {
        const message = 'GSTIN could not be verified. Check the number and try again.';
        set({ uiState: 'FAILED', validationError: message });
        throw new Error(message);
      }
      set({ uiState: 'VERIFYING', validationError: null });
      return mapped;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to verify GST. Please try again.');
      set({ uiState: 'FAILED', validationError: message });
      throw error;
    }
  },

  createFromVerification: async (result, opts) => {
    if (!result.verificationToken) {
      throw new Error('Verification token missing');
    }
    set({ isLoading: true, loading: true, uiState: 'LOADING' });
    try {
      const account = await createGstAccount({
        gstin: result.gstNumber,
        verificationToken: result.verificationToken,
        setAsDefault: opts?.setAsDefault,
      });
      const accounts = await listGstAccounts();
      const selectForCheckout = opts?.selectForCheckout !== false;
      const selectedId = selectForCheckout ? account.id : get().selectedCheckoutGstAccountId;
      set({
        accounts,
        selectedCheckoutGstAccountId: selectedId,
        ...mapPrimaryDetails(accounts, selectedId),
        isLoading: false,
        loading: false,
        validationError: null,
      });
      syncUserFromAccount(defaultAccount(accounts));
      return account;
    } catch (error) {
      set({
        isLoading: false,
        loading: false,
        uiState: 'FAILED',
        validationError: getApiErrorMessage(error, 'Failed to save GST account'),
      });
      throw error;
    }
  },

  setDefaultAccount: async (id) => {
    set({ loading: true });
    try {
      await setDefaultGstAccount(id);
      await get().loadAccounts();
    } finally {
      set({ loading: false });
    }
  },

  archiveAccount: async (id) => {
    set({ loading: true });
    try {
      await archiveGstAccount(id);
      const wasSelected = get().selectedCheckoutGstAccountId === id;
      if (wasSelected) {
        set({ selectedCheckoutGstAccountId: null, checkoutInvoiceEnabled: false });
      }
      await get().loadAccounts();
    } finally {
      set({ loading: false });
    }
  },

  selectCheckoutAccount: (id) => {
    set({
      selectedCheckoutGstAccountId: id,
      ...mapPrimaryDetails(get().accounts, id),
    });
  },

  getCheckoutAccount: () => {
    const { accounts, selectedCheckoutGstAccountId } = get();
    const active = activeAccounts(accounts);
    if (!selectedCheckoutGstAccountId) return null;
    return active.find((a) => a.id === selectedCheckoutGstAccountId) ?? null;
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
    set({ ...mapPrimaryDetails(get().accounts, get().selectedCheckoutGstAccountId), validationError: null });
    void details;
  },

  saveGstDetails: async (result) => {
    const account = await get().createFromVerification(result, {
      setAsDefault: get().accounts.length === 0,
      selectForCheckout: true,
    });
    return account;
  },

  saveGST: async (result) => {
    await get().saveGstDetails(result);
  },

  updateGST: async (result) => {
    await get().createFromVerification(result, { setAsDefault: true });
  },

  updateGstDetails: async (result) => {
    await get().saveGstDetails(result);
  },

  removeGST: async (accountId) => {
    set({ isLoading: true, loading: true, uiState: 'LOADING' });
    try {
      const id =
        accountId ??
        get().details?.id ??
        defaultAccount(get().accounts)?.id;
      if (id) await archiveGstAccount(id);
      set({
        ...initialState,
        accounts: [],
      });
      syncUserFromAccount(null);
    } finally {
      set({ isLoading: false, loading: false });
      await get().loadAccounts();
    }
  },

  removeGst: async (accountId) => {
    await get().removeGST(accountId);
  },

  setUiState: (uiState) => set({ uiState }),

  setVerifying: () => set({ uiState: 'VERIFYING', validationError: null }),

  setValidationFailed: (message) =>
    set({ uiState: 'FAILED', validationError: message ?? 'Invalid GST Number' }),

  triggerSuccessBanner: () => set({ showSuccessBanner: true }),

  dismissSuccessBanner: () => set({ showSuccessBanner: false }),

  setCheckoutInvoiceEnabled: (enabled) => {
    set({ checkoutInvoiceEnabled: enabled });
    if (!enabled) return;
    const account = get().getCheckoutAccount();
    if (account) {
      set(mapPrimaryDetails(get().accounts, account.id));
    }
  },

  setFromProfile: (details) => {
    if (!details) {
      set({ ...mapPrimaryDetails(get().accounts, null), isLoading: false, loading: false });
      return;
    }
    set({
      details,
      gstNumber: details.gstNumber,
      businessName: details.businessName,
      businessAddress: details.registeredAddress,
      verified: details.status === 'verified',
      isLoading: false,
      loading: false,
      validationError: null,
    });
  },

  reset: () => set(initialState),
}));
