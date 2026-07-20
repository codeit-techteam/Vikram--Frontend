import { create } from 'zustand';

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

const DEFAULT_USER: User = {
  name: 'Karan Singh',
  company: 'Premier Construction Ltd.',
  phone: '+91 98765 43210',
  email: 'karan@premierbuild.in',
  gstNumber: '27AAACR1234F1Z5',
  avatar: null,
  memberTier: 'platinum',
  businessType: 'Construction Co.',
  procurement: '₹50L - ₹1Cr',
  city: 'Mumbai',
  establishmentDate: '12 May 2012',
  registeredAddress: 'Level 5, Sky Tower, BKC G-Block, Mumbai 400051',
  legalEntityName: 'Premier Construction Private Limited',
  pan: 'ABCDE1234F',
  jurisdiction: 'Maharashtra – Ward 12A',
  gstVerifiedAt: '12 Oct 2023, 11:45 AM',
  complianceScore: 100,
};

interface UserState {
  user: User;
  updateUser: (partial: Partial<User>) => void;
  setAvatar: (uri: string) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: DEFAULT_USER,
  updateUser: (partial) => set((state) => ({ user: { ...state.user, ...partial } })),
  setAvatar: (uri) => set((state) => ({ user: { ...state.user, avatar: uri } })),
  reset: () => set({ user: DEFAULT_USER }),
}));
