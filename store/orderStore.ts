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
  quantityLabel: string;
  unitPriceLabel: string;
  total: number;
  gstRate: number;
  gstAmount: number;
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

const SKYLINE_SITE: DeliverySite = {
  id: 'site-a',
  name: 'Skyline Tower Site',
  address: 'Andheri East, Near SEEPZ, Mumbai - 400093',
};

export const SAMPLE_ORDERS: Order[] = [
  {
    id: 'BJW-88294',
    status: 'in_transit',
    productName: 'UltraTech Premium Cement',
    description:
      'Grade 53 OPC - High strength cement for critical structural elements like slabs, columns, and beams.',
    price: 425,
    unit: 'bag',
    imageSearch: 'ultratech',
    badge: null,
    isBulkDiscount: false,
    items: [
      {
        id: 'c1',
        name: 'UltraTech Premium PPC Cement',
        description: '50kg Bag',
        image: 'ultratech cement bags warehouse',
        unitPrice: 425,
        bulkPrice: 398.5,
        bulkThreshold: 50,
        quantity: 50,
        unit: 'Bags',
      },
      {
        id: 's2',
        name: 'JSW Neo Steel Bars',
        description: '12mm Fe550D',
        image: 'jsw steel rods construction',
        unitPrice: 61000,
        bulkPrice: 57200,
        bulkThreshold: 10,
        quantity: 2,
        unit: 'MT',
      },
    ],
    materials: [
      {
        id: 'm1',
        name: 'UltraTech Premium PPC Cement',
        description: '50kg Bag',
        imageSearch: 'ultratech',
        quantityLabel: '50 Bags',
        unitPriceLabel: '₹425',
        total: 21250,
        gstRate: 18,
        gstAmount: 3825,
      },
      {
        id: 'm2',
        name: 'JSW Neosteel TMT Bars',
        description: '12mm Fe550D',
        imageSearch: 'jsw-neosteel',
        quantityLabel: '2 MT',
        unitPriceLabel: '₹58,450',
        total: 116900,
        gstRate: 18,
        gstAmount: 21042,
      },
    ],
    timeline: [
      { label: 'Placed', time: '08:30 AM, Today', done: true },
      { label: 'Packed', time: '10:15 AM, Today', done: true },
      { label: 'Dispatched', time: '11:00 AM, Today', done: true },
      { label: 'Out for Delivery', time: 'Started at 12:45 PM', done: false, active: true },
      { label: 'Delivered', time: 'Expected by 4:15 PM', done: false },
    ],
    trackingTimeline: [
      { label: 'Dispatched', time: '', done: true },
      { label: 'In Transit', time: 'LIVE', done: false, active: true },
      { label: 'Estimated Arrival', time: '4:15 PM Today', done: false },
    ],
    deliverySite: SKYLINE_SITE,
    driverName: 'Rajesh Kumar',
    vehicleNumber: 'MH 01 AB 1234',
    loyaltyPointsEarned: 1250,
    invoiceId: 'BJW-INV-88294',
    invoiceFileName: 'Invoice_BJW_88294.pdf',
    invoiceFileSize: '1.2 MB',
    totalPayable: 138150,
    subtotal: 138150,
    gst: 24867,
    deliveryFee: 0,
    total: 138150,
    createdAt: new Date(),
    eta: '4:15 PM Today',
    deliveredEarly: false,
    paymentMethod: 'corporate_credit',
    paymentMethodLabel: 'Corporate Credit Line Ending in ••8821',
    deliveryETA: 'Today, 4:15 PM',
    arrivingBy: '4:15 PM Today',
    warehouse: 'Thane West Hub Warehouse',
    statusLabel: 'ON THE WAY',
    quantitySummary: '50 Bags Cement + 2 MT Steel',
    productGrade: 'Ultratech Premium Grade',
  },
  {
    id: 'BJW-88251',
    status: 'delivered',
    productName: 'M-Sand Zone II',
    description: 'Manufactured sand for concrete and plaster work',
    price: 1800,
    unit: 'ton',
    imageSearch: 'manufactured sand construction',
    badge: null,
    isBulkDiscount: false,
    items: [
      {
        id: 'sa1',
        name: 'M-Sand (Manufactured)',
        description: 'Zone II Grade',
        image: 'manufactured sand construction',
        unitPrice: 1800,
        bulkPrice: 1550,
        bulkThreshold: 5,
        quantity: 5,
        unit: 'Tons',
      },
    ],
    materials: [
      {
        id: 'm1',
        name: 'M-Sand Zone II',
        description: 'Zone II Grade',
        imageSearch: 'manufactured sand construction',
        quantityLabel: '5 Tons',
        unitPriceLabel: '₹1,800',
        total: 9000,
        gstRate: 18,
        gstAmount: 1620,
      },
    ],
    timeline: [
      { label: 'Placed', time: 'Mon, 10:00 AM', done: true },
      { label: 'Packed', time: 'Mon, 12:00 PM', done: true },
      { label: 'Dispatched', time: 'Mon, 2:00 PM', done: true },
      { label: 'Out for Delivery', time: 'Mon, 3:30 PM', done: true },
      { label: 'Delivered', time: 'Mon, 4:30 PM', done: true },
    ],
    trackingTimeline: [
      { label: 'Dispatched', time: '', done: true },
      { label: 'In Transit', time: '', done: true },
      { label: 'Estimated Arrival', time: 'Delivered', done: true },
    ],
    deliverySite: SKYLINE_SITE,
    driverName: 'Rajesh Kumar',
    vehicleNumber: 'MH 01 AB 1234',
    loyaltyPointsEarned: 90,
    invoiceId: 'BJW-INV-88251',
    invoiceFileName: 'Invoice_BJW_88251.pdf',
    invoiceFileSize: '850 KB',
    totalPayable: 9000,
    subtotal: 9000,
    gst: 1620,
    deliveryFee: 0,
    total: 9000,
    createdAt: new Date(Date.now() - 3 * 86400000),
    deliveredAt: new Date(Date.now() - 2 * 86400000),
    deliveredEarly: true,
    paymentMethod: 'upi',
    paymentMethodLabel: 'Google Pay',
    deliveryETA: 'Delivered',
    arrivingBy: 'Delivered',
    warehouse: 'Thane West Hub Warehouse',
    statusLabel: 'DELIVERED',
    quantitySummary: '5 Tons M-Sand',
    productGrade: 'Zone II',
  },
  {
    id: 'BJW-88200',
    status: 'delivered',
    productName: '20mm Stone Aggregate',
    description: 'Premium crushed stone aggregate for concrete',
    price: 1600,
    unit: 'MT',
    imageSearch: 'crushed stone aggregate construction',
    badge: null,
    isBulkDiscount: false,
    items: [
      {
        id: 'sc1',
        name: '20mm Stone Aggregate',
        description: '20mm Grade',
        image: 'stone aggregate construction',
        unitPrice: 1600,
        bulkPrice: 1380,
        bulkThreshold: 5,
        quantity: 3,
        unit: 'MT',
      },
    ],
    materials: [
      {
        id: 'm1',
        name: '20mm Stone Aggregate',
        description: '20mm Grade',
        imageSearch: 'crushed stone aggregate construction',
        quantityLabel: '3 MT',
        unitPriceLabel: '₹1,600',
        total: 4800,
        gstRate: 18,
        gstAmount: 864,
      },
    ],
    timeline: [
      { label: 'Placed', time: 'Wed, 10:00 AM', done: true },
      { label: 'Packed', time: 'Wed, 12:00 PM', done: true },
      { label: 'Dispatched', time: 'Wed, 2:00 PM', done: true },
      { label: 'Out for Delivery', time: 'Wed, 3:30 PM', done: true },
      { label: 'Delivered', time: 'Wed, 5:00 PM', done: true },
    ],
    trackingTimeline: [
      { label: 'Dispatched', time: '', done: true },
      { label: 'In Transit', time: '', done: true },
      { label: 'Estimated Arrival', time: 'Delivered', done: true },
    ],
    deliverySite: SKYLINE_SITE,
    driverName: 'Rajesh Kumar',
    vehicleNumber: 'MH 01 AB 1234',
    loyaltyPointsEarned: 48,
    invoiceId: 'BJW-INV-88200',
    invoiceFileName: 'Invoice_BJW_88200.pdf',
    invoiceFileSize: '750 KB',
    totalPayable: 4800,
    subtotal: 4800,
    gst: 864,
    deliveryFee: 0,
    total: 4800,
    createdAt: new Date(Date.now() - 7 * 86400000),
    deliveredAt: new Date(Date.now() - 6 * 86400000),
    deliveredEarly: false,
    refundAmount: 339,
    paymentMethod: 'cod',
    paymentMethodLabel: 'Pay on Delivery',
    deliveryETA: 'Delivered',
    arrivingBy: 'Delivered',
    warehouse: 'Thane West Hub Warehouse',
    statusLabel: 'DELIVERED',
    quantitySummary: '3 MT Aggregate',
    productGrade: '20mm Grade',
  },
];

export function generateOrderId(): string {
  return `BJW-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generateInvoiceId(): string {
  return `BJW-INV-${Math.floor(10000 + Math.random() * 90000)}`;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: SAMPLE_ORDERS,
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
