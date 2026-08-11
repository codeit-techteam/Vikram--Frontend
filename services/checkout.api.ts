import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type { DeliveryVehicleType } from '@constants/deliveryVehicles';

export interface CheckoutPreview {
  subtotal: number;
  gstAmount: number;
  deliveryCharge: number;
  grandTotal: number;
  itemCount: number;
  membershipDiscount: number;
  loyaltyPoints: number;
  redeemablePoints: number;
  maxRedeemablePoints: number;
  loyaltyUsed: number;
  loyaltyDiscount: number;
  loyaltyAvailableValue: number;
  pointValueInr: number;
  minRedeemOrderValue: number;
  redemptionEligible: boolean;
  loyaltyMessage?: string | null;
  estimatedEarnPoints: number;
  discount: number;
  loadingCharges: number;
  unloadingCharges: number;
  bikeDeliveryFree: boolean;
  companyAbsorbedDelivery: number;
  freeBikeDeliveriesRemaining: number;
  deliveryVehicleType?: DeliveryVehicleType;
  deliveryVehicleDisplayName?: string;
  deliveryDistanceKm?: number;
  deliveryListPrice?: number;
  deliveryPricingRuleId?: string | null;
  deliveryPricingVersion?: number | null;
  freeDeliveryApplied?: boolean;
  freeBikeDeliveriesAllowed?: number | null;
  freeBikeDeliveriesUsed?: number | null;
  serviceable: boolean;
  deliveryETA: number;
  deliveryMessage: string;
  deliveringBy?: string | null;
  address?: {
    id: string;
    label?: string | null;
    line1: string;
    city: string;
    pincode: string;
  };
}

export async function fetchCheckoutPreview(params?: {
  addressId?: string;
  loyaltyPointsToRedeem?: number;
}): Promise<CheckoutPreview> {
  const query = new URLSearchParams();
  if (params?.addressId) query.set('addressId', params.addressId);
  if (params?.loyaltyPointsToRedeem != null && params.loyaltyPointsToRedeem > 0) {
    query.set('loyaltyPointsToRedeem', String(params.loyaltyPointsToRedeem));
  }
  const qs = query.toString();
  const { data } = await api.get<ApiResponse<CheckoutPreview>>(
    `/checkout${qs ? `?${qs}` : ''}`,
  );
  return data.data;
}

export async function prepareCheckout(body: {
  addressId?: string;
  notes?: string;
  loyaltyPointsToRedeem?: number;
}): Promise<CheckoutPreview> {
  const { data } = await api.post<ApiResponse<CheckoutPreview>>(
    '/checkout',
    body,
  );
  return data.data;
}
