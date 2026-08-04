import { useCallback, useEffect, useMemo } from 'react';
import {
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';

import {
  fetchCategoryProducts,
  fetchProductBySlug,
  fetchProducts,
  fetchRelatedProducts,
} from '@services/productService';
import type { ProductQueryParams } from '@/types/api-catalog';
import type { Product } from '@/types/catalog';
import { useCatalogStore } from '@store/catalogStore';
import { useProductStore } from '@store/productStore';

export const PRODUCTS_QUERY_KEY = 'products';
export const PRODUCT_DETAIL_QUERY_KEY = 'product';
export const PRODUCTS_STALE_TIME = 1000 * 60;

export function useProducts(
  params: Omit<ProductQueryParams, 'page'> = {},
  options?: { enabled?: boolean; pageSize?: number },
) {
  const pageSize = options?.pageSize ?? 20;
  const mergedParams = useMemo(() => ({ ...params }), [params]);

  const query = useInfiniteQuery({
    queryKey: [PRODUCTS_QUERY_KEY, mergedParams, pageSize],
    queryFn: async ({ pageParam }) => {
      const page =
        mergedParams.category
          ? await fetchCategoryProducts(mergedParams.category, {
              ...mergedParams,
              page: pageParam,
              limit: pageSize,
            })
          : await fetchProducts({
              ...mergedParams,
              page: pageParam,
              limit: pageSize,
            });

      if (pageParam === 1) {
        useProductStore.getState().setProducts(page.items, JSON.stringify(mergedParams));
      } else {
        useProductStore.getState().appendProducts(page.items);
      }
      return page;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    staleTime: PRODUCTS_STALE_TIME,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
  });

  const products = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );

  const total = query.data?.pages[0]?.meta.total ?? products.length;

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return {
    products,
    total,
    isLoading: query.isLoading && products.length === 0,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    error: query.error,
    refresh,
    loadMore,
  };
}

export function useProductDetail(slugOrId?: string) {
  const cacheProduct = useCatalogStore((s) => s.cacheProduct);
  const cached = useCatalogStore((s) =>
    slugOrId ? s.getCachedProduct(slugOrId) : undefined,
  );

  const query = useQuery({
    queryKey: [PRODUCT_DETAIL_QUERY_KEY, slugOrId],
    queryFn: () => fetchProductBySlug(slugOrId!),
    enabled: Boolean(slugOrId),
    staleTime: PRODUCTS_STALE_TIME,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    placeholderData: cached,
  });

  useEffect(() => {
    if (query.data) cacheProduct(query.data);
  }, [query.data, cacheProduct]);

  return {
    product: query.data,
    isLoading: query.isLoading && !query.data,
    isRefreshing: query.isRefetching,
    error: query.error,
    refresh: query.refetch,
  };
}

export function useRelatedProducts(product?: Product | null) {
  const hasInlineRelated = (product?.relatedProducts?.length ?? 0) > 0;

  const query = useQuery({
    queryKey: [PRODUCT_DETAIL_QUERY_KEY, product?.slug ?? product?.id, 'related'],
    queryFn: () => fetchRelatedProducts(product!),
    enabled: Boolean(product) && !hasInlineRelated,
    staleTime: PRODUCTS_STALE_TIME,
  });

  return {
    related: hasInlineRelated
      ? (product?.relatedProducts ?? [])
      : (query.data ?? []),
    isLoading: !hasInlineRelated && query.isLoading,
    error: query.error,
  };
}
