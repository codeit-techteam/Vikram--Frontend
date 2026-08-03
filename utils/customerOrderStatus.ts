/**
 * Customer-facing order milestones.
 * Backend / hub operational events stay hidden — UI always derives from order status.
 */

import type { OrderStatus, TimelineStep } from '@/types/order';

export type CustomerMilestoneKey =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered';

export interface CustomerMilestone {
  key: CustomerMilestoneKey;
  label: string;
}

/** Full track/details timeline (5 steps). */
export const CUSTOMER_TIMELINE_STEPS: CustomerMilestone[] = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

/** Compact list-card progress (no "Order Placed"). */
export const CUSTOMER_PROGRESS_STEPS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
] as const;

/** Index into CUSTOMER_TIMELINE_STEPS for the active milestone. */
export const CUSTOMER_TIMELINE_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  processing: 1,
  packed: 2,
  ready_for_dispatch: 2,
  out_for_delivery: 3,
  delivered: 4,
  cancelled: -1,
  payment_failed: -1,
  refunded: 4,
};

/** Index into CUSTOMER_PROGRESS_STEPS for list cards. */
export const CUSTOMER_PROGRESS_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 0,
  processing: 0,
  packed: 1,
  ready_for_dispatch: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
  payment_failed: -1,
  refunded: 3,
};

const CUSTOMER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Confirmed',
  packed: 'Packed',
  ready_for_dispatch: 'Packed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  payment_failed: 'Payment Failed',
  refunded: 'Delivered',
};

const CUSTOMER_STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending: "We've received your order.",
  confirmed: 'Your order has been confirmed.',
  processing: 'Your order has been confirmed.',
  packed: 'Your order has been packed and is waiting for dispatch.',
  ready_for_dispatch: 'Your order has been packed and is waiting for dispatch.',
  out_for_delivery: 'Your order is on the way.',
  delivered: 'Your order has been delivered successfully.',
  cancelled: 'This order was cancelled.',
  payment_failed: 'Payment failed for this order.',
  refunded: 'Your order has been delivered successfully.',
};

/** Push / in-app notification copy keyed by customer milestone. */
export const CUSTOMER_NOTIFICATION_COPY: Record<
  CustomerMilestoneKey,
  { title: string; body: string }
> = {
  placed: {
    title: 'Order Placed',
    body: "We've received your order.",
  },
  confirmed: {
    title: 'Order Confirmed',
    body: 'Your order has been confirmed.',
  },
  packed: {
    title: 'Order Packed',
    body: 'Your order has been packed.',
  },
  out_for_delivery: {
    title: 'Out for Delivery',
    body: 'Your order is out for delivery.',
  },
  delivered: {
    title: 'Delivered',
    body: 'Your order has been delivered.',
  },
};

const INTERNAL_LABEL_PATTERN =
  /\b(hub|warehouse|picker|driver assigned|bike ready|otp generated|reached customer|accepted by|vehicle|dispatch log|rider note|staff)\b/i;

export function getCustomerStatusLabel(status: OrderStatus): string {
  return CUSTOMER_STATUS_LABELS[status] ?? 'Order Placed';
}

export function getCustomerStatusMessage(status: OrderStatus): string {
  return CUSTOMER_STATUS_MESSAGES[status] ?? "We've received your order.";
}

export function getCustomerMilestoneKey(status: OrderStatus): CustomerMilestoneKey | null {
  const index = CUSTOMER_TIMELINE_INDEX[status];
  if (index < 0) return null;
  return CUSTOMER_TIMELINE_STEPS[index]?.key ?? null;
}

/** Prefer derived customer label; never surface internal API statusLabel. */
export function resolveCustomerStatusLabel(
  status: OrderStatus,
  _apiLabel?: string | null,
): string {
  return getCustomerStatusLabel(status);
}

export function isInternalTimelineLabel(label: string): boolean {
  return INTERNAL_LABEL_PATTERN.test(label.trim());
}

/**
 * Always build the 5-step customer timeline from status.
 * Ignores raw backend/hub timeline events.
 */
export function buildCustomerTimeline(
  status: OrderStatus,
  options?: { deliveredAt?: string; createdAt?: string },
): TimelineStep[] {
  const current = CUSTOMER_TIMELINE_INDEX[status];
  const isDelivered = status === 'delivered' || status === 'refunded';
  const isCancelled = status === 'cancelled' || status === 'payment_failed';

  if (isCancelled) {
    return [
      {
        key: 'placed',
        label: 'Order Placed',
        time: options?.createdAt
          ? formatShortDateTime(options.createdAt)
          : undefined,
        done: true,
        active: false,
      },
      {
        key: 'cancelled',
        label: status === 'payment_failed' ? 'Payment Failed' : 'Cancelled',
        done: true,
        active: false,
      },
    ];
  }

  return CUSTOMER_TIMELINE_STEPS.map((step, index) => {
    const done = isDelivered ? index <= current : index < current;
    const active = !isDelivered && index === current;
    let time: string | undefined;
    if (step.key === 'placed' && options?.createdAt) {
      time = formatShortDateTime(options.createdAt);
    }
    if (step.key === 'delivered' && isDelivered && options?.deliveredAt) {
      time = formatShortDateTime(options.deliveredAt);
    }
    return {
      key: step.key,
      label: step.label,
      time,
      done: done || (isDelivered && index === current),
      active,
    };
  });
}

function formatShortDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function shouldShowDeliveryOtp(order: {
  status: OrderStatus;
  deliveryOtpGenerated?: boolean;
  deliveryOtpVerified?: boolean;
  driverReachedAt?: string | null;
  deliveryOtp?: string | null;
}): boolean {
  if (order.status !== 'out_for_delivery') return false;
  if (order.deliveryOtpVerified) return false;
  if (!order.deliveryOtpGenerated && !order.deliveryOtp) return false;
  // Show once rider has reached (or OTP exists / was generated for handover).
  return Boolean(order.driverReachedAt || order.deliveryOtp || order.deliveryOtpGenerated);
}
