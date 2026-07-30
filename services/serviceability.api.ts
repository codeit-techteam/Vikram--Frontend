import { api } from '@services/api';
import type { ApiResponse } from '@/types';

export interface ServiceabilityResult {
  serviceable: boolean;
  deliveryETA: number;
  deliveryMessage: string;
  reason?: string;
}

export async function checkServiceability(params: {
  latitude: number;
  longitude: number;
}): Promise<ServiceabilityResult> {
  const query = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
  });

  const { data } = await api.get<ApiResponse<ServiceabilityResult>>(
    `/serviceability/check?${query.toString()}`,
  );
  return data.data;
}
