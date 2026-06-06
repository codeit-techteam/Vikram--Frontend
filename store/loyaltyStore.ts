import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { create } from 'zustand';

import { buildLoyaltyStatementHtml } from '@utils/loyaltyStatementHtml';

export type LoyaltyTier = 'silver' | 'gold' | 'platinum' | 'diamond';
export type ActivityStatus = 'PENDING' | 'COMPLETED';
export type ActivityValueType = 'cp' | 'inr';

export interface ActivityItem {
  id: string;
  icon: string;
  title: string;
  time: string;
  points: number;
  status: ActivityStatus;
  isCredit: boolean;
  valueType?: ActivityValueType;
  timestamp: number;
}

const INITIAL_ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    icon: 'bag-handle-outline',
    title: 'Order: TMT Steel-500',
    time: 'Today, 10:45 AM',
    points: 1240,
    status: 'PENDING',
    isCredit: true,
    valueType: 'cp',
    timestamp: Date.now(),
  },
  {
    id: 'a2',
    icon: 'card-outline',
    title: 'Fuel Voucher Redeemed',
    time: 'Yesterday, 4:20 PM',
    points: -12000,
    status: 'COMPLETED',
    isCredit: false,
    valueType: 'cp',
    timestamp: Date.now() - 86_400_000,
  },
  {
    id: 'a3',
    icon: 'cash-outline',
    title: 'Cashback Credited',
    time: '24 May, 2024',
    points: 450,
    status: 'COMPLETED',
    isCredit: true,
    valueType: 'inr',
    timestamp: new Date('2024-05-24').getTime(),
  },
];

interface LoyaltyState {
  totalPoints: number;
  cashbackEarned: number;
  tier: LoyaltyTier;
  progressPercent: number;
  spendToNextTier: string;
  totalSpend: string;
  nextTier: string;
  progressTierLabel: string;
  activityHistory: ActivityItem[];
  addPoints: (pts: number) => void;
  deductPoints: (pts: number) => void;
  addActivityHistory: (item: Omit<ActivityItem, 'timestamp'> & { timestamp?: number }) => void;
  downloadStatement: () => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE = {
  totalPoints: 42_500,
  cashbackEarned: 8_450,
  tier: 'platinum' as LoyaltyTier,
  progressPercent: 75,
  spendToNextTier: '₹1.2L',
  totalSpend: '₹8.8L',
  nextTier: 'Diamond',
  progressTierLabel: 'GOLD',
  activityHistory: [...INITIAL_ACTIVITY].sort((a, b) => b.timestamp - a.timestamp),
};

export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  ...INITIAL_STATE,

  addPoints: (pts) =>
    set((state) => ({
      totalPoints: state.totalPoints + pts,
    })),

  deductPoints: (pts) =>
    set((state) => ({
      totalPoints: Math.max(0, state.totalPoints - pts),
    })),

  addActivityHistory: (item) =>
    set((state) => {
      const entry: ActivityItem = {
        ...item,
        timestamp: item.timestamp ?? Date.now(),
      };
      const activityHistory = [entry, ...state.activityHistory].sort(
        (a, b) => b.timestamp - a.timestamp,
      );
      return { activityHistory };
    }),

  downloadStatement: async () => {
    const { totalPoints, cashbackEarned, tier, activityHistory } = get();
    const html = buildLoyaltyStatementHtml({
      totalPoints,
      cashbackEarned,
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

  reset: () => set({ ...INITIAL_STATE, activityHistory: [...INITIAL_ACTIVITY] }),
}));
