import { create } from 'zustand';

import type { CartItem } from '@store/cartStore';
import type { DeliverySite } from '@store/deliveryStore';

export type OrderStatus =
  | 'processing'
  | 'packed'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface OrderTimelineStep {
  label: string;
  time: string;
  done: boolean;
  active?: boolean;
}

export interface OrderMaterial {
  id: string;
  name: string;
  description: string;
  imageSearch: string;
  productId?: string;
  cartLineId?: string;
  quantityLabel: string;
  unitPriceLabel: string;
  total: number;
  gstRate: number;
  gstAmount: number;
  quantity?: number;
  unitPrice?: number;
  bulkApplied?: boolean;
  vehicleType?: string;
  estimatedWeight?: number;
  deliveryMode?: string;
  eta?: string;
}

export interface LastOrderedProduct extends CartItem {
  orderedAt: Date;
  orderId: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  productName: string;
  description: string;
  price: number;
  unit: string;
  imageSearch: string;
  badge: string | null;
  isBulkDiscount: boolean;
  bulkDiscountLabel?: string;
  minUnits?: number;
  items: CartItem[];
  materials: OrderMaterial[];
  timeline: OrderTimelineStep[];
  trackingTimeline: OrderTimelineStep[];
  deliverySite: DeliverySite;
  driverName: string;
  vehicleNumber: string;
  loyaltyPointsEarned: number;
  invoiceId: string;
  invoiceFileName: string;
  invoiceFileSize: string;
  totalPayable: number;
  subtotal: number;
  gst: number;
  deliveryFee: number;
  total: number;
  createdAt: Date;
  deliveredAt?: Date;
  deliveredEarly?: boolean;
  estimatedDelivery?: string;
  eta?: string;
  refundAmount?: number;
  paymentMethod: string;
  paymentMethodLabel: string;
  deliveryETA: string;
  arrivingBy: string;
  warehouse: string;
  statusLabel: string;
  quantitySummary: string;
  productGrade: string;
}

interface OrderState {
  orders: Order[];
  lastOrderId: string | null;
  proTipDismissed: boolean;
  addOrder: (order: Order) => void;
  getOrder: (id: string) => Order | undefined;
  setLastOrderId: (id: string) => void;
  dismissProTip: () => void;
  activeOrderCount: () => number;
  refreshOrders: () => void;
  getLastOrderedProducts: () => LastOrderedProduct[];
}

/** Empty — customer orders are loaded from GET /orders. */
export const SAMPLE_ORDERS: Order[] = [];

export function generateOrderId(): string {
  return `BJW-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generateInvoiceId(): string {
  return `BJW-INV-${Math.floor(10000 + Math.random() * 90000)}`;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  lastOrderId: null,
  proTipDismissed: false,

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders.filter((o) => o.id !== order.id)],
      lastOrderId: order.id,
    })),

  getOrder: (id) => get().orders.find((o) => o.id === id),

  setLastOrderId: (id) => set({ lastOrderId: id }),

  dismissProTip: () => set({ proTipDismissed: true }),

  activeOrderCount: () =>
    get().orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length,

  refreshOrders: () =>
    set((state) => ({
      orders: [...state.orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    })),

  getLastOrderedProducts: () => {
    const state = get();
    const seen = new Set<string>();
    const result: LastOrderedProduct[] = [];

    const sorted = [...state.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    for (const order of sorted) {
      for (const item of order.items) {
        if (!seen.has(item.id) && result.length < 3) {
          seen.add(item.id);
          result.push({
            ...item,
            orderedAt: order.createdAt,
            orderId: order.id,
          });
        }
      }
    }
    return result;
  },
}));
