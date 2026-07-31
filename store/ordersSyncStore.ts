import { create } from 'zustand';

import { ACTIVE_ORDER_STATUSES } from '@constants/orderStatus';
import type { Order } from '@/types/order';
import { mergeOrderState, preferFresherOrder } from '@utils/orderMerge';

/**
 * Single source of truth for customer orders.
 * React Query caches mirror this store; screens subscribe via useOrder / useOrders
 * and/or select from here so list + details never diverge.
 */
interface OrdersSyncState {
  ordersById: Record<string, Order>;
  selectedOrderId: string | null;

  upsertOrder: (order: Order) => Order;
  upsertMany: (orders: Order[]) => void;
  getOrder: (id: string) => Order | undefined;
  selectOrder: (id: string | null) => void;
  getSelectedOrder: () => Order | undefined;
  getActiveOrders: () => Order[];
  getCompletedOrders: () => Order[];
  clear: () => void;
}

export const useOrdersSyncStore = create<OrdersSyncState>((set, get) => ({
  ordersById: {},
  selectedOrderId: null,

  upsertOrder: (order) => {
    const existing = get().ordersById[order.id];
    const merged = existing ? mergeOrderState(existing, order) : mergeOrderState(null, order);
    set((state) => ({
      ordersById: { ...state.ordersById, [merged.id]: merged },
    }));
    return merged;
  },

  upsertMany: (orders) => {
    if (!orders.length) return;
    set((state) => {
      const next = { ...state.ordersById };
      for (const order of orders) {
        const existing = next[order.id];
        next[order.id] = existing
          ? preferFresherOrder(existing, order)
          : mergeOrderState(null, order);
      }
      return { ordersById: next };
    });
  },

  getOrder: (id) => get().ordersById[id],

  selectOrder: (id) => set({ selectedOrderId: id }),

  getSelectedOrder: () => {
    const { selectedOrderId, ordersById } = get();
    return selectedOrderId ? ordersById[selectedOrderId] : undefined;
  },

  getActiveOrders: () =>
    Object.values(get().ordersById).filter((o) =>
      ACTIVE_ORDER_STATUSES.includes(o.status),
    ),

  getCompletedOrders: () =>
    Object.values(get().ordersById).filter(
      (o) =>
        o.status === 'delivered' ||
        o.status === 'cancelled' ||
        o.status === 'refunded',
    ),

  clear: () => set({ ordersById: {}, selectedOrderId: null }),
}));
