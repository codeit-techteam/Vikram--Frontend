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
}

const SKYLINE_SITE: DeliverySite = {
  id: 'site-a',
  name: 'Skyline Tower Site',
  address: 'Andheri East, Near SEEPZ, Mumbai - 400093',
};

export const SAMPLE_ORDERS: Order[] = [
  {
    id: 'CIQ-88294',
    status: 'in_transit',
    productName: 'UltraTech Premium Cement',
    description:
      'Grade 53 OPC - High strength cement for critical structural elements like slabs, columns, and beams.',
    price: 425,
    unit: 'bag',
    imageSearch: 'ultratech',
    badge: 'GET READY',
    isBulkDiscount: false,
    items: [],
    materials: [
      {
        id: 'm1',
        name: 'Ultra-Tech Cement (Grade 53)',
        description: 'Industrial Premium Blend • 50kg Bags',
        imageSearch: 'ultratech',
        quantityLabel: '200 Bags',
        unitPriceLabel: '₹570',
        total: 114000,
        gstRate: 18,
        gstAmount: 24857,
      },
      {
        id: 'm2',
        name: 'Jindal Panther TMT 12mm',
        description: 'High-Ductility Reinforcement Bars',
        imageSearch: 'jsw-neosteel',
        quantityLabel: '5 Tons',
        unitPriceLabel: '₹69,000',
        total: 345000,
        gstRate: 18,
        gstAmount: 62827,
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
    invoiceId: 'CIQ-INV-88294',
    invoiceFileName: 'Invoice_CIQ_88294.pdf',
    invoiceFileSize: '1.2 MB',
    totalPayable: 541564,
    subtotal: 459000,
    gst: 77564,
    deliveryFee: 0,
    total: 541564,
    createdAt: new Date(),
    paymentMethod: 'corporate_credit',
    paymentMethodLabel: 'Corporate Credit Line Ending in ••8821',
    deliveryETA: 'Today, 4:15 PM',
    arrivingBy: '4:15 PM Today',
    warehouse: 'Thane West Hub Warehouse',
    statusLabel: 'ON THE WAY',
    quantitySummary: '100 Bags Cement',
    productGrade: 'Ultratech Premium Grade',
  },
  {
    id: 'CIQ-88295',
    status: 'processing',
    productName: 'JSW Neosteel TMT Bars',
    description: '12mm FE550D High Ductility bars for earthquake-resistant structures.',
    price: 58450,
    unit: 'ton',
    imageSearch: 'jsw-neosteel',
    badge: 'BULK SAVINGS',
    isBulkDiscount: true,
    bulkDiscountLabel: 'Bulk Discount',
    items: [],
    materials: [],
    timeline: [
      { label: 'Placed', time: '09:00 AM, Today', done: true },
      { label: 'Packed', time: 'Pending', done: false },
      { label: 'Dispatched', time: 'Pending', done: false },
      { label: 'Out for Delivery', time: 'Pending', done: false },
      { label: 'Delivered', time: 'Pending', done: false },
    ],
    trackingTimeline: [
      { label: 'Dispatched', time: '', done: false },
      { label: 'In Transit', time: '', done: false },
      { label: 'Estimated Arrival', time: 'Tomorrow', done: false },
    ],
    deliverySite: SKYLINE_SITE,
    driverName: 'Rajesh Kumar',
    vehicleNumber: 'MH 01 AB 1234',
    loyaltyPointsEarned: 850,
    invoiceId: 'CIQ-INV-88295',
    invoiceFileName: 'Invoice_CIQ_88295.pdf',
    invoiceFileSize: '980 KB',
    totalPayable: 58450,
    subtotal: 49534,
    gst: 8916,
    deliveryFee: 0,
    total: 58450,
    createdAt: new Date(Date.now() - 86400000),
    paymentMethod: 'upi',
    paymentMethodLabel: 'Google Pay',
    deliveryETA: 'Tomorrow, 11:00 AM',
    arrivingBy: 'Tomorrow, 11:00 AM',
    warehouse: 'Thane West Hub Warehouse',
    statusLabel: 'PROCESSING',
    quantitySummary: '1.5 Tons TMT Bars',
    productGrade: 'FE550D Grade',
  },
  {
    id: 'CIQ-88296',
    status: 'delivered',
    productName: 'Crushed Stone Aggregates',
    description: '20mm Grade - Premium Blue Metal',
    price: 1850,
    unit: 'unit',
    imageSearch: 'crushed stone aggregate construction',
    badge: null,
    isBulkDiscount: false,
    minUnits: 15,
    items: [],
    materials: [],
    timeline: [
      { label: 'Placed', time: 'Oct 20, 10:00 AM', done: true },
      { label: 'Packed', time: 'Oct 20, 12:00 PM', done: true },
      { label: 'Dispatched', time: 'Oct 20, 2:00 PM', done: true },
      { label: 'Out for Delivery', time: 'Oct 20, 3:30 PM', done: true },
      { label: 'Delivered', time: 'Oct 20, 5:00 PM', done: true },
    ],
    trackingTimeline: [
      { label: 'Dispatched', time: '', done: true },
      { label: 'In Transit', time: '', done: true },
      { label: 'Estimated Arrival', time: 'Delivered', done: true },
    ],
    deliverySite: SKYLINE_SITE,
    driverName: 'Rajesh Kumar',
    vehicleNumber: 'MH 01 AB 1234',
    loyaltyPointsEarned: 320,
    invoiceId: 'CIQ-INV-88296',
    invoiceFileName: 'Invoice_CIQ_88296.pdf',
    invoiceFileSize: '750 KB',
    totalPayable: 27750,
    subtotal: 23517,
    gst: 4233,
    deliveryFee: 0,
    total: 27750,
    createdAt: new Date(Date.now() - 7 * 86400000),
    paymentMethod: 'cod',
    paymentMethodLabel: 'Pay on Delivery',
    deliveryETA: 'Delivered',
    arrivingBy: 'Delivered Oct 20',
    warehouse: 'Thane West Hub Warehouse',
    statusLabel: 'DELIVERED',
    quantitySummary: '15 Units Aggregate',
    productGrade: '20mm Grade',
  },
];

export function generateOrderId(): string {
  return `CIQ-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generateInvoiceId(): string {
  return `CIQ-INV-${Math.floor(10000 + Math.random() * 90000)}`;
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
}));
