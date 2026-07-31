import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { ORDERS_QUERY_KEY } from '@hooks/useOrders';
import type { Order, OrdersPage, OrderStatus, TimelineStep } from '@/types/order';
import { ACTIVE_ORDER_STATUSES } from '@constants/orderStatus';
import type { OrderStatusUpdatedPayload } from '@services/realtime.socket';
import { useOrdersSyncStore } from '@store/ordersSyncStore';
import {
  getOrderVersion,
  getStatusRank,
  mergeOrderState,
  normalizeDeliveredFields,
} from '@utils/orderMerge';

const BACKEND_STATUS_MAP: Record<string, OrderStatus> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  HUB_ASSIGNED: 'confirmed',
  AWAITING_HUB_ALLOCATION: 'pending',
  ACCEPTED_BY_HUB: 'processing',
  PICKING: 'processing',
  PROCESSING: 'processing',
  PACKED: 'packed',
  READY_FOR_DISPATCH: 'ready_for_dispatch',
  DRIVER_ASSIGNED: 'ready_for_dispatch',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DISPATCHED: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

function mapBackendStatus(status: string): OrderStatus {
  const key = String(status);
  return BACKEND_STATUS_MAP[key] ?? BACKEND_STATUS_MAP[key.toUpperCase()] ?? 'pending';
}

