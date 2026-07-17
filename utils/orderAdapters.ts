import { ACTIVE_ORDER_STATUSES, matchesFilter } from '@constants/orderStatus';
import type {
  Order,
  OrderProduct,
  OrderStatus,
  OrdersPage,
  OrderFilterStatus,
  ShippingAddress,
  TimelineStep,
} from '@/types/order';
import type { Order as LegacyOrder, OrderStatus as LegacyOrderStatus } from '@store/orderStore';
import { SAMPLE_ORDERS } from '@store/orderStore';

const LEGACY_STATUS_MAP: Record<LegacyOrderStatus, OrderStatus> = {
  processing: 'processing',
  packed: 'packed',
  dispatched: 'ready_for_dispatch',
  in_transit: 'out_for_delivery',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

function mapLegacyStatus(status: LegacyOrderStatus): OrderStatus {
  return LEGACY_STATUS_MAP[status] ?? 'processing';
}

function buildDefaultTimeline(status: OrderStatus): TimelineStep[] {
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
    done: index < current,
    active: index === current,
  }));
}

function buildTimeline(order: LegacyOrder, status: OrderStatus): TimelineStep[] {
  if (order.timeline?.length) {
    return order.timeline.map((step, index) => ({
      key: `step-${index}`,
      label: step.label,
      time: step.time,
      done: step.done,
      active: step.active,
    }));
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
    done: index < current,
    active: index === current,
  }));
}

function mapProducts(order: LegacyOrder): OrderProduct[] {
  if (order.items.length > 0) {
    return order.items.map((item) => ({
      id: item.id,
      productId: item.productId ?? item.id,
      name: item.name ?? item.productName ?? 'Product',
      brand: item.productName !== item.name ? item.productName : undefined,
      variant: item.variantLabel ?? item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
      image: item.image,
      imageSearch: item.imageSearch ?? item.image,
      delivered: order.status === 'delivered',
    }));
  }

  if (order.materials.length > 0) {
    return order.materials.map((mat) => ({
      id: mat.id,
      productId: mat.productId ?? mat.id,
      name: mat.name,
      variant: mat.description,
      quantity: 1,
      unit: '',
      unitPrice: mat.total,
      totalPrice: mat.total,
      imageSearch: mat.imageSearch,
      delivered: order.status === 'delivered',
    }));
  }

  return [
    {
      id: order.id,
      productId: order.id,
      name: order.productName,
      variant: order.description,
      quantity: 1,
      unit: order.unit,
      unitPrice: order.price,
      totalPrice: order.total,
      imageSearch: order.imageSearch,
      delivered: order.status === 'delivered',
    },
  ];
}

function mapShippingAddress(order: LegacyOrder): ShippingAddress {
  return {
    name: order.deliverySite.name,
    phone: '+91 98765 43210',
    address: order.deliverySite.address,
    pin: '400093',
  };
}

export function adaptLegacyOrder(order: LegacyOrder): Order {
  const status = mapLegacyStatus(order.status);
  const products = mapProducts(order);

  return {
    id: order.id,
    orderNumber: order.id,
    status,
    createdAt: order.createdAt.toISOString(),
    expectedDelivery: order.estimatedDelivery ?? order.deliveryETA ?? order.arrivingBy,
    deliveredAt: order.deliveredAt?.toISOString(),
    products,
    subtotal: order.subtotal,
    discount: 0,
    gst: order.gst,
    couponDiscount: 0,
    deliveryCharge: order.deliveryFee,
    platformFee: 0,
    grandTotal: order.totalPayable ?? order.total,
    savings: order.refundAmount ? order.refundAmount : undefined,
    paymentStatus: order.status === 'cancelled' ? 'failed' : 'paid',
    paymentMethod: order.paymentMethod,
    paymentMethodLabel: order.paymentMethodLabel,
    transactionId: `TXN-${order.id.replace('BJW-', '')}`,
    shippingAddress: mapShippingAddress(order),
    tracking: ACTIVE_ORDER_STATUSES.includes(status)
      ? {
          currentStep: status,
          steps: order.trackingTimeline.map((step, index) => ({
            key: `track-${index}`,
            label: step.label,
            time: step.time,
            done: step.done,
            active: step.active,
          })),
          estimatedArrival: order.arrivingBy ?? order.eta,
          estimatedMinutes: status === 'out_for_delivery' ? 8 : undefined,
          warehouse: order.warehouse,
          driver: {
            name: order.driverName,
            phone: '+919999999999',
            vehicleNumber: order.vehicleNumber,
          },
        }
      : undefined,
    refund: order.refundAmount
      ? { status: 'credited', amount: order.refundAmount }
      : undefined,
    driver: {
      name: order.driverName,
      phone: '+919999999999',
      vehicleNumber: order.vehicleNumber,
    },
    invoiceId: order.invoiceId,
    invoiceFileName: order.invoiceFileName,
    timeline: buildTimeline(order, status),
    deliveredEarly: order.deliveredEarly,
    loyaltyPointsEarned: order.loyaltyPointsEarned,
  };
}

