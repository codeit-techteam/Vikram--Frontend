import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Brand copy — switch PLUS ↔ PRIME without touching UI. */
export const MEMBERSHIP_BRAND = {
  /** Display name on banner & screens */
  name: 'BAJRIWALA PLUS' as 'BAJRIWALA PLUS' | 'BAJRIWALA PRIME',
  shortName: 'Bajriwala Plus',
  /** Inactive banner subtitle */
  subtitle: 'Save more on every construction purchase',
  /** Alternate subtitle (swap if preferred) */
  subtitleAlt: 'Free Delivery • Priority Service • Exclusive Prices',
} as const;

export type MembershipPlanId = 'starter' | 'professional' | 'builder_plus';

export interface MembershipPlanDefinition {
  id: MembershipPlanId;
  name: string;
  annualPrice: number;
  monthlyPrice: number;
  savingsPercent: number;
  currency: 'INR';
  benefits: string[];
  popular?: boolean;
}

export interface MembershipBenefitItem {
  id: string;
  label: string;
  icon: IconName;
}

export interface MembershipFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface MembershipHowItWorksStep {
  id: string;
  label: string;
}

/**
 * Static plan catalogue — replace with `membershipPlan` API payload later.
 * Shape mirrors future backend contract.
 */
export const MEMBERSHIP_PLANS: MembershipPlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    annualPrice: 499,
    monthlyPrice: 42,
    savingsPercent: 12,
    currency: 'INR',
    benefits: [
      'Free Delivery above ₹2,000',
      'Priority Support',
      '2% Cashback',
      'Basic Rewards',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    annualPrice: 999,
    monthlyPrice: 83,
    savingsPercent: 22,
    currency: 'INR',
    benefits: [
      'Unlimited Free Delivery',
      '5% Cashback',
      'Priority Delivery',
      'Exclusive Prices',
      'Dedicated Support',
    ],
    popular: true,
  },
  {
    id: 'builder_plus',
    name: 'Builder Plus',
    annualPrice: 2499,
    monthlyPrice: 208,
    savingsPercent: 35,
    currency: 'INR',
    benefits: [
      'Unlimited Free Delivery',
      '8% Cashback',
      'Bulk Order Discounts',
      'Credit Benefits',
      'Dedicated Relationship Manager',
      'Early Access to Offers',
      'VIP Support',
    ],
  },
];

export const MEMBERSHIP_BENEFITS: MembershipBenefitItem[] = [
  { id: 'free_delivery', label: 'Free Delivery', icon: 'bicycle-outline' },
  { id: 'cashback', label: 'Cashback', icon: 'cash-outline' },
  { id: 'reward_points', label: 'Reward Points', icon: 'star-outline' },
  { id: 'priority_delivery', label: 'Priority Delivery', icon: 'flash-outline' },
  { id: 'exclusive_offers', label: 'Exclusive Offers', icon: 'gift-outline' },
  { id: 'bulk_discounts', label: 'Bulk Discounts', icon: 'layers-outline' },
  { id: 'fast_support', label: 'Fast Support', icon: 'headset-outline' },
  { id: 'gst_billing', label: 'GST Friendly Billing', icon: 'document-text-outline' },
];

export const MEMBERSHIP_HOW_IT_WORKS: MembershipHowItWorksStep[] = [
  { id: 'choose', label: 'Choose Plan' },
  { id: 'purchase', label: 'Purchase Membership' },
  { id: 'activate', label: 'Benefits Activated' },
  { id: 'save', label: 'Save On Every Order' },
];

export const MEMBERSHIP_FAQS: MembershipFaqItem[] = [
  {
    id: 'what',
    question: 'What is Bajriwala Membership?',
    answer:
      'Bajriwala Membership is a premium annual plan that unlocks free delivery, cashback, exclusive prices, and priority support on construction material orders.',
  },
  {
    id: 'valid',
    question: 'How long is membership valid?',
    answer:
      'Membership is valid for 12 months from the date of purchase. You can renew anytime before or after expiry.',
  },
  {
    id: 'cancel',
    question: 'Can I cancel?',
    answer:
      'You can cancel anytime from Manage Membership. Benefits remain active until the current billing period ends. Refunds follow Bajriwala’s membership policy.',
  },
  {
    id: 'cashback',
    question: 'How do cashback works?',
    answer:
      'Cashback is credited to your Bajriwala wallet after eligible order delivery, based on your plan’s cashback percentage. It can be used on future orders.',
  },
  {
    id: 'delivery',
    question: 'Is Free Delivery available everywhere?',
    answer:
      'Free delivery applies in serviceable Bajriwala zones. Availability may vary by pin code and order value thresholds for some plans.',
  },
];

export function formatMembershipPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getPlanById(id: MembershipPlanId | null | undefined) {
  if (!id) return null;
  return MEMBERSHIP_PLANS.find((p) => p.id === id) ?? null;
}
