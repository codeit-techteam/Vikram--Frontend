import { isAxiosError } from 'axios';

import { api } from '@services/api';
import type { ApiResponse } from '@/types';

export type RazorpayCheckoutMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

function isMissingPaymentsRoute(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
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

export type RazorpayVerifyResult = {
  success: boolean;
  replay?: boolean;
  internalOrderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  gatewayStatus: string;
  providerPaymentId: string | null;
  providerOrderId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  capturedAt: string | null;
};

export type RazorpayPaymentStatus = {
  internalOrderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  gatewayStatus: string | null;
  amount: number;
  amountPaise: number;
  currency: string;
  paid: boolean;
  capturedAt: string | null;
};

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
): Promise<RazorpayPaymentStatus> {
  const { data } = await api.get<ApiResponse<RazorpayPaymentStatus>>(
    `/payments/razorpay/status/${orderId}`,
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
