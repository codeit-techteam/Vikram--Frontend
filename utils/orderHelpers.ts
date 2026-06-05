import type { ImageSource } from 'expo-image';

import { images } from '@constants/images';
import type { CartItem } from '@store/cartStore';
import type { DeliverySite } from '@store/deliveryStore';
import {
  generateInvoiceId,
  type Order,
  type OrderMaterial,
} from '@store/orderStore';
import { getLineTotal } from '@store/cartStore';

export function getOrderImageUrl(searchTerm: string): string {
  const query = encodeURIComponent(searchTerm.replace(/\s+/g, ','));
  return `https://source.unsplash.com/featured/800x400/?${query}`;
}

export function getOrderImageSource(searchTerm: string): ImageSource {
  const key = searchTerm.toLowerCase();

  if (key === 'ultratech' || key.includes('ultratech') || key.includes('cement')) {
    return images.productUltratechBags;
  }
  if (
    key === 'jsw-neosteel' ||
    key.includes('jsw') ||
    key.includes('neosteel') ||
    (key.includes('tmt') && key.includes('steel'))
  ) {
    return images.productJswNeosteel;
  }
  if (
    key.includes('crushed stone') ||
    key.includes('stone aggregate') ||
    key.includes('blue metal')
  ) {
    return images.productCrushedStoneAggregate;
  }

  return { uri: getOrderImageUrl(searchTerm) };
}

export function buildOrderFromCheckout(params: {
  id: string;
  items: CartItem[];
  total: number;
  site: DeliverySite;
  paymentMethod: string;
  deliveryETA: string;
}): Order {
  const primary = params.items[0];
  const subtotal = params.items.reduce((sum, i) => sum + getLineTotal(i), 0);
  const gst = Math.round(subtotal * 0.18);
  const invoiceId = generateInvoiceId();

  const materials: OrderMaterial[] = params.items.map((item, idx) => ({
    id: `m-${idx}`,
    name: item.name,
    description: item.description,
    imageSearch: item.image,
    quantityLabel: `${item.quantity} ${item.unit}`,
    unitPriceLabel: `₹${item.unitPrice.toLocaleString('en-IN')}`,
    total: getLineTotal(item),
    gstRate: 18,
    gstAmount: Math.round(getLineTotal(item) * 0.18),
  }));

  return {
    id: params.id,
    status: 'processing',
    productName: primary?.name ?? 'Order',
    description: primary?.description ?? '',
    price: primary?.unitPrice ?? 0,
    unit: primary?.unit ?? 'unit',
    imageSearch: primary?.image ?? 'construction materials',
    badge: 'GET READY',
    isBulkDiscount: false,
    items: params.items,
    materials,
    timeline: [
      { label: 'Placed', time: new Date().toLocaleTimeString('en-IN'), done: true },
      { label: 'Packed', time: 'Pending', done: false },
      { label: 'Dispatched', time: 'Pending', done: false },
      { label: 'Out for Delivery', time: 'Pending', done: false },
      { label: 'Delivered', time: 'Pending', done: false },
    ],
    trackingTimeline: [
      { label: 'Dispatched', time: '', done: false },
      { label: 'In Transit', time: '', done: false, active: false },
      { label: 'Estimated Arrival', time: params.deliveryETA, done: false },
    ],
    deliverySite: params.site,
    driverName: 'Rajesh Kumar',
    vehicleNumber: 'MH 01 AB 1234',
    loyaltyPointsEarned: Math.round(params.total / 100),
    invoiceId,
    invoiceFileName: `Invoice_${params.id.replace('-', '_')}.pdf`,
    invoiceFileSize: '1.0 MB',
    totalPayable: params.total,
    subtotal,
    gst,
    deliveryFee: 0,
    total: params.total,
    createdAt: new Date(),
    paymentMethod: params.paymentMethod,
    paymentMethodLabel: params.paymentMethod.replace('_', ' '),
    deliveryETA: params.deliveryETA,
    arrivingBy: params.deliveryETA,
    warehouse: 'Thane West Hub Warehouse',
    statusLabel: 'PROCESSING',
    quantitySummary: `${params.items.reduce((s, i) => s + i.quantity, 0)} items`,
    productGrade: primary?.unit ?? '',
  };
}
