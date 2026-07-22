import type { PaymentMethodId } from '@constants/paymentMethods';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  upi: 'Pay with UPI',
  cards: 'Pay with Cards',
  cash_on_delhivery: 'Cash on Delhivery',
  cod: 'Cash on Delhivery',
};

const LEGACY_PAYMENT_METHOD_IDS: Record<string, PaymentMethodId> = {
  cod: 'cash_on_delhivery',
};

export function normalizePaymentMethodId(method: string): PaymentMethodId | string {
  return LEGACY_PAYMENT_METHOD_IDS[method] ?? method;
}

export function getPaymentMethodLabel(
  method: string,
  fallbackLabel?: string,
): string {
  if (fallbackLabel) return fallbackLabel;

  const normalized = normalizePaymentMethodId(method);
  return (
    PAYMENT_METHOD_LABELS[normalized] ??
    PAYMENT_METHOD_LABELS[method] ??
    method.replace(/_/g, ' ')
  );
}
