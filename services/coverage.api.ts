import { api } from '@services/api';
import type { ApiResponse } from '@/types';

export interface CoverageHubMatch {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  serviceRadiusKm: number;
  coveragePincodes: string[];
  distanceKm: number;
  inCoverage: boolean;
  canFulfill: boolean;
}

export interface HubStockItem {
  productId: string;
  productName: string;
  slug: string;
  unit: string;
  availableQty: number;
  reservedQty: number;
  lowStockThreshold: number;
  inStock: boolean;
  deliveryETA: string | null;
  retailPrice: number;
}

export async function findHubForLocation(params: {
  lat?: number | null;
  lng?: number | null;
  pincode?: string | null;
  productIds?: string[];
  quantities?: number[];
}): Promise<CoverageHubMatch | null> {
  const query = new URLSearchParams();
  if (params.lat != null) query.set('lat', String(params.lat));
  if (params.lng != null) query.set('lng', String(params.lng));
  if (params.pincode) query.set('pincode', params.pincode);
  if (params.productIds?.length) {
    query.set('productIds', params.productIds.join(','));
  }
  if (params.quantities?.length) {
    query.set('quantities', params.quantities.join(','));
  }

  const { data } = await api.get<ApiResponse<CoverageHubMatch | null>>(
    `/coverage/find-hub?${query.toString()}`,
  );
  return data.data;
}

export async function fetchHubStock(params: {
  hubId?: string;
  lat?: number | null;
  lng?: number | null;
  pincode?: string | null;
}): Promise<{ hubId: string | null; items: HubStockItem[] }> {
  const query = new URLSearchParams();
  if (params.hubId) query.set('hubId', params.hubId);
  if (params.lat != null) query.set('lat', String(params.lat));
  if (params.lng != null) query.set('lng', String(params.lng));
  if (params.pincode) query.set('pincode', params.pincode);

  const { data } = await api.get<
    ApiResponse<{ hubId: string | null; items: HubStockItem[] }>
  >(`/coverage/hub-stock?${query.toString()}`);
  return data.data;
}
