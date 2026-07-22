import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type { ApiHomeResponse } from '@/types/api-catalog';
import { adaptApiCategory, adaptApiProduct } from '@utils/catalogAdapters';
import type { CatalogCategory, Product } from '@/types/catalog';

const HOME_BASE = '/home';

export interface HomeCatalogData {
  featuredCategories: CatalogCategory[];
  topCategories: CatalogCategory[];
  featuredProducts: Product[];
  bestSellingProducts: Product[];
  recommendedProducts: Product[];
  quickStats: ApiHomeResponse['quickStats'];
  announcements: ApiHomeResponse['announcements'];
  raw: ApiHomeResponse;
}

export async function fetchHomeCatalog(): Promise<HomeCatalogData> {
  const { data } = await api.get<ApiResponse<ApiHomeResponse>>(HOME_BASE);
  const payload = data.data;

  return {
    featuredCategories: (payload.featuredCategories ?? []).map(adaptApiCategory),
    topCategories: (payload.topCategories ?? []).map(adaptApiCategory),
    featuredProducts: (payload.featuredProducts ?? []).map(adaptApiProduct),
    bestSellingProducts: (payload.bestSellingProducts ?? []).map(adaptApiProduct),
    recommendedProducts: (payload.recommendedProducts ?? []).map(adaptApiProduct),
    quickStats: payload.quickStats,
    announcements: payload.announcements ?? [],
    raw: payload,
  };
}

export const homeService = {
  fetchHomeCatalog,
};