function formatEta(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function payloadVersion(payload: OrderStatusUpdatedPayload): number {
  if (typeof payload.version === 'number' && Number.isFinite(payload.version)) {
    return payload.version;
  }
  const parsed = Date.parse(payload.updatedAt);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function mapPayloadTimeline(
  payload: OrderStatusUpdatedPayload,
  orderStatus: OrderStatus,
): TimelineStep[] | null {
  if (!payload.timeline?.length) return null;
  const last = payload.timeline.length - 1;
  const terminal = orderStatus === 'delivered' || orderStatus === 'cancelled';
  return payload.timeline.map((entry, index) => ({
    key: entry.id || `timeline-${index}`,
    label: entry.message || entry.statusLabel || entry.status,
    time: entry.createdAt
      ? new Date(entry.createdAt).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : undefined,
    done: terminal || index < last,
    active: !terminal && index === last,
  }));
}

function buildTimelineFromStatus(
  status: OrderStatus,
  previous?: TimelineStep[],
  statusLabel?: string,
): TimelineStep[] {
  if (previous?.length) {
    const label = statusLabel ?? status;
    const alreadyHas = previous.some(
      (step) => step.label.toLowerCase() === label.toLowerCase(),
    );

    if (alreadyHas) {
      const idx = previous.findIndex(
        (step) => step.label.toLowerCase() === label.toLowerCase(),
      );
      return previous.map((step, index) => ({
        ...step,
        done: index < idx || (index === idx && status === 'delivered'),
        active: index === idx && status !== 'delivered' && status !== 'cancelled',
      }));
    }

    const completed = previous.map((step) => ({
      ...step,
      done: true,
      active: false,
    }));

    return [
      ...completed,
      {
        key: `live-${status}-${Date.now()}`,
        label,
        time: new Date().toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        done: status === 'delivered' || status === 'cancelled',
        active: status !== 'delivered' && status !== 'cancelled',
      },
    ];
  }

  const steps = [
    { key: 'placed', label: 'Order Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'packed', label: 'Packed' },
    { key: 'dispatched', label: 'Dispatched' },
    { key: 'out_for_delivery', label: 'Out For Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const statusIndex: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 1,
    processing: 1,
    packed: 2,
    ready_for_dispatch: 3,
    out_for_delivery: 4,
    delivered: 5,
    cancelled: 0,
    payment_failed: 0,
    refunded: 5,
  };

  const current = statusIndex[status];
  return steps.map((step, index) => ({
    ...step,
    done: index < current || (status === 'delivered' && index <= current),
    active: index === current && status !== 'delivered' && status !== 'cancelled',
  }));
}

function findOrderInListCaches(
  queryClient: QueryClient,
  orderId: string,
): Order | undefined {
  const lists = queryClient.getQueriesData<InfiniteData<OrdersPage>>({
    queryKey: [ORDERS_QUERY_KEY],
  });
  for (const [, data] of lists) {
    const match = data?.pages
      .flatMap((page) => page.items)
      .find((order) => order.id === orderId);
    if (match) return match;
  }
  return undefined;
}

/** Build a usable order snapshot from a socket payload when no local copy exists. */
function orderFromPayload(payload: OrderStatusUpdatedPayload, base?: Order): Order {
  const status = mapBackendStatus(payload.status);
  const statusLabel = payload.statusLabel || base?.statusLabel;
  const version = payloadVersion(payload);
  const fromPayload = mapPayloadTimeline(payload, status);
  const timeline =
    fromPayload ??
    buildTimelineFromStatus(status, base?.timeline, statusLabel ?? status);

  const driver =
    payload.driver?.name || payload.vehicle?.registration
      ? {
          name: payload.driver?.name ?? base?.driver?.name ?? '',
          phone: payload.driver?.phone ?? base?.driver?.phone ?? '',
          vehicleNumber:
            payload.vehicle?.registration ?? base?.driver?.vehicleNumber ?? '',
          image: base?.driver?.image,
        }
      : base?.driver;

  const expectedDelivery =
    status === 'delivered' || status === 'cancelled'
      ? undefined
      : formatEta(payload.expectedDeliveryAt ?? payload.eta) ?? base?.expectedDelivery;

  const patched: Order = {
    id: payload.orderId,
    orderNumber: payload.orderNumber ?? base?.orderNumber ?? payload.orderId,
    status,
    statusLabel,
    createdAt: base?.createdAt ?? payload.updatedAt,
    updatedAt: payload.updatedAt,
    version,
    expectedDelivery,
    deliveredAt:
      status === 'delivered'
        ? payload.updatedAt || base?.deliveredAt || new Date().toISOString()
        : base?.deliveredAt,
    products: base?.products ?? [],
    subtotal: base?.subtotal ?? 0,
    discount: base?.discount ?? 0,
    gst: base?.gst ?? 0,
    couponDiscount: base?.couponDiscount,
    deliveryCharge: base?.deliveryCharge ?? 0,
    platformFee: base?.platformFee ?? 0,
    grandTotal: base?.grandTotal ?? 0,
    savings: base?.savings,
    paymentStatus: base?.paymentStatus ?? 'pending',
    paymentMethod: base?.paymentMethod ?? 'CASH',
    paymentMethodLabel: base?.paymentMethodLabel,
    transactionId: base?.transactionId,
    shippingAddress: base?.shippingAddress ?? {
      name: '',
      phone: '',
      address: '',
      pin: '',
    },
    driver,
    cancellationReason: base?.cancellationReason,
    canCancel: status === 'pending' || status === 'confirmed' ? base?.canCancel : false,
    invoiceUrl: base?.invoiceUrl,
    invoiceId: base?.invoiceId,
    invoiceNumber: base?.invoiceNumber,
    invoiceStatus: base?.invoiceStatus,
    invoiceFileName: base?.invoiceFileName,
    timeline,
    deliveredEarly: base?.deliveredEarly,
    loyaltyPointsEarned: base?.loyaltyPointsEarned,
    tracking: ACTIVE_ORDER_STATUSES.includes(status)
      ? {
          currentStep: status,
          steps: timeline,
          estimatedArrival: expectedDelivery,
          driver,
        }
      : undefined,
  };

  return normalizeDeliveredFields(patched);
}

export function patchOrderFromStatusEvent(
  order: Order,
  payload: OrderStatusUpdatedPayload,
): Order {
  const incomingVersion = payloadVersion(payload);
  const currentVersion = getOrderVersion(order);

  // Never overwrite newer local/socket state with an older event.
  if (currentVersion > 0 && incomingVersion > 0 && incomingVersion < currentVersion) {
    if (__DEV__) {
      console.log(
        '[realtime] skip stale event',
        payload.orderId,
        `incoming=${incomingVersion}`,
        `local=${currentVersion}`,
      );
    }
    return order;
  }

  const nextStatus = mapBackendStatus(payload.status);
  const currentRank = getStatusRank(order.status);
  const nextRank = getStatusRank(nextStatus);

  // Never regress terminal / later lifecycle statuses (guards racey OFD after Delivered).
  const status =
    nextRank < currentRank &&
    (order.status === 'delivered' || order.status === 'cancelled')
      ? order.status
      : nextRank < currentRank && incomingVersion <= currentVersion
        ? order.status
        : nextStatus;

  const statusLabel =
    status === order.status && nextStatus !== status
      ? order.statusLabel
      : payload.statusLabel || order.statusLabel;

  const expectedDelivery =
    status === 'delivered' || status === 'cancelled'
      ? undefined
      : formatEta(payload.expectedDeliveryAt ?? payload.eta) ?? order.expectedDelivery;

  const driver =
    payload.driver?.name || payload.vehicle?.registration
      ? {
          name: payload.driver?.name ?? order.driver?.name ?? '',
          phone: payload.driver?.phone ?? order.driver?.phone ?? '',
          vehicleNumber:
            payload.vehicle?.registration ?? order.driver?.vehicleNumber ?? '',
          image: order.driver?.image,
        }
      : order.driver;

  const fromPayload = mapPayloadTimeline(payload, status);
  const timeline =
    fromPayload ??
    buildTimelineFromStatus(status, order.timeline, statusLabel ?? status);

  return normalizeDeliveredFields({
    ...order,
    status,
    statusLabel,
    updatedAt: payload.updatedAt || order.updatedAt,
    version: Math.max(incomingVersion, currentVersion),
    expectedDelivery,
    deliveredAt:
      status === 'delivered'
        ? payload.updatedAt || order.deliveredAt || new Date().toISOString()
        : order.deliveredAt,
    driver,
    timeline,
    canCancel: status === 'pending' || status === 'confirmed' ? order.canCancel : false,
    tracking: ACTIVE_ORDER_STATUSES.includes(status)
      ? {
          currentStep: status,
          steps: timeline,
          estimatedArrival: expectedDelivery,
          driver,
        }
      : undefined,
  });
}

function syncOrderEverywhere(queryClient: QueryClient, order: Order): Order {
  const merged = useOrdersSyncStore.getState().upsertOrder(order);

  queryClient.setQueryData<Order>(['order', merged.id], (existing) =>
    existing ? mergeOrderState(existing, merged) : merged,
  );

  queryClient.setQueriesData<InfiniteData<OrdersPage>>(
    { queryKey: [ORDERS_QUERY_KEY] },
    (existing) => {
      if (!existing) return existing;
      return {
        ...existing,
        pages: existing.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            item.id === merged.id ? mergeOrderState(item, merged) : item,
          ),
        })),
      };
    },
  );

  return merged;
}

