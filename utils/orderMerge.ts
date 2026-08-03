import { ACTIVE_ORDER_STATUSES } from '@constants/orderStatus';
import type { Order, OrderStatus } from '@/types/order';
import { buildCustomerTimeline, getCustomerStatusLabel } from '@utils/customerOrderStatus';

const STATUS_RANK: Record<OrderStatus, number> = {
  pending: 10,
  confirmed: 20,
  processing: 30,
  packed: 40,
  ready_for_dispatch: 50,
  out_for_delivery: 60,
  delivered: 100,
  cancelled: 100,
  payment_failed: 100,
  refunded: 100,
};

/** Monotonic freshness key — prefer explicit version, then updatedAt, else 0. */
export function getOrderVersion(order: Pick<Order, 'version' | 'updatedAt'> | null | undefined): number {
  if (!order) return 0;
  if (typeof order.version === 'number' && Number.isFinite(order.version)) {
    return order.version;
  }
  if (order.updatedAt) {
    const parsed = Date.parse(order.updatedAt);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function getStatusRank(status: OrderStatus): number {
  return STATUS_RANK[status] ?? 0;
}

/**
 * True when `incoming` should replace `local`.
 * Never lets an older version (or status regression past a terminal state) win.
 */
export function shouldReplaceOrder(
  local: Order | null | undefined,
  incoming: Order | null | undefined,
): boolean {
  if (!incoming) return false;
  if (!local) return true;

  const localVersion = getOrderVersion(local);
  const incomingVersion = getOrderVersion(incoming);

  if (localVersion > 0 && incomingVersion > 0 && incomingVersion < localVersion) {
    return false;
  }

  const localRank = getStatusRank(local.status);
  const incomingRank = getStatusRank(incoming.status);

  // Guard terminal states against stale OFD HTTP even when versions are missing.
  if (
    (local.status === 'delivered' || local.status === 'cancelled') &&
    incomingRank < localRank &&
    (incomingVersion === 0 || incomingVersion <= localVersion)
  ) {
    return false;
  }

  if (incomingVersion > localVersion) return true;
  if (incomingVersion === localVersion && incomingRank >= localRank) return true;
  if (incomingVersion === 0 && localVersion === 0) return incomingRank >= localRank;

  return false;
}

/** Pick the fresher of two order snapshots (same id). */
export function preferFresherOrder(a: Order, b: Order): Order {
  return shouldReplaceOrder(a, b) ? b : a;
}

/**
 * Merge list/detail/socket payloads without regressing newer local state.
 * When incoming wins, take it wholesale (single source of truth object).
 * When local wins, keep local and only fill missing non-lifecycle fields from incoming.
 */
export function mergeOrderState(
  local: Order | null | undefined,
  incoming: Order,
): Order {
  if (!local) return normalizeDeliveredFields(incoming);
  if (!shouldReplaceOrder(local, incoming)) {
    return {
      ...incoming,
      ...local,
      // Prefer richer detail fields from either side without regressing status.
      products: local.products?.length ? local.products : incoming.products,
      timeline: local.timeline?.length ? local.timeline : incoming.timeline,
      driver: local.driver ?? incoming.driver,
      shippingAddress: local.shippingAddress?.address
        ? local.shippingAddress
        : incoming.shippingAddress,
      invoiceUrl: local.invoiceUrl ?? incoming.invoiceUrl,
      invoiceId: local.invoiceId ?? incoming.invoiceId,
      invoiceNumber: local.invoiceNumber ?? incoming.invoiceNumber,
      invoiceStatus: local.invoiceStatus ?? incoming.invoiceStatus,
    };
  }
  return normalizeDeliveredFields({
    ...local,
    ...incoming,
    // Keep richer product/address payloads if incoming is a thin socket/list patch.
    products: incoming.products?.length ? incoming.products : local.products,
    shippingAddress: incoming.shippingAddress?.address
      ? incoming.shippingAddress
      : local.shippingAddress,
    timeline:
      incoming.timeline?.length > 0 ? incoming.timeline : local.timeline,
  });
}

/** Delivered orders must not surface ETA / track / active expected delivery. */
export function normalizeDeliveredFields(order: Order): Order {
  const statusLabel = getCustomerStatusLabel(order.status);
  const timeline = buildCustomerTimeline(order.status, {
    createdAt: order.createdAt,
    deliveredAt: order.deliveredAt ?? order.updatedAt,
  });

  if (order.status !== 'delivered' && order.status !== 'refunded') {
    return {
      ...order,
      statusLabel,
      timeline,
      tracking: ACTIVE_ORDER_STATUSES.includes(order.status)
        ? {
            ...(order.tracking ?? { currentStep: order.status, steps: timeline }),
            currentStep: order.status,
            steps: timeline,
          }
        : undefined,
    };
  }

  return {
    ...order,
    statusLabel,
    expectedDelivery: undefined,
    tracking: undefined,
    canCancel: false,
    timeline,
    deliveredAt: order.deliveredAt ?? order.updatedAt,
    deliveryOtp: null,
    deliveryOtpGenerated: false,
    deliveryOtpVerified: true,
  };
}
