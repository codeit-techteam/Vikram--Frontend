import { ACTIVE_ORDER_STATUSES, matchesFilter } from '@constants/orderStatus';
import type {
  Order,
  OrderDriver,
  OrderProduct,
  OrderStatus,
  OrdersPage,
  OrderFilterStatus,
  ShippingAddress,
  TimelineStep,
} from '@/types/order';
import type { Order as LegacyOrder, OrderStatus as LegacyOrderStatus } from '@store/orderStore';

const LEGACY_STATUS_MAP: Record<LegacyOrderStatus, OrderStatus> = {
  processing: 'processing',
  packed: 'packed',
  dispatched: 'ready_for_dispatch',
  in_transit: 'out_for_delivery',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

const BACKEND_STATUS_MAP: Record<string, OrderStatus> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  HUB_ASSIGNED: 'confirmed',
  AWAITING_HUB_ALLOCATION: 'pending',
  PROCESSING: 'processing',
  PACKED: 'packed',
  READY_FOR_DISPATCH: 'ready_for_dispatch',
  DISPATCHED: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  pending: 'pending',
  confirmed: 'confirmed',
  processing: 'processing',
  packed: 'packed',
  ready_for_dispatch: 'ready_for_dispatch',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  cancelled: 'cancelled',
  payment_failed: 'payment_failed',
  refunded: 'refunded',
};

function mapLegacyStatus(status: LegacyOrderStatus): OrderStatus {
  return LEGACY_STATUS_MAP[status] ?? 'processing';
}

