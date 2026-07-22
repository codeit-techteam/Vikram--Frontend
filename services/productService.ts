import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type {
  ApiProduct,
  ApiProductList,
  ProductQueryParams,
} from '@/types/api-catalog';
import { adaptApiProduct } from '@utils/catalogAdapters';
import type { Product } from '@/types/catalog';

const PRODUCTS_BASE = '/products';

export interface ProductListPage {
  items: Product[];
  meta: ApiProductList['meta'];
}

function buildQuery(params: ProductQueryParams = {}): string {
  const query = new URLSearchParams();

  if (params.page != null) query.set('page', String(params.page));
  if (params.limit != null) query.set('limit', String(params.limit));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.category) query.set('category', params.category);
  if (params.search) query.set('search', params.search);
  if (params.featured === true) query.set('featured', 'true');
  if (params.bestSelling === true) query.set('bestSelling', 'true');
  if (params.listingType) query.set('listingType', params.listingType);
  if (params.brand) query.set('brand', params.brand);
  if (params.grade) query.set('grade', params.grade);
  if (params.status) query.set('status', params.status);
  if (params.minPrice != null) query.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) query.set('maxPrice', String(params.maxPrice));

  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchProducts(
  params: ProductQueryParams = {},
): Promise<ProductListPage> {
  const { data } = await api.get<ApiResponse<ApiProductList>>(
    `${PRODUCTS_BASE}${buildQuery(params)}`,
  );
  const payload = data.data;
  return {
    items: (payload.items ?? []).map(adaptApiProduct),
    meta: payload.meta,
  };
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const { data } = await api.get<ApiResponse<ApiProduct>>(`${PRODUCTS_BASE}/${slug}`);
  return adaptApiProduct(data.data);
}

/**
 * Related products from detail payload, or category siblings as fallback.
 */
export async function fetchRelatedProducts(
  product: Product,
): Promise<Product[]> {
  if (product.relatedProducts && product.relatedProducts.length > 0) {
    return product.relatedProducts;
  }

  const category = product.categorySlug;
  if (!category) return [];

  try {
    const page = await fetchProducts({
      category,
      page: 1,
      limit: 8,
    });
    return page.items.filter((p) => p.id !== product.id && p.slug !== product.slug);
  } catch {
    return [];
  }
}

export async function searchProductsApi(
  q: string,
  params: Omit<ProductQueryParams, 'search'> = {},
): Promise<ProductListPage> {
  return fetchProducts({ ...params, search: q });
}

export const productService = {
  fetchProducts,
  fetchProductBySlug,
  fetchRelatedProducts,
  searchProductsApi,
};
