import { create } from 'zustand';

import {
  getPlanById,
  type MembershipPlanId,
} from '@constants/membership';

/**
 * Frontend membership status — mirrors future API fields:
 * membershipStatus, expiryDate, renewalDate, cashbackEarned,
 * rewardPoints, freeDeliveriesUsed, membershipPlan
 */
export interface MembershipStatus {
  isMember: boolean;
  plan: MembershipPlanId | null;
  expiry: string | null;
  memberSince: string | null;
  renewalDate: string | null;
  cashbackEarned: number;
  rewardPoints: number;
  freeDeliveriesUsed: number;
}

interface MembershipState extends MembershipStatus {
  /** Join a plan locally (no payment / backend yet). */
  joinPlan: (planId: MembershipPlanId) => void;
  /** Clear local membership (manage / cancel mock). */
  clearMembership: () => void;
  /** Hydrate from future API response. */
  hydrateFromApi: (payload: Partial<MembershipStatus>) => void;
}

function addOneYearIso(from = new Date()): string {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

const INITIAL: MembershipStatus = {
  isMember: false,
  plan: null,
  expiry: null,
  memberSince: null,
  renewalDate: null,
  cashbackEarned: 0,
  rewardPoints: 0,
  freeDeliveriesUsed: 0,
};

export const useMembershipStore = create<MembershipState>((set) => ({
  ...INITIAL,

  joinPlan: (planId) => {
    const plan = getPlanById(planId);
    if (!plan) return;
    const now = new Date();
    const expiry = addOneYearIso(now);
    set({
      isMember: true,
      plan: planId,
      memberSince: now.toISOString(),
      expiry,
      renewalDate: expiry,
    });
  },

  clearMembership: () => set({ ...INITIAL }),

  hydrateFromApi: (payload) =>
    set((state) => ({
      ...state,
      ...payload,
      isMember: payload.isMember ?? Boolean(payload.plan),
    })),
}));
