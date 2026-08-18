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
  vehicleImageUrl?: string | null;
  distanceKm: number;
  listPrice: number;
  deliveryCharge: number;
  currency: string;
  pricingRuleId: string | null;
  pricingVersion: number | null;
  distanceSlab: string | null;
  freeDeliveryApplied: boolean;
  freeDeliveryReason?: string | null;
  companyAbsorbedDelivery: number;
  freeBikeDeliveriesRemaining: number | null;
  freeBikeDeliveriesAllowed: number | null;
  freeBikeDeliveriesUsed: number | null;
  vehicleCount?: number;
  totalWeightKg?: number | null;
  totalVolumeCft?: number | null;
  totalQuantity?: number | null;
  capacityUsed?: number | null;
  capacityLimit?: number | null;
  capacityUtilizationPercent?: number | null;
  selectionMode?: string | null;
  requiresBulkQuote?: boolean;
  multiVehicle?: boolean;
  breakdown?: {
    baseDeliveryCharge: number;
    vehicle: string;
    distanceKm: number;
    loadWeightKg: number | null;
    loadVolumeCft: number | null;
    vehicleCapacity: number | null;
    capacityUtilizationPercent: number | null;
    vehicleCount: number;
    discount: number;
    finalDeliveryCharge: number;
  };
}

export interface DeliveryVehicleCatalogItem {
  vehicleType: DeliveryVehicleType;
  displayName: string;
  imageUrl: string | null;
  active: boolean;
}

export async function fetchDeliveryVehicles(): Promise<DeliveryVehicleCatalogItem[]> {
  const { data } = await api.get<ApiResponse<DeliveryVehicleCatalogItem[]>>(
    '/delivery-pricing/vehicles',
  );
  return data.data;
}

export async function fetchDeliveryPricingRules(): Promise<DeliveryPricingRule[]> {
  const { data } = await api.get<ApiResponse<DeliveryPricingRule[]>>(
    '/delivery-pricing',
  );
  return data.data;
}

/**
 * Server-side delivery charge calculation.
 * Prefer cartItems so backend selects vehicle from load → capacity → distance.
 * Final checkout/order amount is always recalculated on the backend.
 */
export async function calculateDeliveryCharge(params: {
  distanceKm: number;
  cartItems?: Array<{ productId: string; variantId?: string; quantity: number }>;
  vehicleType?: DeliveryVehicleType;
  applyFreeBikeBenefit?: boolean;
}): Promise<CalculatedDeliveryCharge> {
  const { data } = await api.post<ApiResponse<CalculatedDeliveryCharge>>(
    '/delivery-pricing/calculate',
    params,
  );
  return data.data;
}
