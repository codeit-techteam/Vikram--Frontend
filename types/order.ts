export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'ready_for_dispatch'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'payment_failed'
  | 'refunded';

export type OrderFilterStatus = 'all' | 'active' | 'delivered' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type RefundStatus = 'pending' | 'credited' | 'failed' | 'none';

export interface OrderProduct {
  id: string;
  productId: string;
  name: string;
  brand?: string;
  sku?: string;
  category?: string;
  variant?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  gst?: number;
  image?: string;
  imageSearch?: string;
  delivered?: boolean;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  pin: string;
  instructions?: string;
}

export interface OrderDriver {
  name: string;
  phone: string;
  vehicleNumber: string;
  image?: string;
}

export interface OrderRefund {
  status: RefundStatus;
  amount: number;
  reason?: string;
}

export interface TimelineStep {
  key: string;
  label: string;
  time?: string;
  done: boolean;
  active?: boolean;
}

export interface OrderTracking {
  currentStep: OrderStatus;
  steps: TimelineStep[];
  estimatedArrival?: string;
  estimatedMinutes?: number;
  driver?: OrderDriver;
  warehouse?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  /** Backend display label (SSOT) — prefer over badge map when present */
  statusLabel?: string;
  createdAt: string;
  expectedDelivery?: string;
  deliveredAt?: string;
  products: OrderProduct[];
  subtotal: number;
  discount: number;
  gst: number;
  couponDiscount?: number;
  deliveryCharge: number;
  platformFee: number;
  grandTotal: number;
  savings?: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentMethodLabel?: string;
  transactionId?: string;
  shippingAddress: ShippingAddress;
  tracking?: OrderTracking;
  refund?: OrderRefund;
  driver?: OrderDriver;
  cancellationReason?: string;
  canCancel?: boolean;
  invoiceUrl?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceStatus?: string;
  invoiceFileName?: string;
  timeline: TimelineStep[];
  deliveredEarly?: boolean;
  loyaltyPointsEarned?: number;
}

export interface OrdersPage {
  items: Order[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface OrdersQueryParams {
  status?: OrderFilterStatus;
  cursor?: string;
  limit?: number;
  search?: string;
}

export interface CancelOrderPayload {
  reason?: string;
}

export interface ReorderResponse {
  cartItemCount: number;
  message: string;
  products?: OrderProduct[];
  addedCount?: number;
  unavailableCount?: number;
}
