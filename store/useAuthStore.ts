import { create } from 'zustand';

import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@services/api';
import * as authApi from '@services/auth.api';
import type { AuthCustomer } from '@services/auth.api';
import { getProfile } from '@services/customer.api';
import { GUEST_MODE_KEY } from '@constants/guest';
import { storage } from '@lib/storage';
import { useDeliveryStore } from '@store/deliveryStore';
import { useGstStore } from '@store/gstStore';
import { useUserStore } from '@store/userStore';
import type { GstDetails } from '@/types/gst';

export type UserRole =
  | 'individual'
  | 'contractor'
  | 'interior_designer'
  | 'builder_developer';

export interface Language {
  id: string;
  name: string;
  nativeName: string;
  recommended?: boolean;
}

export const LANGUAGES: Language[] = [
  { id: 'en', name: 'English', nativeName: 'English' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', recommended: true },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { id: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { id: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { id: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
];

export interface SessionCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  membership: string;
  profileImage: string | null;
  companyName: string;
  isNewCustomer?: boolean;
  roleSelected?: boolean;
  profileCompleted?: boolean;
}

function toSessionCustomer(customer: AuthCustomer, isNewCustomer?: boolean): SessionCustomer {
  const nestedProfile =
    customer.profile && typeof customer.profile === 'object'
      ? (customer.profile as { companyName?: string | null; profileImage?: string | null })
      : null;

  return {
    id: customer.id,
    name: customer.name ?? customer.fullName ?? '',
    phone: customer.phone ?? customer.mobile ?? '',
    email: customer.email ?? '',
    membership: typeof customer.membership === 'string' ? customer.membership : '',
    profileImage: customer.profileImage ?? nestedProfile?.profileImage ?? null,
    companyName: customer.companyName ?? nestedProfile?.companyName ?? '',
    isNewCustomer,
    roleSelected: customer.roleSelected,
    profileCompleted: customer.profileCompleted,
  };
}

interface SetSessionInput {
  accessToken: string;
  refreshToken: string;
  customer: AuthCustomer;
  isNewCustomer?: boolean;
}

interface AuthState {
  // Onboarding / OTP-flow fields (kept from legacy store)
  phoneNumber: string;
  selectedRole: UserRole | null;
  companyName: string;
  gstNumber: string;
  selectedLanguage: string;

  // Session state
  isLoggedIn: boolean;
  isGuest: boolean;
  isHydrated: boolean;
  loading: boolean;
  token: string | null;
  refreshToken: string | null;
  customer: SessionCustomer | null;

  // Login-required UX
  pendingAction: (() => void) | null;
  loginSheetVisible: boolean;

  setPhoneNumber: (phone: string) => void;
  setSelectedRole: (role: UserRole) => void;
  setCompanyName: (name: string) => void;
  setGstNumber: (gst: string) => void;
  setSelectedLanguage: (lang: string) => void;

  enterGuestMode: () => Promise<void>;
  clearGuestMode: () => Promise<void>;
  hydrateGuestMode: () => Promise<void>;

  setSession: (input: SetSessionInput) => Promise<void>;
  hydrateSession: () => Promise<void>;
  loginWithOtp: (mobile: string, otp: string) => Promise<SessionCustomer>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  handleSessionExpired: () => Promise<void>;

  requireLogin: (pendingAction?: () => void) => boolean;
  showLoginSheet: () => void;
  hideLoginSheet: () => void;
  consumePendingAction: () => void;

  reset: () => void;
}

const initialState = {
  phoneNumber: '',
  selectedRole: null as UserRole | null,
  companyName: '',
  gstNumber: '',
  selectedLanguage: 'hi',

  isLoggedIn: false,
  isGuest: false,
  isHydrated: false,
  loading: false,
  token: null as string | null,
  refreshToken: null as string | null,
  customer: null as SessionCustomer | null,

  pendingAction: null as (() => void) | null,
  loginSheetVisible: false,
};

