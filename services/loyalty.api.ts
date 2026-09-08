import { AUTH_TOKEN_KEY, api } from '@services/api';
import { storage } from '@lib/storage';
import type { ApiResponse } from '@/types';

export interface LoyaltySummary {
  id: string;
  customerId: string;
  currentPoints: number;
  lifetimeEarned: number;
  redeemedPoints: number;
  lifetimeRedeemed: number;
  availablePoints: number;
  availableValue: number;
  redeemablePoints: number;
  nextExpiry?: string | null;
  minRedeemOrderValue: number;
  pointValueInr: number;
  maxOrderRedeemPercent: number;
  welcomeBonus: number;
  firstOrderBonus: number;
  earnCashbackPercent: number;
  earnPointsPer100Inr: number;
  freeBikeDeliveriesAllowed: number;
  freeBikeDeliveriesUsed: number;
  freeBikeDeliveriesRemaining: number;
}

export interface LoyaltyTransaction {
  id: string;
  points: number;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADMIN' | 'ADJUSTMENT';
  reason: string;
  referenceId?: string | null;
  referenceOrderId?: string | null;
  openingPoints?: number | null;
  closingPoints?: number | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface LoyaltyHistory {
  account: LoyaltySummary;
  transactions: LoyaltyTransaction[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const LOYALTY_BASE = '/customer/loyalty';

async function hasSessionToken(): Promise<boolean> {
  const token = await storage.getItem(AUTH_TOKEN_KEY);
  return Boolean(token?.trim());
}

export async function fetchLoyaltySummary(): Promise<LoyaltySummary | null> {
  if (!(await hasSessionToken())) return null;

  const { data } = await api.get<ApiResponse<LoyaltySummary>>(LOYALTY_BASE);
  return data.data;
}

export async function fetchLoyaltyHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<LoyaltyHistory | null> {
  if (!(await hasSessionToken())) return null;

  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const { data } = await api.get<ApiResponse<LoyaltyHistory>>(
    `${LOYALTY_BASE}/history${qs ? `?${qs}` : ''}`,
  );
  return data.data;
}
