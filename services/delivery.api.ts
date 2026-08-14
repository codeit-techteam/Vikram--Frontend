import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import { buildDeliveryMessage } from '@utils/deliveryMessages';

export interface DeliveryEtaCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface DeliveryEtaTiming {
  preparationMinutes: number;
  pickingMinutes: number;
  packingMinutes: number;
  vehicleAssignmentMinutes: number;
  queueMinutes: number;
  loadingMinutes: number;
  travelMinutes: number;
  unloadingMinutes: number;
  siteAccessMinutes: number;
  bufferMinutes: number;
  plantPreparationMinutes: number;
  mixerLoadingMinutes: number;
}

export interface DeliveryEtaResult {
  serviceable: boolean;
  deliveryETA: number;
  etaMinMinutes?: number;
  etaMaxMinutes?: number;
  etaConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  deliveryMessage: string;
  deliveryModeTitle?: string;
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
  deliveryTotalVolumeCft?: number | null;
  deliveryCapacityUsed?: number | null;
  deliveryCapacityLimit?: number | null;
  deliveryLogisticsType?: string;
  deliverySelectionReason?: string;
  timing?: DeliveryEtaTiming;
  trafficDataAvailable?: boolean;
  calculationVersion?: number;
}

export interface FetchEtaParams {
  latitude: number;
  longitude: number;
  pincode?: string;
  cartItems?: DeliveryEtaCartItem[];
}

export async function fetchDeliveryEta(
  params: FetchEtaParams & { signal?: AbortSignal },
): Promise<DeliveryEtaResult> {
  if (params.cartItems && params.cartItems.length > 0) {
    const { data } = await api.post<ApiResponse<DeliveryEtaResult>>('/delivery/eta', {
      latitude: params.latitude,
      longitude: params.longitude,
      pincode: params.pincode,
      cartItems: params.cartItems,
    }, { signal: params.signal });
    return data.data;
  }

  const query = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
  });
  if (params.pincode) query.set('pincode', params.pincode);

  const { data } = await api.get<ApiResponse<DeliveryEtaResult>>(
    `/delivery/eta?${query.toString()}`,
    { signal: params.signal },
  );
  return data.data;
}

export function formatEtaLabel(eta: DeliveryEtaResult | null | undefined): string {
  if (!eta) return '';
  const hasRange =
    (eta.etaMinMinutes != null && eta.etaMinMinutes > 0) ||
    (eta.deliveryETA != null && eta.deliveryETA > 0);
  const message = eta.deliveryMessage?.trim() ?? '';
  const looksUnavailable = /unavailable/i.test(message);

  if (hasRange && message && !looksUnavailable) return message;
  if (hasRange) {
    return buildDeliveryMessage(eta.deliveryETA, {
      deliveringBy: eta.deliveringBy,
      preorder: eta.deliveryDay === 'Tomorrow',
      serviceable: true,
      etaMinMinutes: eta.etaMinMinutes,
      etaMaxMinutes: eta.etaMaxMinutes,
    });
  }
  if (!eta.serviceable) {
    return message || eta.message || 'Not serviceable';
  }
  if (message && !looksUnavailable) return message;
  if (eta.etaMinMinutes && eta.etaMaxMinutes) {
    return buildDeliveryMessage(eta.deliveryETA, {
      deliveringBy: eta.deliveringBy,
      preorder: eta.deliveryDay === 'Tomorrow',
      serviceable: eta.serviceable,
      etaMinMinutes: eta.etaMinMinutes,
      etaMaxMinutes: eta.etaMaxMinutes,
    });
  }
  return buildDeliveryMessage(eta.deliveryETA, {
    deliveringBy: eta.deliveringBy,
    preorder: eta.deliveryDay === 'Tomorrow',
    serviceable: eta.serviceable,
  });
}