let hydrateInFlight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  setPhoneNumber: (phone) => set({ phoneNumber: phone }),
  setSelectedRole: (role) => set({ selectedRole: role }),
  setCompanyName: (name) => set({ companyName: name }),
  setGstNumber: (gst) => set({ gstNumber: gst }),
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),

  enterGuestMode: async () => {
    await storage.setItem(GUEST_MODE_KEY, 'true');
    set({ isGuest: true, isLoggedIn: false });
  },

  clearGuestMode: async () => {
    await storage.removeItem(GUEST_MODE_KEY);
    set({ isGuest: false });
  },

  hydrateGuestMode: async () => {
    const flag = await storage.getItem(GUEST_MODE_KEY);
    set({ isGuest: flag === 'true' });
  },

  setSession: async ({ accessToken, refreshToken, customer, isNewCustomer }) => {
    await Promise.all([
      storage.setItem(AUTH_TOKEN_KEY, accessToken),
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken),
      storage.removeItem(GUEST_MODE_KEY),
    ]);

    set({
      token: accessToken,
      refreshToken,
      customer: toSessionCustomer(customer, isNewCustomer),
      isLoggedIn: true,
      isGuest: false,
    });
  },

  hydrateSession: async () => {
    if (get().isHydrated) return;
    if (hydrateInFlight) return hydrateInFlight;

    hydrateInFlight = (async () => {
      set({ loading: true });

      try {
        const [token, refreshTokenValue, guestFlag] = await Promise.all([
          storage.getItem(AUTH_TOKEN_KEY),
          storage.getItem(REFRESH_TOKEN_KEY),
          storage.getItem(GUEST_MODE_KEY),
        ]);

        if (!token) {
          set({
            isLoggedIn: false,
            isGuest: guestFlag === 'true',
            token: null,
            refreshToken: null,
            customer: null,
          });
          return;
        }

        set({ token, refreshToken: refreshTokenValue, isLoggedIn: true, isGuest: false });
        await storage.removeItem(GUEST_MODE_KEY);

        try {
          const me = await authApi.getMe();
          set({ customer: toSessionCustomer(me) });
          await get().refreshProfile();
        } catch {
          // getMe/refreshProfile failures already trigger the 401 → refresh → guest
          // fallback inside the api interceptor when the token is truly invalid.
        }
      } finally {
        set({ loading: false, isHydrated: true });
      }
    })();

    try {
      await hydrateInFlight;
    } finally {
      hydrateInFlight = null;
    }
  },

  loginWithOtp: async (mobile, otp) => {
    set({ loading: true });
    try {
      const session = await authApi.verifyOtp(mobile, otp);
      await get().setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        customer: session.customer,
        isNewCustomer: session.isNewCustomer,
      });
      await get().clearGuestMode();
      await get().refreshProfile();
      return get().customer as SessionCustomer;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    set({ loading: true });

    try {
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => undefined);
      }
    } finally {
      await Promise.all([
        storage.removeItem(AUTH_TOKEN_KEY),
        storage.removeItem(REFRESH_TOKEN_KEY),
      ]);

      useUserStore.getState().reset();
      useDeliveryStore.getState().reset();

      set({
        ...initialState,
        isHydrated: true,
      });

      // "Return to Guest Mode" after logout, per product requirement.
      await get().enterGuestMode();
    }
  },

  refreshProfile: async () => {
    try {
      const profile = await getProfile();
      useUserStore.getState().setFromProfile(profile);

      if (profile.addresses) {
        useDeliveryStore.getState().setProfileSitesFromAddresses(profile.addresses);
        // Keep checkout site picker in sync with saved delivery sites.
        const sites = profile.addresses.map((a) => ({
          id: a.id,
          name: a.label ?? a.name ?? 'Site',
          address: [a.address ?? a.addressLine1, a.city, a.pincode ?? a.postalCode]
            .filter(Boolean)
            .join(', '),
        }));
        if (sites.length > 0) {
          useDeliveryStore.setState((state) => ({
            sites,
            selectedSiteId: state.selectedSiteId ?? sites[0]?.id ?? null,
          }));
        }
      }

      const gstObj =
        profile.gst && typeof profile.gst === 'object' ? profile.gst : null;
      const gstin =
        profile.gstNumber ??
        (typeof profile.gst === 'string' ? profile.gst : undefined) ??
        gstObj?.gstin ??
        null;

      if (gstin) {
        const details: GstDetails = {
          gstNumber: gstin,
          businessName:
            gstObj?.companyName ??
            profile.legalEntityName ??
            profile.companyName ??
            '',
          registeredAddress: profile.registeredAddress ?? '',
          state: gstObj?.jurisdiction?.split('–')[0]?.trim() ?? '',
          pan: gstObj?.pan ?? profile.panNumber ?? '',
          status: gstObj?.verified ? 'verified' : 'pending',
        };
        useGstStore.getState().setFromProfile(details);
      } else {
        useGstStore.getState().setFromProfile(null);
      }

      set((state) => ({
        customer: state.customer
          ? {
              ...state.customer,
              name: profile.name ?? profile.fullName ?? state.customer.name,
              phone: profile.phone ?? profile.mobile ?? state.customer.phone,
              email: profile.email ?? state.customer.email,
              companyName: profile.companyName ?? state.customer.companyName,
              membership:
                (typeof profile.membership === 'string' ? profile.membership : undefined) ??
                state.customer.membership,
              profileImage: profile.profileImage ?? state.customer.profileImage,
              profileCompleted: profile.profileCompleted ?? state.customer.profileCompleted,
              roleSelected: profile.roleSelected ?? state.customer.roleSelected,
            }
          : state.customer,
      }));
    } catch {
      // Non-fatal — screens fall back to whatever is already in userStore/customer.
    }
  },

  handleSessionExpired: async () => {
    useUserStore.getState().reset();
    useDeliveryStore.getState().reset();
    set({
      ...initialState,
      isHydrated: true,
    });
    await get().enterGuestMode();
  },

  requireLogin: (pendingAction) => {
    const { isLoggedIn } = get();
    if (isLoggedIn) return true;

    set({ pendingAction: pendingAction ?? null, loginSheetVisible: true });
    return false;
  },

  showLoginSheet: () => set({ loginSheetVisible: true }),
  hideLoginSheet: () => set({ loginSheetVisible: false }),

  consumePendingAction: () => {
    const { pendingAction } = get();
    set({ pendingAction: null, loginSheetVisible: false });
    if (pendingAction) pendingAction();
  },

  reset: () => {
    void storage.removeItem(GUEST_MODE_KEY);
    set(initialState);
  },
}));
