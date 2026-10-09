import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

export type RazorpayCheckoutSuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayCheckoutFailure = {
  code?: number | string;
  description?: string;
  cancelled: boolean;
  nativeUnavailable?: boolean;
};

export class RazorpayCheckoutError extends Error {
  code?: number | string;
  cancelled: boolean;
  nativeUnavailable: boolean;

  constructor(input: RazorpayCheckoutFailure) {
    super(input.description || 'Payment was not completed.');
    this.name = 'RazorpayCheckoutError';
    this.code = input.code;
    this.cancelled = Boolean(input.cancelled);
    this.nativeUnavailable = Boolean(input.nativeUnavailable);
  }
}

export type NativeRazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: { color?: string };
  method?: {
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
  };
};

export const INCOMPLETE_RESPONSE_CODE = 'INCOMPLETE_RESPONSE';

/** Razorpay SDK cancel codes differ per platform: Android PAYMENT_CANCELED=0, iOS=2. */
const NATIVE_CANCEL_CODE = Platform.OS === 'ios' ? 2 : 0;

type NativeErrorPayload = {
  code?: number | string;
  description?: string;
  error?: { code?: string; description?: string; reason?: string };
};

/** Android sends `description` as a JSON string wrapping `{ error: {...} }`. */
function readNativeError(raw: unknown): { code?: number | string; message: string; reason: string } {
  const value = (raw ?? {}) as NativeErrorPayload;
  let inner = value.error;
  if (!inner && typeof value.description === 'string' && value.description.trim().startsWith('{')) {
    try {
      inner = (JSON.parse(value.description) as NativeErrorPayload).error;
    } catch {
      inner = undefined;
    }
  }
  const message =
    inner?.description ||
    (typeof value.description === 'string' && !value.description.trim().startsWith('{')
      ? value.description
      : '') ||
    (raw instanceof Error ? raw.message : '') ||
    'Payment was not completed.';
  return { code: value.code, message, reason: String(inner?.reason ?? '') };
}

export function isCancelledNativeError(raw: unknown): boolean {
  const { code, message, reason } = readNativeError(raw);
  const text = `${message} ${reason}`.toLowerCase();
  return (
    Number(code) === NATIVE_CANCEL_CODE ||
    text.includes('cancelled') ||
    text.includes('canceled') ||
    text.includes('payment_cancelled')
  );
}

/**
 * The JS wrapper exports `open` even when the native module is missing (Expo Go,
 * or a binary built before the SDK was added); calling it then throws inside a
 * Promise. Check the native side directly so we can fall back to Checkout.js.
 */
export function isNativeRazorpayAvailable(): boolean {
  try {
    const turbo = TurboModuleRegistry.get('RNRazorpayCheckout');
    return Boolean(turbo ?? NativeModules.RNRazorpayCheckout);
  } catch {
    return Boolean(NativeModules.RNRazorpayCheckout);
  }
}

export async function openNativeRazorpayCheckout(
  options: NativeRazorpayOptions,
): Promise<RazorpayCheckoutSuccess> {
  const unavailable = () =>
    new RazorpayCheckoutError({
      cancelled: false,
      nativeUnavailable: true,
      description: 'Native Razorpay checkout is unavailable in this build.',
    });

  if (!isNativeRazorpayAvailable()) throw unavailable();

  let RazorpayCheckout: {
    open: (opts: NativeRazorpayOptions) => Promise<RazorpayCheckoutSuccess>;
  };
  try {
    RazorpayCheckout = require('react-native-razorpay').default;
  } catch {
    throw unavailable();
  }
  if (typeof RazorpayCheckout?.open !== 'function') throw unavailable();

  let result: RazorpayCheckoutSuccess;
  try {
    result = await RazorpayCheckout.open(options);
  } catch (error) {
    const { code, message } = readNativeError(error);
    throw new RazorpayCheckoutError({
      code,
      description: message,
      cancelled: isCancelledNativeError(error),
    });
  }

  if (
    !result?.razorpay_payment_id ||
    !result.razorpay_order_id ||
    !result.razorpay_signature
  ) {
    // Missing fields cannot be verified; the backend status check decides the outcome.
    throw new RazorpayCheckoutError({
      code: INCOMPLETE_RESPONSE_CODE,
      cancelled: false,
      description: 'Razorpay returned an incomplete response.',
    });
  }
  return result;
}

export function buildRazorpayOptions(input: {
  keyId: string;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string;
  name: string;
  description: string;
  customer: { name?: string; email?: string; phone?: string };
  checkoutMethod?: 'upi' | 'cards' | 'card';
}): NativeRazorpayOptions {
  const preferUpi = input.checkoutMethod === 'upi';
  const preferCard =
    input.checkoutMethod === 'cards' || input.checkoutMethod === 'card';

  return {
    key: input.keyId,
    amount: input.amountPaise,
    currency: input.currency || 'INR',
    order_id: input.razorpayOrderId,
    name: input.name || 'Bajriwala',
    description: input.description,
    prefill: {
      name: input.customer.name || undefined,
      email: input.customer.email || undefined,
      contact: input.customer.phone || undefined,
    },
    theme: { color: '#FEB623' },
    notes: { order: input.description },
    ...(preferUpi
      ? { method: { upi: true, wallet: true, card: false, netbanking: false } }
      : preferCard
        ? { method: { card: true, netbanking: true, upi: false, wallet: false } }
        : {}),
  };
}
