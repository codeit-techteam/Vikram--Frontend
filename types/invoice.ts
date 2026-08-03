export type InvoiceLifecycleStatus = 'PENDING' | 'GENERATED' | 'CANCELLED';

export type InvoicePaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'COLLECTED'
  | 'FAILED'
  | 'REFUNDED'
  | string;

export type InvoiceType = 'GST' | 'RETAIL';

export type InvoiceListFilter =
  | 'all'
  | 'gst'
  | 'retail'
  | 'paid'
  | 'pending'
  | 'cancelled'
  | 'last_30_days'
  | 'this_year';

export type InvoiceSort =
  | 'newest'
  | 'oldest'
  | 'highest_amount'
  | 'lowest_amount';

export interface AccountInvoiceListItem {
  id: string;
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  status: InvoiceLifecycleStatus;
  invoiceDate: string;
  grandTotal: number;
  paymentStatus: InvoicePaymentStatus;
  customerName: string;
  invoiceType: InvoiceType;
  productNames: string[];
  pdfPath?: string | null;
  pdfGeneratedAt?: string | null;
}

export interface InvoiceLineItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  gst: number;
  subtotal: number;
  discount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  gstAmount?: number;
}

export interface InvoiceDetail {
  id: string;
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  status: InvoiceLifecycleStatus;
  invoiceDate: string;
  customer: {
    id: string;
    fullName?: string | null;
    phone: string;
    email?: string | null;
    companyName?: string | null;
    gstNumber?: string | null;
  };
  items: InvoiceLineItem[];
  gst: number;
  subtotal: number;
  deliveryCharge: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: InvoicePaymentStatus;
  address?: Record<string, unknown> | null;
  financial?: {
    loyaltyPointsUsed: number;
    loyaltyRedeemedAmount: number;
    membershipDiscount: number;
    bulkDiscount: number;
    bulkOrder: boolean;
  };
  taxBreakdown?: {
    cgst: number;
    sgst: number;
    igst: number;
    isInterState: boolean;
  };
  invoiceType: InvoiceType;
  pdfPath?: string | null;
  pdfGeneratedAt?: string | null;
}

export interface InvoicesPage {
  items: AccountInvoiceListItem[];
  page: number;
  hasMore: boolean;
  nextPage: number | null;
  total: number;
}

export interface InvoicesQueryParams {
  page?: number;
  limit?: number;
  status?: InvoiceLifecycleStatus;
  search?: string;
  sortBy?: 'invoiceDate' | 'grandTotal';
  sortOrder?: 'asc' | 'desc';
  fromDate?: string;
  toDate?: string;
  paymentStatus?: string;
}
