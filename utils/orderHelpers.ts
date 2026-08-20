import type { CartItem } from '@store/cartStore';
import { getEffectivePrice, getLineTotal } from '@store/cartStore';
import type { DeliverySite } from '@store/deliveryStore';
import {
  generateInvoiceId,
  type Order,
  type OrderMaterial,
} from '@store/orderStore';
import { getCartItemImageSource } from '@utils/cartHelpers';
import { calculateEarnPoints } from '@utils/loyaltyPricing';

/** Primary order hero image — same resolver as cart/catalog. */
export function getOrderPrimaryImageSource(order: Order) {
  const first = order.items[0];
  if (first) return getCartItemImageSource(first);
  return null;
}

/** Material row image — prefers linked cart line, then product id. */
export function getOrderMaterialImageSource(
  material: OrderMaterial,
  cartItem?: CartItem,
) {
  if (cartItem) return getCartItemImageSource(cartItem);
  if (material.cartLineId || material.productId) {
    return getCartItemImageSource({
      id: material.cartLineId ?? material.productId ?? material.id,
      productId: material.productId,
      imageSearch: material.imageSearch,
      image: material.imageSearch,
      name: material.name,
      description: material.description,
      unitPrice: 0,
      bulkPrice: 0,
      bulkThreshold: 0,
      quantity: 1,
      unit: '',
    });
  }
  return null;
}

import { getPaymentMethodLabel } from '@utils/paymentMethodLabels';

export function buildOrderFromCheckout(params: {
  id: string;
  items: CartItem[];
  total: number;
  site: DeliverySite;
  paymentMethod: string;
  deliveryETA: string;
  warehouse?: string;
}): Order {
  const primary = params.items[0];
  const subtotal = params.items.reduce((sum, i) => sum + getLineTotal(i), 0);
  const gst = Math.round(subtotal * 0.18);
  const invoiceId = generateInvoiceId();

  const materials: OrderMaterial[] = params.items.map((item, idx) => ({
    id: `m-${idx}`,
    name: item.name,
    description: item.description,
    imageSearch: item.imageSearch ?? item.image,
    productId: item.productId,
    cartLineId: item.id,
    quantityLabel: `${item.quantity} ${item.unit}`,
    unitPriceLabel: `₹${(item.appliedPrice ?? item.unitPrice).toLocaleString('en-IN')}`,
    total: getLineTotal(item),
    gstRate: 18,
    gstAmount: Math.round(getLineTotal(item) * 0.18),
    quantity: item.quantity,
    unitPrice: item.appliedPrice ?? getEffectivePrice(item),
    bulkApplied: item.bulkApplied ?? false,
    vehicleType: item.vehicleType,
    estimatedWeight: item.estimatedWeightKg,
    deliveryMode: item.deliveryMode,
    eta: item.eta,
  }));

  return {
    id: params.id,
    status: 'processing',
    productName: primary?.name ?? 'Order',
    description: primary?.description ?? '',
    price: primary?.unitPrice ?? 0,
    unit: primary?.unit ?? 'unit',
    imageSearch: primary?.imageSearch ?? primary?.image ?? 'construction materials',
    badge: 'GET READY',
    isBulkDiscount: params.items.some((i) => i.bulkApplied),
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
    driverName: 'Assigning…',
    vehicleNumber: '—',
    loyaltyPointsEarned: calculateEarnPoints(subtotal),
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
    paymentMethodLabel: getPaymentMethodLabel(params.paymentMethod),
    deliveryETA: params.deliveryETA,
    arrivingBy: params.deliveryETA,
    eta: params.deliveryETA,
    estimatedDelivery: params.deliveryETA,
    warehouse: params.warehouse || 'Assigned Hub',
    statusLabel: 'PROCESSING',
    quantitySummary: `${params.items.reduce((s, i) => s + i.quantity, 0)} items`,
    productGrade: primary?.unit ?? '',
  };
}