export function getMockOrders(): Order[] {
  return SAMPLE_ORDERS.map(adaptLegacyOrder);
}

export function filterMockOrders(
  orders: Order[],
  status?: OrderFilterStatus,
  search?: string,
): Order[] {
  let filtered = orders;

  if (status && status !== 'all') {
    filtered = filtered.filter((order) => matchesFilter(order.status, status));
  }

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        order.products.some(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand?.toLowerCase().includes(q) ||
            p.variant?.toLowerCase().includes(q),
        ),
    );
  }

  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function paginateMockOrders(
  orders: Order[],
  cursor?: string,
  limit = 10,
): OrdersPage {
  const startIndex = cursor ? orders.findIndex((o) => o.id === cursor) + 1 : 0;
  const items = orders.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < orders.length;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  return {
    items,
    nextCursor,
    hasMore,
    total: orders.length,
  };
}

export function normalizeApiOrder(raw: Record<string, unknown>): Order {
  const products = Array.isArray(raw.products)
    ? (raw.products as Record<string, unknown>[]).map((p) => ({
        id: String(p.id ?? ''),
        productId: String(p.productId ?? p.id ?? ''),
        name: String(p.name ?? ''),
        brand: p.brand ? String(p.brand) : undefined,
        variant: p.variant ? String(p.variant) : undefined,
        quantity: Number(p.quantity ?? 1),
        unit: String(p.unit ?? ''),
        unitPrice: Number(p.unitPrice ?? 0),
        totalPrice: Number(p.totalPrice ?? p.unitPrice ?? 0),
        image: p.image ? String(p.image) : undefined,
        imageSearch: p.imageSearch ? String(p.imageSearch) : undefined,
        delivered: Boolean(p.delivered),
      }))
    : [];

  const address = (raw.shippingAddress ?? {}) as Record<string, unknown>;

  return {
    id: String(raw.id ?? ''),
    orderNumber: String(raw.orderNumber ?? raw.id ?? ''),
    status: (raw.status as OrderStatus) ?? 'pending',
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    expectedDelivery: raw.expectedDelivery ? String(raw.expectedDelivery) : undefined,
    deliveredAt: raw.deliveredAt ? String(raw.deliveredAt) : undefined,
    products,
    subtotal: Number(raw.subtotal ?? 0),
    discount: Number(raw.discount ?? 0),
    gst: Number(raw.gst ?? 0),
    couponDiscount: Number(raw.couponDiscount ?? 0),
    deliveryCharge: Number(raw.deliveryCharge ?? 0),
    platformFee: Number(raw.platformFee ?? 0),
    grandTotal: Number(raw.grandTotal ?? raw.total ?? 0),
    savings: raw.savings ? Number(raw.savings) : undefined,
    paymentStatus: (raw.paymentStatus as Order['paymentStatus']) ?? 'paid',
    paymentMethod: String(raw.paymentMethod ?? ''),
    paymentMethodLabel: raw.paymentMethodLabel ? String(raw.paymentMethodLabel) : undefined,
    transactionId: raw.transactionId ? String(raw.transactionId) : undefined,
    shippingAddress: {
      name: String(address.name ?? ''),
      phone: String(address.phone ?? ''),
      address: String(address.address ?? ''),
      pin: String(address.pin ?? ''),
      instructions: address.instructions ? String(address.instructions) : undefined,
    },
    tracking: raw.tracking as Order['tracking'],
    refund: raw.refund as Order['refund'],
    driver: raw.driver as Order['driver'],
    cancellationReason: raw.cancellationReason ? String(raw.cancellationReason) : undefined,
    invoiceUrl: raw.invoiceUrl ? String(raw.invoiceUrl) : undefined,
    invoiceId: raw.invoiceId ? String(raw.invoiceId) : undefined,
    invoiceFileName: raw.invoiceFileName ? String(raw.invoiceFileName) : undefined,
    timeline: Array.isArray(raw.timeline)
      ? (raw.timeline as TimelineStep[])
      : buildDefaultTimeline((raw.status as OrderStatus) ?? 'pending'),
    deliveredEarly: Boolean(raw.deliveredEarly),
    loyaltyPointsEarned: raw.loyaltyPointsEarned
      ? Number(raw.loyaltyPointsEarned)
      : undefined,
  };
}
