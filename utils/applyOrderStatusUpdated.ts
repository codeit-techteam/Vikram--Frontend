import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { ORDERS_QUERY_KEY } from '@hooks/useOrders';
import { INVOICE_DETAIL_QUERY_KEY, INVOICES_QUERY_KEY } from '@hooks/useInvoices';
import type { Order, OrdersPage, OrderStatus } from '@/types/order';
import { ACTIVE_ORDER_STATUSES } from '@constants/orderStatus';
import type { OrderStatusUpdatedPayload } from '@services/realtime.socket';
import { useOrdersSyncStore } from '@store/ordersSyncStore';
import {
  buildCustomerTimeline,
  getCustomerStatusLabel,
} from '@utils/customerOrderStatus';
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
  PICKING: 'packed',
  PROCESSING: 'processing',
  PACKED: 'packed',
  READY_FOR_DISPATCH: 'ready_for_dispatch',
  DRIVER_ASSIGNED: 'out_for_delivery',
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
  const statusLabel = getCustomerStatusLabel(status);
  const version = payloadVersion(payload);
  const deliveredAt =
    status === 'delivered'
      ? payload.updatedAt || base?.deliveredAt || new Date().toISOString()
      : base?.deliveredAt;
  const timeline = buildCustomerTimeline(status, {
    createdAt: base?.createdAt ?? payload.updatedAt,
    deliveredAt,
  });

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
    deliveredAt,
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
    deliveryOtp: base?.deliveryOtp,
    deliveryOtpGenerated:
      payload.deliveryOtpGenerated ?? base?.deliveryOtpGenerated,
    deliveryOtpVerified:
      payload.deliveryOtpVerified ?? base?.deliveryOtpVerified,
    driverReachedAt: payload.driverReachedAt ?? base?.driverReachedAt,
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

  const statusLabel = getCustomerStatusLabel(status);

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

  const deliveredAt =
    status === 'delivered'
      ? payload.updatedAt || order.deliveredAt || new Date().toISOString()
      : order.deliveredAt;

  const timeline = buildCustomerTimeline(status, {
    createdAt: order.createdAt,
    deliveredAt,
  });

  const deliveryOtpVerified =
    payload.deliveryOtpVerified ?? order.deliveryOtpVerified;
  const deliveryOtpGenerated =
    payload.deliveryOtpGenerated ?? order.deliveryOtpGenerated;

  return normalizeDeliveredFields({
    ...order,
    status,
    statusLabel,
    updatedAt: payload.updatedAt || order.updatedAt,
    version: Math.max(incomingVersion, currentVersion),
    expectedDelivery,
    deliveredAt,
    driver,
    timeline,
    canCancel: status === 'pending' || status === 'confirmed' ? order.canCancel : false,
    deliveryOtpGenerated,
    deliveryOtpVerified,
    deliveryOtp: deliveryOtpVerified ? null : order.deliveryOtp,
    driverReachedAt: payload.driverReachedAt ?? order.driverReachedAt,
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
      getCustomerStatusLabel(mapBackendStatus(payload.status)),
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
    if (patched.status === 'delivered' || patched.status === 'refunded') {
      void queryClient.invalidateQueries({
        queryKey: [INVOICES_QUERY_KEY],
        refetchType: 'active',
      });
      void queryClient.invalidateQueries({
        queryKey: [INVOICE_DETAIL_QUERY_KEY],
        refetchType: 'active',
      });
    }
  }, 300);
}
