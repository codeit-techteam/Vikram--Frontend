import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import { buildDeliveryMessage } from '@utils/deliveryMessages';

export interface DeliveryEtaCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface DeliveryEtaResult {
  serviceable: boolean;
  deliveryETA: number;
  deliveryMessage: string;
  deliveryDay: 'Today' | 'Tomorrow' | 'Later' | 'Unavailable';
  deliveringBy?: string | null;
  deliveryCharge: number;
  freeDelivery: boolean;
  message?: string;
  deliveryVehicleType?: string;
  deliveryVehicleDisplayName?: string;
  deliveryVehicleCount?: number;
  deliveryDistanceKm?: number;
  deliveryTotalWeightKg?: number | null;
  deliveryCapacityUsed?: number | null;
  deliveryCapacityLimit?: number | null;
}

export interface FetchEtaParams {
  latitude: number;
  longitude: number;
  pincode?: string;
  cartItems?: DeliveryEtaCartItem[];
}

export async function fetchDeliveryEta(
  params: FetchEtaParams,
): Promise<DeliveryEtaResult> {
  if (params.cartItems && params.cartItems.length > 0) {
    const { data } = await api.post<ApiResponse<DeliveryEtaResult>>('/delivery/eta', {
      latitude: params.latitude,
      longitude: params.longitude,
      pincode: params.pincode,
      cartItems: params.cartItems,
    });
    return data.data;
  }

  const query = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
  });
  if (params.pincode) query.set('pincode', params.pincode);

  const { data } = await api.get<ApiResponse<DeliveryEtaResult>>(
    `/delivery/eta?${query.toString()}`,
  );
  return data.data;
}

export function formatEtaLabel(eta: DeliveryEtaResult | null | undefined): string {
  if (!eta) return '';
  if (!eta.serviceable) return eta.message || 'Not serviceable';
  return eta.deliveryMessage || buildDeliveryMessage(eta.deliveryETA, {
    deliveringBy: eta.deliveringBy,
    preorder: eta.deliveryDay === 'Tomorrow',
    serviceable: eta.serviceable,
  });
}
