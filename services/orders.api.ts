import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type {
  CancelOrderPayload,
  Order,
  OrdersPage,
  OrdersQueryParams,
  OrderTracking,
  ReorderResponse,
} from '@/types/order';
import { normalizeApiOrder } from '@utils/orderAdapters';

const ORDERS_BASE = '/orders';

interface OrdersApiPage {
  items?: Record<string, unknown>[];
  data?: Record<string, unknown>[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
  };
  nextCursor?: string | null;
  cursor?: string | null;
  hasMore?: boolean;
  total?: number;
}

function parseOrdersPage(payload: OrdersApiPage, limit: number): OrdersPage {
  const rawItems = payload.items ?? payload.data ?? [];
  const items = rawItems.map((item) => normalizeApiOrder(item));
  const page = payload.meta?.page ?? 1;
  const totalPages = payload.meta?.totalPages ?? 1;
  const hasMore =
    payload.meta?.hasNextPage ??
    payload.hasMore ??
    page < totalPages;
  const nextCursor = hasMore ? String(page + 1) : null;

  return {
    items,
    nextCursor,
    hasMore,
    total: payload.meta?.total ?? payload.total ?? items.length,
  };
}

export async function fetchOrders(params: OrdersQueryParams = {}): Promise<OrdersPage> {
  const { status = 'all', cursor, limit = 10, search } = params;
  const page = cursor ? Number(cursor) || 1 : 1;

  const query = new URLSearchParams();
  if (status !== 'all') {
    const statusMap: Record<string, string> = {
      active: '',
      delivered: 'DELIVERED',
      cancelled: 'CANCELLED',
    };
    const mapped = statusMap[status] ?? status.toUpperCase();
    if (mapped) query.set('status', mapped);
  }
  query.set('page', String(page));
  query.set('limit', String(limit));
  if (search) query.set('search', search);

  const { data } = await api.get<ApiResponse<OrdersApiPage>>(
    `${ORDERS_BASE}?${query.toString()}`,
  );

  const pageResult = parseOrdersPage(data.data, limit);

  if (status === 'active') {
    const activeItems = pageResult.items.filter(
      (o) =>
        o.status !== 'delivered' &&
        o.status !== 'cancelled' &&
        o.status !== 'payment_failed' &&
        o.status !== 'refunded',
    );
    return { ...pageResult, items: activeItems, total: activeItems.length };
  }

  return pageResult;
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  const { data } = await api.get<ApiResponse<Record<string, unknown>>>(
    `${ORDERS_BASE}/${orderId}`,
  );
  return normalizeApiOrder(data.data);
}

export async function fetchOrderTracking(orderId: string): Promise<OrderTracking> {
  const { data } = await api.get<ApiResponse<OrderTracking>>(
    `${ORDERS_BASE}/${orderId}/tracking`,
  );
  return data.data;
}

export async function reorderItems(orderId: string): Promise<ReorderResponse> {
  const { data } = await api.post<ApiResponse<ReorderResponse>>(
    `${ORDERS_BASE}/${orderId}/reorder`,
  );
  return data.data;
}

export async function cancelOrder(
  orderId: string,
  payload: CancelOrderPayload = {},
): Promise<Order> {
  const { data } = await api.patch<ApiResponse<Record<string, unknown>>>(
    `${ORDERS_BASE}/${orderId}/cancel`,
    payload,
  );
  return normalizeApiOrder(data.data);
}

export async function fetchOrderInvoice(orderId: string): Promise<{ url: string }> {
  const { data } = await api.get<ApiResponse<{ url: string }>>(
    `${ORDERS_BASE}/${orderId}/invoice`,
  );
  return data.data;
}

export async function placeOrder(payload: {
  addressId: string;
  notes?: string;
  paymentMethod?: 'CASH' | 'MANUAL';
  loyaltyPointsToRedeem?: number;
}): Promise<Record<string, unknown>> {
  const { data } = await api.post<ApiResponse<Record<string, unknown>>>(
    ORDERS_BASE,
    {
      addressId: payload.addressId,
      notes: payload.notes,
      paymentMethod: payload.paymentMethod ?? 'CASH',
      loyaltyPointsToRedeem: payload.loyaltyPointsToRedeem,
    },
  );
  return data.data;
}

export function getActiveOrderCount(orders: Order[]): number {
  return orders.filter(
    (o) =>
      o.status !== 'delivered' &&
      o.status !== 'cancelled' &&
      o.status !== 'payment_failed' &&
      o.status !== 'refunded',
  ).length;
}
