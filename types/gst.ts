export type GstStatus = 'none' | 'pending' | 'verified' | 'failed';

/** Checkout GST UI state — drives all GST-related UI on checkout */
export type GstUiState = 'NOT_ADDED' | 'VERIFYING' | 'VERIFIED' | 'FAILED' | 'LOADING';

export interface GstAccount {
  id: string;
  gstin: string;
  legalName: string;
  tradeName?: string | null;
  businessType?: string | null;
  taxpayerType?: string | null;
  registrationStatus?: string | null;
  registrationDate?: string | null;
  registeredAddress?: string | null;
  principalPlaceOfBusiness?: string | null;
  state?: string | null;
  stateCode?: string | null;
  panNumber?: string | null;
  verificationStatus: string;
  verifiedAt?: string | null;
  verificationProvider?: string | null;
  providerReference?: string | null;
  isDefault: boolean;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GstVerificationResult {
  gstin: string;
  legalName?: string | null;
  tradeName?: string | null;
  registrationStatus?: string | null;
  registrationDate?: string | null;
  businessType?: string | null;
  taxpayerType?: string | null;
  registeredAddress?: string | null;
  principalPlaceOfBusiness?: string | null;
  state?: string | null;
  stateCode?: string | null;
  panNumber?: string | null;
  verified: boolean;
  verifiedAt: string;
  verificationProvider?: string;
  providerReference?: string | null;
  verificationToken: string;
}

export interface CreateGstAccountPayload {
  gstin: string;
  verificationToken: string;
  setAsDefault?: boolean;
}

export interface UpdateGstAccountPayload {
  tradeName?: string;
  gstin?: string;
  verificationToken?: string;
}

export interface GstDetails {
  id?: string;
  gstNumber: string;
  businessName: string;
  registeredAddress: string;
  state: string;
  pan: string;
  status: GstStatus;
  businessType?: string;
  updatedAt?: string;
  certificateUrl?: string | null;
}

export interface GstValidationResult extends GstDetails {
  isValid: boolean;
  verified?: boolean;
  verificationToken?: string;
  tradeName?: string | null;
  taxpayerType?: string | null;
  registrationStatus?: string | null;
  registrationDate?: string | null;
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

export function isGstAccountVerified(account: GstAccount): boolean {
  return String(account.verificationStatus).toUpperCase() === 'VERIFIED';
}

export function accountToGstDetails(account: GstAccount): GstDetails {
  const verified = isGstAccountVerified(account);
  return {
    id: account.id,
    gstNumber: account.gstin,
    businessName: (account.tradeName || account.legalName || '').trim(),
    registeredAddress: account.registeredAddress ?? account.principalPlaceOfBusiness ?? '',
    state: account.state ?? '',
    pan: account.panNumber ?? '',
    status: verified ? 'verified' : 'pending',
    businessType: account.businessType ?? undefined,
    updatedAt: account.verifiedAt ?? account.updatedAt ?? undefined,
  };
}

export function verificationToValidationResult(
  result: GstVerificationResult,
): GstValidationResult {
  const verified = result.verified === true;
  return {
    gstNumber: result.gstin,
    businessName: (result.legalName || result.tradeName || '').trim(),
    registeredAddress:
      result.registeredAddress ?? result.principalPlaceOfBusiness ?? '',
    state: result.state ?? '',
    pan: result.panNumber ?? '',
    status: verified ? 'verified' : 'failed',
    businessType: result.businessType ?? undefined,
    updatedAt: result.verifiedAt,
    isValid: verified,
    verified,
    verificationToken: result.verificationToken,
    tradeName: result.tradeName,
    taxpayerType: result.taxpayerType,
    registrationStatus: result.registrationStatus,
    registrationDate: result.registrationDate,
  };
}
