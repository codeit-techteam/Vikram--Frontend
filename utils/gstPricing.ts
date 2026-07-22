/** Standard GST rate for construction materials (B2B) — override via backend */
export const DEFAULT_GST_BUSINESS_RATE = 0.18;

export type GstDiscountConfig = {
  /** e.g. 0.18 for 18% */
  rate: number;
  /** When false, no discount row is shown */
  enabled: boolean;
};

export const DEFAULT_GST_DISCOUNT_CONFIG: GstDiscountConfig = {
  rate: DEFAULT_GST_BUSINESS_RATE,
  enabled: true,
};

/**
 * Business pricing discount applied on verified GST checkout.
 * Backend can replace rate/amount via `GstPricingAdjustment` rows later.
 */
export function computeGstBusinessDiscount(
  subtotal: number,
  config: GstDiscountConfig = DEFAULT_GST_DISCOUNT_CONFIG,
): number {
  if (!config.enabled || subtotal <= 0) return 0;
  return Math.round(subtotal * config.rate);
}

export function formatGstDiscountPercent(rate: number): number {
  return Math.round(rate * 100);
}
