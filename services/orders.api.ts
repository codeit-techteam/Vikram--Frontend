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
import {
  adaptLegacyOrder,
  filterMockOrders,
  getMockOrders,
  normalizeApiOrder,
  paginateMockOrders,
} from '@utils/orderAdapters';
import { useOrderStore } from '@store/orderStore';

const ORDERS_BASE = '/orders';

interface OrdersApiPage {
  items?: Record<string, unknown>[];
  data?: Record<string, unknown>[];
  nextCursor?: string | null;
  cursor?: string | null;
  hasMore?: boolean;
  total?: number;
}

function resolveMockOrders(): Order[] {
  const storeOrders = useOrderStore.getState().orders;
  const adaptedStore = storeOrders.map(adaptLegacyOrder);
  const mockIds = new Set(adaptedStore.map((o) => o.id));
  const extras = getMockOrders().filter((o) => !mockIds.has(o.id));
  return [...adaptedStore, ...extras].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

async function withMockFallback<T>(apiCall: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await apiCall();
  } catch {
    return fallback();
  }
}

function parseOrdersPage(payload: OrdersApiPage, limit: number): OrdersPage {
  const rawItems = payload.items ?? payload.data ?? [];
  const items = rawItems.map((item) => normalizeApiOrder(item));
  const nextCursor = payload.nextCursor ?? payload.cursor ?? null;
  const hasMore = payload.hasMore ?? (nextCursor != null && nextCursor.length > 0);

  return {
    items,
    nextCursor,
    hasMore,
    total: payload.total ?? items.length,
  };
}

export async function fetchOrders(params: OrdersQueryParams = {}): Promise<OrdersPage> {
  const { status = 'all', cursor, limit = 10, search } = params;

  return withMockFallback(
    async () => {
      const query = new URLSearchParams();
      if (status !== 'all') query.set('status', status);
      if (cursor) query.set('cursor', cursor);
      query.set('limit', String(limit));
      if (search) query.set('search', search);

      const { data } = await api.get<ApiResponse<OrdersApiPage>>(
        `${ORDERS_BASE}?${query.toString()}`,
      );

      return parseOrdersPage(data.data, limit);
    },
    () => {
      const filtered = filterMockOrders(resolveMockOrders(), status, search);
      return paginateMockOrders(filtered, cursor, limit);
    },
  );
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  return withMockFallback(
    async () => {
      const { data } = await api.get<ApiResponse<Record<string, unknown>>>(
        `${ORDERS_BASE}/${orderId}`,
      );
      return normalizeApiOrder(data.data);
    },
    () => {
      const order = resolveMockOrders().find((o) => o.id === orderId || o.orderNumber === orderId);
      if (!order) throw new Error('Order not found');
      return order;
    },
  );
}

export async function fetchOrderTracking(orderId: string): Promise<OrderTracking> {
  return withMockFallback(
    async () => {
      const { data } = await api.get<ApiResponse<OrderTracking>>(
        `${ORDERS_BASE}/${orderId}/tracking`,
      );
      return data.data;
    },
    () => {
      const order = resolveMockOrders().find((o) => o.id === orderId);
      if (!order?.tracking) {
        throw new Error('Tracking not available');
      }
      return order.tracking;
    },
  );
}

export async function reorderItems(orderId: string): Promise<ReorderResponse> {
  return withMockFallback(
    async () => {
      const { data } = await api.post<ApiResponse<ReorderResponse>>(
        `${ORDERS_BASE}/${orderId}/reorder`,
      );
      return data.data;
    },
    () => {
      const order = resolveMockOrders().find((o) => o.id === orderId);
      if (!order) throw new Error('Order not found');

      return {
        cartItemCount: order.products.length,
        message: 'Items added to cart',
        products: order.products,
      };
    },
  );
}

export async function cancelOrder(
  orderId: string,
  payload: CancelOrderPayload = {},
): Promise<Order> {
  return withMockFallback(
    async () => {
      const { data } = await api.post<ApiResponse<Record<string, unknown>>>(
        `${ORDERS_BASE}/${orderId}/cancel`,
        payload,
      );
      return normalizeApiOrder(data.data);
    },
    () => {
      const order = resolveMockOrders().find((o) => o.id === orderId);
      if (!order) throw new Error('Order not found');
      return {
        ...order,
        status: 'cancelled',
        cancellationReason: payload.reason ?? 'Cancelled by customer',
        paymentStatus: 'refunded',
        refund: { status: 'pending', amount: order.grandTotal },
      };
    },
  );
}

export async function fetchOrderInvoice(orderId: string): Promise<{ url: string }> {
  return withMockFallback(
    async () => {
      const { data } = await api.get<ApiResponse<{ url: string }>>(
        `${ORDERS_BASE}/${orderId}/invoice`,
      );
      return data.data;
    },
    () => ({
      url: `https://api.dhoodhwala.com/invoices/${orderId}.pdf`,
    }),
  );
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