function mapBackendStatus(status: unknown): OrderStatus {
  if (!status) return 'pending';
  const key = String(status);
  return BACKEND_STATUS_MAP[key] ?? BACKEND_STATUS_MAP[key.toUpperCase()] ?? 'pending';
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
    phone: '',
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
  return [];
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

function mapApiProducts(raw: Record<string, unknown>): OrderProduct[] {
  const source = Array.isArray(raw.items)
    ? (raw.items as Record<string, unknown>[])
    : Array.isArray(raw.products)
      ? (raw.products as Record<string, unknown>[])
      : [];

  return source.map((p) => ({
    id: String(p.id ?? ''),
    productId: String(p.productId ?? p.id ?? ''),
    name: String(p.name ?? ''),
    brand: p.brand ? String(p.brand) : undefined,
    variant: p.variant ? String(p.variant) : undefined,
    quantity: Number(p.quantity ?? 1),
    unit: String(p.unit ?? ''),
    unitPrice: Number(p.unitPrice ?? 0),
    totalPrice: Number(p.totalPrice ?? p.subtotal ?? p.unitPrice ?? 0),
    image: p.image ? String(p.image) : undefined,
    imageSearch: p.imageSearch ? String(p.imageSearch) : undefined,
    delivered: Boolean(p.delivered),
  }));
}

function mapApiDriver(raw: Record<string, unknown>): OrderDriver | undefined {
  const tracking = raw.tracking as Record<string, unknown> | undefined;
  const driver = (raw.driver ?? tracking?.driver) as
    | Record<string, unknown>
    | null
    | undefined;
  if (!driver) return undefined;

  const vehicle = raw.vehicle as Record<string, unknown> | undefined;
  return {
    name: String(driver.name ?? ''),
    phone: String(driver.phone ?? ''),
    vehicleNumber: String(driver.vehicleNumber ?? vehicle?.registration ?? ''),
    image: driver.image ? String(driver.image) : undefined,
  };
}

export function normalizeApiOrder(raw: Record<string, unknown>): Order {
  const status = mapBackendStatus(raw.status ?? raw.orderStatus);
  const payment = (raw.payment ?? {}) as Record<string, unknown>;
  const addressRaw = (raw.address ??
    raw.shippingAddress ??
    raw.deliveryAddress ??
    {}) as Record<string, unknown>;
  const customer = (raw.customer ?? {}) as Record<string, unknown>;
  const hub = (raw.hub ?? {}) as Record<string, unknown>;
  const products = mapApiProducts(raw);
  const driver = mapApiDriver(raw);
  const timeline =
    Array.isArray(raw.timeline) && raw.timeline.length > 0
      ? (raw.timeline as Record<string, unknown>[]).map((entry, index) => ({
          key: String(entry.key ?? entry.status ?? `step-${index}`).toLowerCase(),
          label: String(entry.label ?? entry.statusLabel ?? entry.status ?? 'Update'),
          time: entry.time
            ? String(entry.time)
            : entry.createdAt
              ? new Date(String(entry.createdAt)).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : undefined,
          done: Boolean(entry.done ?? index < (raw.timeline as unknown[]).length - 1),
          active: Boolean(
            entry.active ?? index === (raw.timeline as unknown[]).length - 1,
          ),
        }))
      : buildDefaultTimeline(status);

  const line1 = String(addressRaw.line1 ?? addressRaw.address ?? '');
  const line2 = addressRaw.line2 ? String(addressRaw.line2) : '';
  const city = addressRaw.city ? String(addressRaw.city) : '';
  const pincode = String(addressRaw.pincode ?? addressRaw.pin ?? '');
  const paymentMethod = String(payment.method ?? raw.paymentMethod ?? 'CASH').toUpperCase();
  const paymentStatusRaw = String(
    payment.status ?? raw.paymentStatus ?? 'PENDING',
  ).toLowerCase();

  return {
    id: String(raw.id ?? ''),
    orderNumber: String(raw.orderNumber ?? raw.id ?? ''),
    status,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    expectedDelivery: raw.expectedDelivery ? String(raw.expectedDelivery) : undefined,
    deliveredAt: raw.deliveredAt ? String(raw.deliveredAt) : undefined,
    products,
    subtotal: Number(raw.subtotal ?? 0),
    discount: Number(raw.discountAmount ?? raw.discount ?? 0),
    gst: Number(raw.gstAmount ?? raw.gst ?? 0),
    couponDiscount: Number(raw.couponDiscount ?? 0),
    deliveryCharge: Number(raw.deliveryCharge ?? 0),
    platformFee: Number(raw.platformFee ?? 0),
    grandTotal: Number(raw.grandTotal ?? raw.total ?? 0),
    savings: raw.savings ? Number(raw.savings) : undefined,
    paymentStatus: (paymentStatusRaw as Order['paymentStatus']) || 'pending',
    paymentMethod,
    paymentMethodLabel:
      paymentMethod === 'CASH'
        ? 'Cash on Delivery'
        : raw.paymentMethodLabel
          ? String(raw.paymentMethodLabel)
          : paymentMethod,
    transactionId: raw.transactionId ? String(raw.transactionId) : undefined,
    shippingAddress: {
      name: String(addressRaw.name ?? customer.fullName ?? ''),
      phone: String(addressRaw.phone ?? customer.phone ?? ''),
      address: [line1, line2, city].filter(Boolean).join(', '),
      pin: pincode,
      instructions: addressRaw.instructions ? String(addressRaw.instructions) : undefined,
    },
    tracking: {
      currentStep: status,
      steps: timeline,
      driver,
      warehouse: hub.name ? String(hub.name) : undefined,
      ...(typeof raw.tracking === 'object' && raw.tracking
        ? (raw.tracking as Order['tracking'])
        : {}),
    },
    refund: raw.refund as Order['refund'],
    driver,
    cancellationReason:
      String(raw.cancelReason ?? raw.cancellationReason ?? '') || undefined,
    invoiceUrl: raw.invoiceUrl ? String(raw.invoiceUrl) : undefined,
    invoiceId: String(raw.invoiceNumber ?? raw.invoiceId ?? '') || undefined,
    invoiceFileName: raw.invoiceFileName ? String(raw.invoiceFileName) : undefined,
    timeline,
    deliveredEarly: Boolean(raw.deliveredEarly),
    loyaltyPointsEarned: raw.loyaltyPointsEarned
      ? Number(raw.loyaltyPointsEarned)
      : undefined,
  };
}
