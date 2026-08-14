import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type { CmsDeliveryPromotion } from '@/types/cms';

export async function fetchDeliveryPromotions(): Promise<CmsDeliveryPromotion[]> {
  try {
    const { data } = await api.get<ApiResponse<CmsDeliveryPromotion[]>>(
      '/cms/delivery-promotions',
    );
    return (data.data ?? []).filter((item) => Boolean(item.bannerImage));
  } catch (error) {
    if (__DEV__) {
      console.warn('[delivery-promotions] fetch failed', error);
    }
    return [];
  }
}
