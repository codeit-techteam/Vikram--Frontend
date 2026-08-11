import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type { DeliveryVehicleType } from '@constants/deliveryVehicles';

export interface DeliveryPricingRule {
  id: string;
  vehicleType: DeliveryVehicleType;
  vehicleDisplayName: string;
  distanceFromKm: number;
  distanceToKm: number;
  distanceSlab: string;
  price: number;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE';
  version: number;
}

export interface CalculatedDeliveryCharge {
  available: boolean;
  message?: string;
  vehicleType: DeliveryVehicleType;
  vehicleDisplayName: string;
  distanceKm: number;
  listPrice: number;
  deliveryCharge: number;
  currency: string;
  pricingRuleId: string | null;
  pricingVersion: number | null;
  distanceSlab: string | null;
  freeDeliveryApplied: boolean;
  companyAbsorbedDelivery: number;
  freeBikeDeliveriesRemaining: number | null;
  freeBikeDeliveriesAllowed: number | null;
  freeBikeDeliveriesUsed: number | null;
}

/** List active rules (informational — never use for final order amount). */
export async function fetchDeliveryPricingRules(): Promise<DeliveryPricingRule[]> {
  const { data } = await api.get<ApiResponse<DeliveryPricingRule[]>>(
    '/delivery-pricing',
  );
  return data.data;
}

/**
 * Server-side delivery charge calculation.
 * Final checkout/order amount is always recalculated on the backend.
 */
export async function calculateDeliveryCharge(params: {
  vehicleType: DeliveryVehicleType;
  distanceKm: number;
  applyFreeBikeBenefit?: boolean;
}): Promise<CalculatedDeliveryCharge> {
  const { data } = await api.post<ApiResponse<CalculatedDeliveryCharge>>(
    '/delivery-pricing/calculate',
    params,
  );
  return data.data;
}
