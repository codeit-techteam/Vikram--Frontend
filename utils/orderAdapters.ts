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
import {
  buildCustomerTimeline,
  getCustomerStatusLabel,
} from '@utils/customerOrderStatus';

const LEGACY_STATUS_MAP: Record<LegacyOrderStatus, OrderStatus> = {
  processing: 'processing',
  packed: 'packed',
  dispatched: 'ready_for_dispatch',
  in_transit: 'out_for_delivery',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

/**
 * Backend → frontend status.
 * PICKING maps to packed (customer: Packed). DRIVER_ASSIGNED → out_for_delivery.
 */
const BACKEND_STATUS_MAP: Record<string, OrderStatus> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  HUB_ASSIGNED: 'confirmed',
  AWAITING_HUB_ALLOCATION: 'pending',
  ACCEPTED_BY_HUB: 'processing',
  PICKING: 'packed',
  PROCESSING: 'processing',
  PACKED: 'packed',
  READY_FOR_DISPATCH: 'ready_for_dispatch',
  DRIVER_ASSIGNED: 'out_for_delivery',
  OUT_FOR_DELIVERY: 'out_for_delivery',
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

function buildTimeline(order: LegacyOrder, status: OrderStatus): TimelineStep[] {
  // Never surface legacy/hub operational timeline labels to customers.
  return buildCustomerTimeline(status, {
    createdAt: order.createdAt?.toISOString?.() ?? undefined,
    deliveredAt: order.deliveredAt?.toISOString?.() ?? undefined,
  });
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
          driver: order.driverName
            ? {
                name: order.driverName,
                phone: '',
                vehicleNumber: order.vehicleNumber,
              }
            : undefined,
        }
      : undefined,
    refund: order.refundAmount
      ? { status: 'credited', amount: order.refundAmount }
      : undefined,
    driver: order.driverName
      ? {
          name: order.driverName,
          phone: '',
          vehicleNumber: order.vehicleNumber,
        }
      : undefined,
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

  return source.map((p) => {
    const name = String(p.productName ?? p.name ?? '');
    const rawImage =
      (p.productImage ? String(p.productImage) : undefined) ??
      (p.image ? String(p.image) : undefined) ??
      (p.thumbnailUrl ? String(p.thumbnailUrl) : undefined) ??
      (p.imageUrl ? String(p.imageUrl) : undefined) ??
      (p.thumbnail ? String(p.thumbnail) : undefined);
    const image =
      rawImage &&
      (rawImage.startsWith('http://') || rawImage.startsWith('https://'))
        ? rawImage
        : undefined;

    return {
      id: String(p.id ?? p.productId ?? ''),
      productId: String(p.productId ?? p.id ?? ''),
      name,
      brand: p.brand ? String(p.brand) : undefined,
      sku: p.sku ? String(p.sku) : undefined,
      category: p.category ? String(p.category) : undefined,
      variant: p.variant
        ? String(p.variant)
        : p.variantLabel
          ? String(p.variantLabel)
          : undefined,
      quantity: Number(p.quantity ?? 1),
      unit: String(p.unit ?? ''),
      unitPrice: Number(p.unitPrice ?? p.price ?? p.sellingPrice ?? 0),
      totalPrice: Number(p.totalPrice ?? p.subtotal ?? p.unitPrice ?? p.price ?? 0),
      gst: p.gst != null ? Number(p.gst) : undefined,
      image,
      imageSearch: image,
      delivered: Boolean(p.delivered),
    };
  });
}

function mapApiDriver(raw: Record<string, unknown>): OrderDriver | undefined {
  const tracking = raw.tracking as Record<string, unknown> | undefined;
  const driver = (raw.driver ?? tracking?.driver) as
    | Record<string, unknown>
    | null
    | undefined;
  if (!driver || typeof driver !== 'object') return undefined;

  const name = String(driver.name ?? '').trim();
  const phone = String(driver.phone ?? '').trim();
  if (!name && !phone) return undefined;

  const vehicle = raw.vehicle as Record<string, unknown> | undefined;
  return {
    name,
    phone,
    vehicleNumber: String(
      driver.vehicleNumber ?? vehicle?.registration ?? '',
    ).trim(),
    image: driver.image ? String(driver.image) : undefined,
  };
}

function formatEta(value: unknown): string | undefined {
  if (!value) return undefined;
  const raw = String(value);
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return raw;
}

function mapPaymentStatus(raw: unknown): Order['paymentStatus'] {
  const normalized = String(raw ?? 'pending').toLowerCase();
  switch (normalized) {
    case 'paid':
    case 'collected':
      return 'paid';
    case 'failed':
      return 'failed';
    case 'refunded':
      return 'refunded';
    case 'pending':
    default:
      return 'pending';
  }
}

