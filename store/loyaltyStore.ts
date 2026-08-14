import { create } from 'zustand';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import {
  fetchLoyaltyHistory,
  fetchLoyaltySummary,
  type LoyaltySummary,
  type LoyaltyTransaction,
} from '@services/loyalty.api';
import { buildLoyaltyStatementHtml } from '@utils/loyaltyStatementHtml';

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type ActivityStatus = 'PENDING' | 'COMPLETED';
export type ActivityValueType = 'cp' | 'inr';

export interface ActivityItem {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  time: string;
  points: number;
  status: ActivityStatus;
  isCredit: boolean;
  valueType?: ActivityValueType;
  timestamp: number;
}

interface LoyaltyState {
  summary: LoyaltySummary | null;
  totalPoints: number;
  availableValue: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: LoyaltyTier;
  progressPercent: number;
  pointsToNextTier: number;
  nextTier: string;
  progressTierLabel: string;
  freeBikeDeliveriesRemaining: number;
  freeBikeDeliveriesUsed: number;
  freeBikeDeliveriesAllowed: number;
  activityHistory: ActivityItem[];
  historyMeta: { page: number; totalPages: number; total: number } | null;
  loading: boolean;
  historyLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadHistory: (page?: number, append?: boolean) => Promise<void>;
  downloadStatement: () => Promise<void>;
  reset: () => void;
}

function mapTransactionTitle(tx: LoyaltyTransaction): {
  title: string;
  subtitle?: string;
  icon: string;
} {
  const ref = tx.referenceId ?? '';
  const reason = tx.reason ?? '';

  if (ref.startsWith('SEED_LOYALTY') || /dev only/i.test(reason)) {
    return {
      title: 'Opening Balance',
      subtitle: 'BajriPro Points wallet balance',
      icon: 'wallet-outline',
    };
  }
  if (ref === 'FIRST_ORDER_BONUS') {
    return {
      title: 'First Order Bonus',
      subtitle: tx.reason,
      icon: 'trophy-outline',
    };
  }
  if (ref === 'WELCOME_BONUS') {
    return {
      title: 'Welcome Bonus',
      subtitle: 'Registration BajriPro Points',
      icon: 'gift-outline',
    };
  }
  if (ref.startsWith('ORDER_EARNED:')) {
    return {
      title: tx.reason || 'Points earned on order',
      icon: 'bag-handle-outline',
    };
  }
  if (ref.startsWith('REDEEM:') || tx.type === 'REDEEM') {
    return {
      title: tx.reason || 'BajriPro Points used on order',
      icon: 'card-outline',
    };
  }
  if (ref.includes('REVERSAL') || ref.includes('REFUND')) {
    return {
      title: tx.reason || 'Points restored',
      icon: 'refresh-outline',
    };
  }
  return {
    title: tx.reason || 'BajriPro Points update',
    icon: 'star-outline',
  };
}

function mapTransaction(tx: LoyaltyTransaction): ActivityItem {
  const isReversal = (tx.referenceId ?? '').includes('REVERSAL');
  const isCredit =
    !isReversal &&
    (tx.type === 'EARN' ||
      tx.type === 'ADMIN' ||
      (tx.type === 'ADJUSTMENT' &&
        !tx.reason.toLowerCase().includes('reversal')));

  const signedPoints =
    tx.type === 'REDEEM' || isReversal || tx.reason.toLowerCase().includes('reversal')
      ? -Math.abs(tx.points)
      : isCredit
        ? Math.abs(tx.points)
        : -Math.abs(tx.points);

  const mapped = mapTransactionTitle(tx);

  return {
    id: tx.id,
    icon: mapped.icon,
    title: mapped.title,
    subtitle: mapped.subtitle,
    time: new Date(tx.createdAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    points: signedPoints,
    status: 'COMPLETED',
    isCredit: signedPoints > 0,
    valueType: 'cp',
    timestamp: new Date(tx.createdAt).getTime(),
  };
}

function applySummary(summary: LoyaltySummary) {
  return {
    summary,
    totalPoints: summary.availablePoints,
    availableValue: summary.availableValue,
    lifetimeEarned: summary.lifetimeEarned,
    lifetimeRedeemed: summary.lifetimeRedeemed,
    tier: summary.tier,
    progressPercent: summary.tierProgress,
    pointsToNextTier: summary.pointsToNextTier,
    nextTier: summary.nextTier ?? '',
    progressTierLabel: summary.tier,
    freeBikeDeliveriesRemaining: summary.freeBikeDeliveriesRemaining ?? 0,
    freeBikeDeliveriesUsed: summary.freeBikeDeliveriesUsed ?? 0,
    freeBikeDeliveriesAllowed: summary.freeBikeDeliveriesAllowed ?? 3,
  };
}

const INITIAL_STATE = {
  summary: null as LoyaltySummary | null,
  totalPoints: 0,
  availableValue: 0,
  lifetimeEarned: 0,
  lifetimeRedeemed: 0,
  tier: 'BRONZE' as LoyaltyTier,
  progressPercent: 0,
  pointsToNextTier: 0,
  nextTier: '',
  progressTierLabel: 'BRONZE',
  freeBikeDeliveriesRemaining: 0,
  freeBikeDeliveriesUsed: 0,
  freeBikeDeliveriesAllowed: 3,
  activityHistory: [] as ActivityItem[],
  historyMeta: null as LoyaltyState['historyMeta'],
  loading: false,
  historyLoading: false,
  error: null as string | null,
};

export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  ...INITIAL_STATE,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const summary = await fetchLoyaltySummary();
      set({
        ...applySummary(summary),
        loading: false,
        error: null,
      });
    } catch (e) {
      set({
        loading: false,
        error:
          e instanceof Error ? e.message : 'Unable to load loyalty balance',
      });
    }
  },

  loadHistory: async (page = 1, append = false) => {
    set({ historyLoading: true });
    try {
      const history = await fetchLoyaltyHistory({ page, limit: 20 });
      const mapped = history.transactions.map(mapTransaction);
      set({
        ...applySummary(history.account),
        activityHistory: append
          ? [...get().activityHistory, ...mapped]
          : mapped,
        historyMeta: history.meta
          ? {
              page: history.meta.page,
              totalPages: history.meta.totalPages,
              total: history.meta.total,
            }
          : null,
        historyLoading: false,
        error: null,
      });
    } catch (e) {
      set({
        historyLoading: false,
        error:
          e instanceof Error ? e.message : 'Unable to load loyalty history',
      });
    }
  },

  downloadStatement: async () => {
    const { totalPoints, availableValue, tier, activityHistory } = get();
    const html = buildLoyaltyStatementHtml({
      totalPoints,
      cashbackEarned: availableValue,
      tier,
      activityHistory,
    });
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Loyalty Statement',
      });
    }
  },

  reset: () => set({ ...INITIAL_STATE }),
}));
