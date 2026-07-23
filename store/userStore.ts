import { create } from 'zustand';

import type { CustomerProfile } from '@services/customer.api';

export type MemberTier = 'platinum' | 'gold' | 'silver';

export interface User {
  name: string;
  company: string;
  phone: string;
  email: string;
  gstNumber: string;
  avatar: string | null;
  memberTier: MemberTier;
  businessType: string;
  procurement: string;
  city: string;
  establishmentDate: string;
  registeredAddress: string;
  legalEntityName: string;
  pan: string;
  jurisdiction: string;
  gstVerifiedAt: string;
  complianceScore: number;
}

/** Empty guest-mode user — never hardcode demo/placeholder identities here. */
const EMPTY_USER: User = {
  name: '',
  company: '',
  phone: '',
  email: '',
  gstNumber: '',
  avatar: null,
  memberTier: 'silver',
  businessType: '',
  procurement: '',
  city: '',
  establishmentDate: '',
  registeredAddress: '',
  legalEntityName: '',
  pan: '',
  jurisdiction: '',
  gstVerifiedAt: '',
  complianceScore: 0,
};

/**
 * Maps a backend membership/plan label to the app's 3-tier badge system.
 * PLATINUM/platinum → platinum, GOLD/gold → gold, "Enterprise" → platinum, else silver.
 */
export function mapMembershipToTier(input?: string | null): MemberTier {
  const normalized = (input ?? '').trim().toLowerCase();
  if (normalized === 'platinum' || normalized === 'enterprise') return 'platinum';
  if (normalized === 'gold') return 'gold';
  return 'silver';
}

/** Maps an enriched `/customer/profile` response onto the local `User` shape. */
export function mapProfileToUser(profile: CustomerProfile): User {
  const membershipLabel =
    (typeof profile.membership === 'string' ? profile.membership : undefined) ??
    profile.membershipDetails?.plan ??
    profile.membershipDetails?.tier ??
    profile.membershipDetails?.name;

  const gstObj =
    profile.gst && typeof profile.gst === 'object'
      ? (profile.gst as {
          gstin?: string | null;
          verified?: boolean;
          verifiedAt?: string | null;
          jurisdiction?: string | null;
          pan?: string | null;
          companyName?: string | null;
        })
      : null;

  return {
    name: profile.name ?? profile.fullName ?? '',
    company: profile.companyName ?? gstObj?.companyName ?? '',
    phone: profile.phone ?? profile.mobile ?? '',
    email: profile.email ?? '',
    gstNumber:
      profile.gstNumber ??
      (typeof profile.gst === 'string' ? profile.gst : undefined) ??
      gstObj?.gstin ??
      '',
    avatar: profile.profileImage ?? null,
    memberTier: mapMembershipToTier(
      typeof membershipLabel === 'string' ? membershipLabel : undefined,
    ),
    businessType: (profile.businessType as string | undefined) ?? '',
    procurement: '',
    city: '',
    establishmentDate: profile.establishmentDate ?? '',
    registeredAddress: profile.registeredAddress ?? '',
    legalEntityName: profile.legalEntityName ?? gstObj?.companyName ?? '',
    pan: gstObj?.pan ?? (profile.panNumber as string | undefined) ?? '',
    jurisdiction: gstObj?.jurisdiction ?? '',
    gstVerifiedAt: gstObj?.verifiedAt
      ? new Date(gstObj.verifiedAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
    complianceScore: gstObj?.verified ? 100 : 0,
  };
}

interface UserState {
  user: User;
  updateUser: (partial: Partial<User>) => void;
  setAvatar: (uri: string) => void;
  setFromProfile: (profile: CustomerProfile) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: EMPTY_USER,
  updateUser: (partial) => set((state) => ({ user: { ...state.user, ...partial } })),
  setAvatar: (uri) => set((state) => ({ user: { ...state.user, avatar: uri } })),
  setFromProfile: (profile) => set({ user: mapProfileToUser(profile) }),
  reset: () => set({ user: EMPTY_USER }),
}));

export { EMPTY_USER };
