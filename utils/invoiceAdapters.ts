import type {
  AccountInvoiceListItem,
  InvoiceDetail,
  InvoiceLifecycleStatus,
  InvoiceLineItem,
  InvoicePaymentStatus,
  InvoiceType,
  InvoicesPage,
} from '@/types/invoice';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function str(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  return String(value);
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function maskPan(pan?: string | null): string {
  const cleaned = (pan ?? '').trim().toUpperCase();
  if (!cleaned) return '—';
  if (cleaned.length <= 4) return cleaned;
  return `${'*'.repeat(cleaned.length - 4)}${cleaned.slice(-4)}`;
}

export function formatInvoiceDate(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function paymentStatusLabel(status?: string | null): string {
  const normalized = (status ?? '').toUpperCase();
  if (normalized === 'PAID' || normalized === 'COLLECTED') return 'Paid';
  if (normalized === 'PENDING') return 'Pending';
  if (normalized === 'FAILED') return 'Failed';
  if (normalized === 'REFUNDED') return 'Refunded';
  if (normalized === 'CANCELLED') return 'Cancelled';
  return status ? status.replace(/_/g, ' ') : 'Pending';
}

export function isPaidPaymentStatus(status?: string | null): boolean {
  const normalized = (status ?? '').toUpperCase();
  return normalized === 'PAID' || normalized === 'COLLECTED';
}

function resolveInvoiceType(raw: Record<string, unknown>): InvoiceType {
  const explicit = str(raw.invoiceType ?? raw.type).toUpperCase();
  if (explicit === 'GST' || explicit === 'GST_INVOICE') return 'GST';
  if (explicit === 'RETAIL' || explicit === 'RETAIL_INVOICE') return 'RETAIL';

  const gstNumber = str(
    raw.gstNumber ??
      raw.customerGstNumber ??
      asRecord(raw.customer).gstNumber ??
      asRecord(raw.customerSnapshot).gstNumber,
  );
  if (gstNumber) return 'GST';

  const gstAmount = num(raw.gstAmount ?? raw.gst);
  return gstAmount > 0 && gstNumber ? 'GST' : gstNumber ? 'GST' : 'RETAIL';
}

function resolveProductNames(raw: Record<string, unknown>): string[] {
  if (Array.isArray(raw.productNames)) {
    return raw.productNames.map((n) => str(n)).filter(Boolean);
  }
  const items = Array.isArray(raw.itemsSnapshot)
    ? raw.itemsSnapshot
    : Array.isArray(raw.items)
      ? raw.items
      : [];
  return items
    .map((item) => str(asRecord(item).name))
    .filter(Boolean);
}

export function normalizeInvoiceListItem(rawInput: unknown): AccountInvoiceListItem {
  const raw = asRecord(rawInput);
  const customer = asRecord(raw.customer);
  const snapshot = asRecord(raw.customerSnapshot);

  const customerName =
    str(raw.customerName) ||
    str(customer.fullName) ||
    str(customer.companyName) ||
    str(snapshot.fullName) ||
    str(snapshot.companyName) ||
    'Customer';

  return {
    id: str(raw.id),
    orderId: str(raw.orderId),
    orderNumber: str(raw.orderNumber),
    invoiceNumber: str(raw.invoiceNumber ?? raw.id),
    status: str(raw.status, 'GENERATED').toUpperCase() as InvoiceLifecycleStatus,
    invoiceDate: str(raw.invoiceDate),
    grandTotal: num(raw.grandTotal),
    paymentStatus: str(raw.paymentStatus, 'PENDING').toUpperCase() as InvoicePaymentStatus,
    customerName,
    invoiceType: resolveInvoiceType({
      ...raw,
      gstNumber: raw.gstNumber ?? customer.gstNumber ?? snapshot.gstNumber,
    }),
    productNames: resolveProductNames(raw),
    pdfPath: raw.pdfPath != null ? str(raw.pdfPath) : null,
    pdfGeneratedAt: raw.pdfGeneratedAt != null ? str(raw.pdfGeneratedAt) : null,
  };
}

export function normalizeInvoicesPage(payload: unknown, fallbackPage = 1): InvoicesPage {
  const root = asRecord(payload);
  const list = Array.isArray(root.data)
    ? root.data
    : Array.isArray(root.items)
      ? root.items
      : Array.isArray(payload)
        ? payload
        : [];

  const meta = asRecord(root.meta);
  const page = num(meta.page, fallbackPage) || fallbackPage;
  const total = num(meta.total, list.length);
  const hasMore =
    typeof meta.hasNextPage === 'boolean'
      ? meta.hasNextPage
      : page < num(meta.totalPages, 1);

  return {
    items: list.map(normalizeInvoiceListItem),
    page,
    hasMore,
    nextPage: hasMore ? page + 1 : null,
    total,
  };
}

function normalizeLineItem(rawInput: unknown): InvoiceLineItem {
  const raw = asRecord(rawInput);
  return {
    name: str(raw.name, 'Item'),
    quantity: num(raw.quantity ?? raw.qty, 1),
    unit: str(raw.unit),
    unitPrice: num(raw.unitPrice),
    gst: num(raw.gst),
    subtotal: num(raw.subtotal),
    discount: raw.discount != null ? num(raw.discount) : undefined,
    cgst: raw.cgst != null ? num(raw.cgst) : undefined,
    sgst: raw.sgst != null ? num(raw.sgst) : undefined,
    igst: raw.igst != null ? num(raw.igst) : undefined,
    gstAmount: raw.gstAmount != null ? num(raw.gstAmount) : undefined,
  };
}

export function normalizeInvoiceDetail(rawInput: unknown): InvoiceDetail {
  const raw = asRecord(rawInput);
  const customer = asRecord(raw.customer);
  const tax = asRecord(raw.taxBreakdown);
  const financial = asRecord(raw.financial);
  const items = Array.isArray(raw.items) ? raw.items.map(normalizeLineItem) : [];

  const gstNumber = str(customer.gstNumber ?? raw.gstNumber);
  const invoiceType = resolveInvoiceType({
    ...raw,
    gstNumber,
    customer: { gstNumber },
  });

  return {
    id: str(raw.id),
    orderId: str(raw.orderId),
    orderNumber: str(raw.orderNumber),
    invoiceNumber: str(raw.invoiceNumber ?? raw.id),
    status: str(raw.status, 'GENERATED').toUpperCase() as InvoiceLifecycleStatus,
    invoiceDate: str(raw.invoiceDate),
    customer: {
      id: str(customer.id),
      fullName: customer.fullName != null ? str(customer.fullName) : null,
      phone: str(customer.phone),
      email: customer.email != null ? str(customer.email) : null,
      companyName: customer.companyName != null ? str(customer.companyName) : null,
      gstNumber: gstNumber || null,
    },
    items,
    gst: num(raw.gst ?? raw.gstAmount),
    subtotal: num(raw.subtotal),
    deliveryCharge: num(raw.deliveryCharge),
    discountAmount: num(raw.discountAmount),
    grandTotal: num(raw.grandTotal),
    paymentMethod: str(raw.paymentMethod),
    paymentStatus: str(raw.paymentStatus, 'PENDING').toUpperCase() as InvoicePaymentStatus,
    address: (raw.address as Record<string, unknown> | null) ?? null,
    financial: financial.loyaltyPointsUsed != null
      ? {
          loyaltyPointsUsed: num(financial.loyaltyPointsUsed),
          loyaltyRedeemedAmount: num(financial.loyaltyRedeemedAmount),
          membershipDiscount: num(financial.membershipDiscount),
          bulkDiscount: num(financial.bulkDiscount),
          bulkOrder: Boolean(financial.bulkOrder),
        }
      : undefined,
    taxBreakdown:
      tax.cgst != null || tax.sgst != null || tax.igst != null
        ? {
            cgst: num(tax.cgst),
            sgst: num(tax.sgst),
            igst: num(tax.igst),
            isInterState: Boolean(tax.isInterState),
          }
        : undefined,
    invoiceType,
    pdfPath: raw.pdfPath != null ? str(raw.pdfPath) : null,
    pdfGeneratedAt: raw.pdfGeneratedAt != null ? str(raw.pdfGeneratedAt) : null,
  };
}

export function invoiceRouteParams(orderId: string, invoiceId?: string | null) {
  return {
    pathname: '/invoice/[invoiceId]' as const,
    params: {
      invoiceId: invoiceId || orderId,
      orderId,
    },
  };
}
