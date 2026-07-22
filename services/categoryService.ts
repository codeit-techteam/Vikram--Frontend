import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type { ApiCategory } from '@/types/api-catalog';
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

export const categoryService = {
  fetchCategories,
  fetchCategoryBySlug,
};
