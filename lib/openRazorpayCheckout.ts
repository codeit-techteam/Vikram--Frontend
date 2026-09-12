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

function isCancelledError(error: unknown): boolean {
  const value = error as {
    code?: number | string;
    description?: string;
    error?: { code?: string; description?: string };
  };
  const code = value?.code ?? value?.error?.code;
  const description = String(
    value?.description ?? value?.error?.description ?? '',
  ).toLowerCase();
  return (
    code === 0 ||
    code === 2 ||
    code === '2' ||
    description.includes('cancelled') ||
    description.includes('canceled')
  );
}

export async function openNativeRazorpayCheckout(
  options: NativeRazorpayOptions,
): Promise<RazorpayCheckoutSuccess> {
  let RazorpayCheckout: {
    open: (opts: NativeRazorpayOptions) => Promise<RazorpayCheckoutSuccess>;
  };
  try {
    RazorpayCheckout = require('react-native-razorpay').default;
  } catch {
    throw new RazorpayCheckoutError({
      cancelled: false,
      nativeUnavailable: true,
      description: 'Native Razorpay checkout is unavailable in this build.',
    });
  }

  if (!RazorpayCheckout?.open) {
    throw new RazorpayCheckoutError({
      cancelled: false,
      nativeUnavailable: true,
      description: 'Native Razorpay checkout is unavailable in this build.',
    });
  }

  try {
    return await RazorpayCheckout.open(options);
  } catch (error) {
    throw new RazorpayCheckoutError({
      code: (error as { code?: number | string }).code,
      description:
        (error as { description?: string }).description ||
        (error instanceof Error ? error.message : 'Payment was not completed.'),
      cancelled: isCancelledError(error),
    });
  }
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
