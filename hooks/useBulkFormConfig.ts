import { useCallback, useEffect, useMemo } from 'react';
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import {
  BRICK_GRADE_OPTIONS,
  BRICK_PRODUCT_TYPE_OPTIONS,
} from '@constants/filterOptions';
import {
  DELIVERY_REQUIREMENT_LABELS,
  MIXED_LOAD_SLUG,
} from '@constants/bulkEnquiry';
import { storage } from '@lib/storage';
import {
  bulkApi,
  type BulkFormConfig,
  type BulkFormConfigCategory,
} from '@services/bulk.api';
import {
  areCategoriesFresh,
  useCatalogStore,
} from '@store/catalogStore';

export const BULK_FORM_CONFIG_QUERY_KEY = 'bulk-form-config';
export const BULK_FORM_CONFIG_STALE_TIME = 1000 * 60 * 10;
const STORAGE_KEY = 'bulk-form-config-v1';

const STATIC_UNITS = [
  'Bags',
  'MT',
  'Tonnes',
  'Cubic Meter',
  'Cum',
  'Pieces',
  'Numbers',
  'Loads',
  'Units',
] as const;

/** Module cache — survives remounts within the JS session. */
let memoryCache: BulkFormConfig | null = null;
let storageHydrateStarted = false;

function withMixedLoad(
  categories: BulkFormConfigCategory[],
): BulkFormConfigCategory[] {
  if (categories.some((c) => c.slug === MIXED_LOAD_SLUG)) return categories;
  return [
    ...categories,
    {
      id: MIXED_LOAD_SLUG,
      slug: MIXED_LOAD_SLUG,
      name: 'Mixed Load',
      imageUrl: null,
    },
  ];
}

/** Instant local config so the enquiry screen never waits on the network. */
export function buildStaticBulkFormConfig(
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    imageUrl?: string | null;
  }> = [],
): BulkFormConfig {
  const mapped = withMixedLoad(
    categories
      .filter((c) => c.slug && c.slug !== MIXED_LOAD_SLUG)
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        imageUrl: c.imageUrl ?? null,
      })),
  );

  return {
    categories: mapped,
    deliveryRequirements: (
      Object.keys(DELIVERY_REQUIREMENT_LABELS) as Array<
        keyof typeof DELIVERY_REQUIREMENT_LABELS
      >
    ).map((value) => ({
      value,
      label: DELIVERY_REQUIREMENT_LABELS[value],
    })),
    preferredContacts: [
      { value: 'CALL', label: 'Call' },
      { value: 'WHATSAPP', label: 'WhatsApp' },
    ],
    units: [...STATIC_UNITS],
    brickProductTypes: BRICK_PRODUCT_TYPE_OPTIONS.map((o) => ({
      value: o.code,
      label: o.label,
    })),
    brickGrades: BRICK_GRADE_OPTIONS.map((o) => ({
      value: o.code,
      label: o.label,
    })),
  };
}

const EMPTY_STATIC_CONFIG = buildStaticBulkFormConfig();

function remember(config: BulkFormConfig): BulkFormConfig {
  memoryCache = config;
  void storage.setObject(STORAGE_KEY, config);
  return config;
}

export function getCachedBulkFormConfig(): BulkFormConfig | null {
  return memoryCache;
}

export async function prefetchBulkFormConfig(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: [BULK_FORM_CONFIG_QUERY_KEY],
    queryFn: async () => remember(await bulkApi.getFormConfig()),
    staleTime: BULK_FORM_CONFIG_STALE_TIME,
  });
}

export function useBulkFormConfig(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  const queryClient = useQueryClient();
  const catalogCategories = useCatalogStore((s) => s.categories);
  const categoriesFetchedAt = useCatalogStore((s) => s.categoriesFetchedAt);

  const catalogPlaceholder = useMemo(() => {
    if (!areCategoriesFresh(categoriesFetchedAt) || catalogCategories.length === 0) {
      return null;
    }
    return buildStaticBulkFormConfig(catalogCategories);
  }, [catalogCategories, categoriesFetchedAt]);

  const placeholder =
    memoryCache ?? catalogPlaceholder ?? EMPTY_STATIC_CONFIG;

  useEffect(() => {
    if (storageHydrateStarted || memoryCache) return;
    storageHydrateStarted = true;
    void storage.getObject<BulkFormConfig>(STORAGE_KEY).then((cached) => {
      if (!cached?.categories?.length) return;
      memoryCache = cached;
      queryClient.setQueryData([BULK_FORM_CONFIG_QUERY_KEY], cached);
    });
  }, [queryClient]);

  const query = useQuery({
    queryKey: [BULK_FORM_CONFIG_QUERY_KEY],
    queryFn: async () => remember(await bulkApi.getFormConfig()),
    staleTime: BULK_FORM_CONFIG_STALE_TIME,
    gcTime: 1000 * 60 * 60,
    enabled,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previous) => previous ?? placeholder,
    retry: 1,
  });

  const formConfig = query.data ?? placeholder;
  const hasMaterialCategories = (formConfig.categories ?? []).some(
    (c) => c.slug !== MIXED_LOAD_SLUG,
  );

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    formConfig,
    /** Only block the screen when we have no material chips yet. */
    isLoading:
      enabled &&
      !hasMaterialCategories &&
      query.isFetching &&
      !query.isError,
    isRefreshing: query.isRefetching,
    error: query.error,
    refresh,
  };
}
