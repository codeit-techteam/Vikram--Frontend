import { api } from '@services/api';
import type { ApiError, ApiResponse } from '@/types';
import type { ApiCategory, ApiCategoryFacets } from '@/types/api-catalog';
import { adaptApiCategory } from '@utils/catalogAdapters';
import type { CatalogCategory } from '@/types/catalog';

const CATEGORIES_BASE = '/categories';

export async function fetchCategories(featured?: boolean): Promise<CatalogCategory[]> {
  const query = featured === true ? '?featured=true' : '';
  const { data } = await api.get<ApiResponse<ApiCategory[]>>(`${CATEGORIES_BASE}${query}`);
  return (data.data ?? []).map(adaptApiCategory);
}

export async function fetchCategoryBySlug(slug: string): Promise<CatalogCategory> {
  const { data } = await api.get<ApiResponse<ApiCategory>>(`${CATEGORIES_BASE}/${slug}`);
  return adaptApiCategory(data.data);
}

/**
 * Optional server aggregation. Returns null on older backends that do not
 * expose `/facets` yet (production 404) so the app can fall back to products.
 */
export async function fetchCategoryFacets(
  categoryIdOrSlug: string,
  signal?: AbortSignal,
): Promise<ApiCategoryFacets | null> {
  try {
    const { data } = await api.get<ApiResponse<ApiCategoryFacets>>(
      `${CATEGORIES_BASE}/${encodeURIComponent(categoryIdOrSlug)}/facets`,
      { signal },
    );
    return data.data ?? null;
  } catch (error) {
    const status = (error as ApiError)?.statusCode;
    if (status === 404) return null;
    throw error;
  }
}

export const categoryService = {
  fetchCategories,
  fetchCategoryBySlug,
  fetchCategoryFacets,
};
