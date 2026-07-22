export type GstStatus = 'none' | 'pending' | 'verified';

/** Checkout GST UI state — drives all GST-related UI on checkout */
export type GstUiState = 'NOT_ADDED' | 'VERIFYING' | 'VERIFIED' | 'FAILED' | 'LOADING';

export interface GstDetails {
  gstNumber: string;
  businessName: string;
  registeredAddress: string;
  state: string;
  pan: string;
  status: GstStatus;
}

export interface GstValidationResult extends GstDetails {
  isValid: boolean;
}

export interface SaveGstPayload {
  gstNumber: string;
  businessName: string;
  registeredAddress: string;
  state: string;
  pan: string;
}

/** Optional pricing rows returned by backend — overrides frontend GST discount when provided */
export interface GstPricingAdjustment {
  id: string;
  label: string;
  /** Negative for discounts, positive for surcharges */
  amount: number;
  /** Optional rate label e.g. 18 for "18% Applied" */
  percent?: number;
}

/** Backend-driven checkout GST pricing — when set, replaces mock 18% calculation */
export interface GstCheckoutPricing {
  discountAmount: number;
  discountPercent: number;
  label?: string;
}
