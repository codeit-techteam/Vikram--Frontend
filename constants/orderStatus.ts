import type { OrderFilterStatus, OrderStatus } from '@/types/order';
import {
  CUSTOMER_PROGRESS_INDEX,
  CUSTOMER_PROGRESS_STEPS,
  CUSTOMER_TIMELINE_STEPS,
  getCustomerStatusLabel,
} from '@utils/customerOrderStatus';

export interface StatusBadgeConfig {
  label: string;
  color: string;
  backgroundColor: string;
}

/** Customer-safe badge labels — never expose hub/ops terminology. */
export const ORDER_STATUS_BADGES: Record<OrderStatus, StatusBadgeConfig> = {
  pending: { label: 'Order Placed', color: '#B8860B', backgroundColor: '#FFF8E1' },
  confirmed: { label: 'Confirmed', color: '#1A73E8', backgroundColor: '#E3F2FD' },
  processing: { label: 'Confirmed', color: '#1A73E8', backgroundColor: '#E3F2FD' },
  packed: { label: 'Packed', color: '#7B1FA2', backgroundColor: '#F3E5F5' },
  ready_for_dispatch: { label: 'Packed', color: '#7B1FA2', backgroundColor: '#F3E5F5' },
  out_for_delivery: { label: 'Out for Delivery', color: '#E65100', backgroundColor: '#FFF3E0' },
  delivered: { label: 'Delivered', color: '#2E7D32', backgroundColor: '#E8F5E9' },
  cancelled: { label: 'Cancelled', color: '#C62828', backgroundColor: '#FFEBEE' },
  payment_failed: { label: 'Payment Failed', color: '#C62828', backgroundColor: '#FFEBEE' },
  refunded: { label: 'Delivered', color: '#2E7D32', backgroundColor: '#E8F5E9' },
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'ready_for_dispatch',
  'out_for_delivery',
];

export const ORDER_FILTERS: { id: OrderFilterStatus; label: string }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

/** @deprecated Prefer CUSTOMER_TIMELINE_STEPS — kept for callers expecting this shape. */
export const TIMELINE_STEPS: { key: string; label: string; statuses: OrderStatus[] }[] =
  CUSTOMER_TIMELINE_STEPS.map((step) => ({
    key: step.key,
    label: step.label,
    statuses:
      step.key === 'placed'
        ? (['pending'] as OrderStatus[])
        : step.key === 'confirmed'
          ? (['confirmed', 'processing'] as OrderStatus[])
          : step.key === 'packed'
            ? (['packed', 'ready_for_dispatch'] as OrderStatus[])
            : step.key === 'out_for_delivery'
              ? (['out_for_delivery'] as OrderStatus[])
              : (['delivered', 'refunded'] as OrderStatus[]),
  }));

export const ACTIVE_PROGRESS_STEPS = CUSTOMER_PROGRESS_STEPS;

export const STATUS_PROGRESS_INDEX = CUSTOMER_PROGRESS_INDEX;

/** Aligns with backend: PENDING, CONFIRMED, HUB_ASSIGNED (mapped → confirmed), AWAITING_HUB_ALLOCATION (→ pending). */
export const CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'confirmed'];

export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_ORDER_STATUSES.includes(status);
}

export function matchesFilter(status: OrderStatus, filter: OrderFilterStatus): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return isActiveStatus(status);
  if (filter === 'delivered') return status === 'delivered' || status === 'refunded';
  if (filter === 'cancelled') return status === 'cancelled' || status === 'payment_failed';
  return true;
}

export function badgeLabelForStatus(status: OrderStatus, _apiLabel?: string | null): string {
  return getCustomerStatusLabel(status);
}
