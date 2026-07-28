import type { OrderFilterStatus, OrderStatus } from '@/types/order';

export interface StatusBadgeConfig {
  label: string;
  color: string;
  backgroundColor: string;
}

export const ORDER_STATUS_BADGES: Record<OrderStatus, StatusBadgeConfig> = {
  pending: { label: 'Pending', color: '#B8860B', backgroundColor: '#FFF8E1' },
  confirmed: { label: 'Confirmed', color: '#1A73E8', backgroundColor: '#E3F2FD' },
  // Prefer order.statusLabel from API when available (Accepted by Hub / Picking / Hub Assigned).
  processing: { label: 'Accepted by Hub', color: '#1A73E8', backgroundColor: '#E3F2FD' },
  packed: { label: 'Packed', color: '#7B1FA2', backgroundColor: '#F3E5F5' },
  ready_for_dispatch: { label: 'Driver Assigned', color: '#7B1FA2', backgroundColor: '#F3E5F5' },
  out_for_delivery: { label: 'Out For Delivery', color: '#E65100', backgroundColor: '#FFF3E0' },
  delivered: { label: 'Delivered', color: '#2E7D32', backgroundColor: '#E8F5E9' },
  cancelled: { label: 'Cancelled', color: '#C62828', backgroundColor: '#FFEBEE' },
  payment_failed: { label: 'Payment Failed', color: '#C62828', backgroundColor: '#FFEBEE' },
  refunded: { label: 'Refunded', color: '#1B5E20', backgroundColor: '#C8E6C9' },
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

export const TIMELINE_STEPS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: 'placed', label: 'Order Placed', statuses: ['pending'] },
  { key: 'confirmed', label: 'Confirmed', statuses: ['confirmed'] },
  { key: 'packed', label: 'Packed', statuses: ['packed'] },
  { key: 'dispatched', label: 'Dispatched', statuses: ['ready_for_dispatch'] },
  { key: 'out_for_delivery', label: 'Out For Delivery', statuses: ['out_for_delivery'] },
  { key: 'delivered', label: 'Delivered', statuses: ['delivered'] },
];

export const ACTIVE_PROGRESS_STEPS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'out_for_delivery', label: 'Out For Delivery' },
  { key: 'delivered', label: 'Delivered' },
] as const;

export const STATUS_PROGRESS_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 0,
  processing: 0,
  packed: 1,
  ready_for_dispatch: 2,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
  payment_failed: -1,
  refunded: -1,
};

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
