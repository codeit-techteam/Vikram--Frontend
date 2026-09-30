import { api } from '@services/api';
import type { ApiError, ApiResponse } from '@/types';

export type RazorpayCheckoutMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

function isMissingPaymentsRoute(error: unknown): boolean {
  const apiError = error as Partial<ApiError> | null;
  return apiError?.statusCode === 404 && !apiError.code;
}

export type RazorpayPublicConfig = {
  enabled: boolean;
  mode: 'test' | 'live';
  provider: string;
};

export type RazorpayCheckoutSession = {
  keyId: string;
  razorpayOrderId: string | null;
  amount: number;
  currency: string;
  internalOrderId: string;
  orderNumber: string;
  alreadyPaid?: boolean;
  name: string;
  description: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
};

/** Backend-derived customer payment state; the app never infers success locally. */
export type CustomerPaymentState =
  | 'PAID'
  | 'PROCESSING'
  | 'AWAITING_PAYMENT'
  | 'FAILED'
  | 'CANCELLED'
  | 'ORDER_CANCELLED'
  | 'REFUND_PENDING';

export type RazorpayPaymentStatus = {
  internalOrderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  state: CustomerPaymentState;
  retryable: boolean;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  gatewayStatus: string | null;
  method: string | null;
  failureReason: string | null;
  cancelReason: string | null;
  amount: number;
  amountPaise: number;
  currency: string;
  paid: boolean;
  capturedAt: string | null;
  expiresAt: string | null;
  expectedDeliveryAt: string | null;
  deliveryPreferenceType: string | null;
  reconcileFailed: boolean;
};

export type RazorpayVerifyResult = RazorpayPaymentStatus & {
  success: boolean;
  replay?: boolean;
};

export type PaymentApiError = {
  code: string | null;
  message: string | null;
  retryable: boolean;
  status: number | null;
  /** Request never got an HTTP answer (offline, DNS, timeout). */
  network: boolean;
  sessionExpired: boolean;
};

/** Reads the normalized ApiError produced by the axios interceptor in services/api. */
export function readPaymentApiError(error: unknown): PaymentApiError {
  const apiError = (error ?? {}) as Partial<ApiError>;
  const status =
    typeof apiError.statusCode === 'number' && apiError.statusCode > 0 ? apiError.statusCode : null;
  const network =
    apiError.code === 'NETWORK' || apiError.code === 'TIMEOUT' || apiError.statusCode === 0;
  return {
    code: apiError.code ?? null,
    message: typeof apiError.message === 'string' ? apiError.message : null,
    retryable:
      typeof apiError.retryable === 'boolean'
        ? apiError.retryable
        : network || status == null || status >= 500,
    status,
    network,
    sessionExpired: status === 401,
  };
}

export type PendingRazorpayCheckout = {
  internalOrderId: string;
  orderNumber: string;
  amount: number;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string | null;
  keyId: string;
  gatewayStatus: string | null;
  paymentStatus: string;
  orderStatus: string;
  state?: CustomerPaymentState;
  expiresAt?: string;
};

type CreateRazorpayOrderPayload = {
  addressId: string;
  notes?: string;
  loyaltyPointsToRedeem?: number;
  deliveryPreferenceType?: 'ASAP' | 'TODAY' | 'TOMORROW' | 'SCHEDULED';
  scheduledSlotId?: string;
  deliveryCustomerRemark?: string;
  deliveryCallOnArrival?: boolean;
  deliveryLeaveAtSecurity?: boolean;
  deliveryHeavyVehicleAccess?: boolean;
  openAreaConfirmed?: boolean;
  deliveryTermsAccepted?: boolean;
  deliveryTermsVersion?: string;
  internalOrderId?: string;
  checkoutMethod?: RazorpayCheckoutMethod;
  idempotencyKey?: string;
};

export async function getRazorpayConfig(): Promise<RazorpayPublicConfig> {
  try {
    const { data } = await api.get<ApiResponse<RazorpayPublicConfig>>(
      '/payments/razorpay/config',
    );
    return data.data;
  } catch (error) {
    // Older/staging backends may not have payments routes deployed yet.
    if (isMissingPaymentsRoute(error)) {
      return { enabled: false, mode: 'test', provider: 'razorpay' };
    }
    throw error;
  }
}

export async function createRazorpayOrder(
  payload: CreateRazorpayOrderPayload,
): Promise<RazorpayCheckoutSession> {
  const { idempotencyKey, ...body } = payload;
  const { data } = await api.post<ApiResponse<RazorpayCheckoutSession>>(
    '/payments/razorpay/create-order',
    body,
    idempotencyKey
      ? { headers: { 'Idempotency-Key': idempotencyKey } }
      : undefined,
  );
  return data.data;
}

export async function verifyRazorpayPayment(payload: {
  internalOrderId: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}): Promise<RazorpayVerifyResult> {
  const { data } = await api.post<ApiResponse<RazorpayVerifyResult>>(
    '/payments/razorpay/verify',
    payload,
  );
  return data.data;
}

export async function cancelRazorpayPayment(
  internalOrderId: string,
): Promise<RazorpayPaymentStatus> {
  const { data } = await api.post<ApiResponse<RazorpayPaymentStatus>>(
    '/payments/razorpay/cancel',
    { internalOrderId },
  );
  return data.data;
}

export async function getRazorpayStatus(
  orderId: string,
  options?: { timeoutMs?: number },
): Promise<RazorpayPaymentStatus> {
  const { data } = await api.get<ApiResponse<RazorpayPaymentStatus>>(
    `/payments/razorpay/status/${orderId}`,
    { timeout: options?.timeoutMs ?? 12000, headers: { 'Cache-Control': 'no-cache' } },
  );
  return data.data;
}

export async function getPendingRazorpayCheckout(): Promise<PendingRazorpayCheckout | null> {
  try {
    const { data } = await api.get<
      ApiResponse<{ pending: PendingRazorpayCheckout | null }>
    >('/payments/razorpay/pending');
    return data.data.pending;
  } catch (error) {
    // App restart recovery is optional — 404 means the backend build predates payments.
    if (isMissingPaymentsRoute(error)) {
      return null;
    }
    throw error;
  }
}