export function applyOrderStatusUpdated(
  queryClient: QueryClient,
  payload: OrderStatusUpdatedPayload,
): void {
  if (!payload?.orderId) return;

  if (__DEV__) {
    console.log(
      '[realtime] Customer Store Updated',
      payload.orderId,
      payload.status,
      payload.statusLabel,
    );
  }

  // Cancel in-flight HTTP refetches that could race and write stale OFD over Delivered.
  void queryClient.cancelQueries({ queryKey: ['order', payload.orderId] });
  void queryClient.cancelQueries({ queryKey: [ORDERS_QUERY_KEY] });

  const fromDetail = queryClient.getQueryData<Order>(['order', payload.orderId]);
  const fromStore = useOrdersSyncStore.getState().getOrder(payload.orderId);
  const fromList = findOrderInListCaches(queryClient, payload.orderId);
  const base = fromDetail ?? fromStore ?? fromList;

  const patched = base
    ? patchOrderFromStatusEvent(base, payload)
    : orderFromPayload(payload);

  // ALWAYS seed detail + list + Zustand SSOT — even if detail was never opened.
  syncOrderEverywhere(queryClient, patched);

  // Background reconcile — version guards in useOrder/useOrders prevent stale HTTP wins.
  setTimeout(() => {
    void queryClient.invalidateQueries({
      queryKey: ['order', payload.orderId],
      refetchType: 'active',
    });
    void queryClient.invalidateQueries({
      queryKey: [ORDERS_QUERY_KEY],
      refetchType: 'active',
    });
    void queryClient.invalidateQueries({
      queryKey: ['notifications'],
      refetchType: 'active',
    });
    void queryClient.invalidateQueries({
      queryKey: ['home'],
      refetchType: 'active',
    });
  }, 300);
}