export function normalizeApiOrder(raw: Record<string, unknown>): Order {
  const status = mapBackendStatus(raw.status ?? raw.orderStatus);
  const statusLabel = getCustomerStatusLabel(status);
  const payment = (raw.payment ?? {}) as Record<string, unknown>;
  const addressRaw = (raw.address ??
    raw.shippingAddress ??
    raw.deliveryAddress ??
    {}) as Record<string, unknown>;
  const customer = (raw.customer ?? {}) as Record<string, unknown>;
  const products = mapApiProducts(raw).map((product) => ({
    ...product,
    delivered: status === 'delivered' ? true : product.delivered,
  }));
  const driver = mapApiDriver(raw);
  const createdAt = String(raw.createdAt ?? new Date().toISOString());
  const deliveredAt = raw.deliveredAt
    ? String(raw.deliveredAt)
    : raw.deliveryCompletedAt
      ? String(raw.deliveryCompletedAt)
      : undefined;
  const timeline = buildCustomerTimeline(status, { createdAt, deliveredAt });

  const line1 = String(addressRaw.line1 ?? addressRaw.address ?? '');
  const line2 = addressRaw.line2 ? String(addressRaw.line2) : '';
  const city = addressRaw.city ? String(addressRaw.city) : '';
  const pincode = String(addressRaw.pincode ?? addressRaw.pin ?? '');
  const paymentMethod = String(payment.method ?? raw.paymentMethod ?? 'CASH').toUpperCase();
  const paymentStatusRaw = String(
    payment.status ?? raw.paymentStatus ?? 'PENDING',
  );
  const isTerminal =
    status === 'delivered' || status === 'cancelled' || status === 'refunded';
  const expectedDelivery = isTerminal
    ? undefined
    : formatEta(raw.expectedDeliveryAt ?? raw.expectedDelivery);

  const updatedAt = raw.updatedAt ? String(raw.updatedAt) : undefined;
  const explicitVersion =
    typeof raw.version === 'number'
      ? raw.version
      : raw.version
        ? Number(raw.version)
        : undefined;
  const version =
    (Number.isFinite(explicitVersion) ? explicitVersion : undefined) ??
    (updatedAt ? Date.parse(updatedAt) || undefined : undefined);

  const deliveryOtp =
    raw.deliveryOtp != null && String(raw.deliveryOtp).trim()
      ? String(raw.deliveryOtp).trim()
      : null;
  const deliveryOtpGenerated = Boolean(
    raw.deliveryOtpGenerated ?? raw.deliveryOtpGeneratedAt ?? deliveryOtp,
  );
  const deliveryOtpVerified = Boolean(raw.deliveryOtpVerified);
  const driverReachedAt = raw.driverReachedAt
    ? String(raw.driverReachedAt)
    : null;

  return {
    id: String(raw.id ?? ''),
    orderNumber: String(raw.orderNumber ?? raw.id ?? ''),
    status,
    statusLabel,
    createdAt,
    updatedAt,
    version,
    expectedDelivery,
    deliveryPreference: (raw.deliveryPreference as Order['deliveryPreference']) ?? undefined,
    deliveredAt,
    products,
    subtotal: Number(raw.subtotal ?? 0),
    discount: Number(raw.discountAmount ?? raw.discount ?? 0),
    gst: Number(raw.gstAmount ?? raw.gst ?? 0),
    couponDiscount: Number(raw.couponDiscount ?? 0),
    deliveryCharge: Number(raw.deliveryCharge ?? 0),
    platformFee: Number(raw.platformFee ?? 0),
    grandTotal: Number(raw.grandTotal ?? raw.total ?? 0),
    savings: raw.savings ? Number(raw.savings) : undefined,
    paymentStatus: mapPaymentStatus(paymentStatusRaw),
    paymentMethod,
    paymentMethodLabel:
      paymentMethod === 'CASH'
        ? 'Cash on Delivery'
        : raw.paymentMethodLabel
          ? String(raw.paymentMethodLabel)
          : paymentMethod,
    transactionId: raw.transactionId ? String(raw.transactionId) : undefined,
    shippingAddress: {
      name: String(addressRaw.name ?? customer.fullName ?? addressRaw.label ?? ''),
      phone: String(addressRaw.phone ?? customer.phone ?? ''),
      address: [line1, line2, city].filter(Boolean).join(', '),
      pin: pincode,
      instructions:
        (raw.deliveryCustomerRemark ? String(raw.deliveryCustomerRemark) : undefined) ||
        (addressRaw.instructions ? String(addressRaw.instructions) : undefined) ||
        (raw.notes ? String(raw.notes) : undefined),
    },
    tracking: ACTIVE_ORDER_STATUSES.includes(status)
      ? {
          currentStep: status,
          steps: timeline,
          estimatedArrival: expectedDelivery,
          driver,
        }
      : undefined,
    refund: raw.refund as Order['refund'],
    driver,
    cancellationReason:
      String(raw.cancelReason ?? raw.cancellationReason ?? '') || undefined,
    canCancel: typeof raw.canCancel === 'boolean' ? raw.canCancel : undefined,
    invoiceUrl: raw.invoiceUrl ? String(raw.invoiceUrl) : undefined,
    invoiceId: String(raw.invoiceId ?? raw.invoiceNumber ?? '') || undefined,
    invoiceNumber: raw.invoiceNumber ? String(raw.invoiceNumber) : undefined,
    invoiceStatus: raw.invoiceStatus ? String(raw.invoiceStatus) : undefined,
    invoiceFileName: raw.invoiceFileName ? String(raw.invoiceFileName) : undefined,
    timeline,
    deliveredEarly: Boolean(raw.deliveredEarly),
    loyaltyPointsEarned: raw.loyaltyPointsEarned
      ? Number(raw.loyaltyPointsEarned)
      : undefined,
    deliveryOtp,
    deliveryOtpGenerated,
    deliveryOtpVerified,
    driverReachedAt,
  };
}
