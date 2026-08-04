import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchCmsHome } from '@services/cmsService';
import type { CmsHomeResponse } from '@/types/cms';

export const CMS_HOME_QUERY_KEY = 'cms-home';
/** Short stale window so Super Admin → R2 → DB edits appear without rebuild. */
export const CMS_HOME_STALE_TIME = 1000 * 30;

export function useCmsHome(options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: [CMS_HOME_QUERY_KEY],
    queryFn: fetchCmsHome,
    staleTime: CMS_HOME_STALE_TIME,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60,
    enabled: options?.enabled !== false,
  });

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const cms: CmsHomeResponse | null = query.data ?? null;

  return {
    cms,
    sections: cms?.sections ?? [],
    banners: (cms?.banners ?? []).filter((b) => b.placement === 'HOME_HERO'),
    heroBanners:
      cms?.heroBanners ??
      (cms?.banners ?? []).filter((b) => b.placement === 'HOME_HERO'),
    videoBanners: cms?.videoBanners ?? [],
    heroVideo: cms?.heroVideo ?? cms?.videoBanners?.[0] ?? null,
    ads: cms?.ads ?? cms?.brandAdvertisements ?? [],
    brandAdvertisements: cms?.brandAdvertisements ?? cms?.ads ?? [],
    testimonials: cms?.testimonials ?? [],
    promotions: cms?.promotions ?? [],
    offers: cms?.offers ?? [],
    quickActions: cms?.quickActions ?? [],
    emergencyBanner: cms?.emergencyBanner ?? null,
    emergencyDelivery: cms?.emergencyDelivery ?? null,
    bulkProcurement: cms?.bulkProcurement ?? null,
    membership: cms?.membership ?? null,
    priorityExpress: cms?.priorityExpress ?? null,
    isLoading: query.isLoading && !cms,
    isRefreshing: query.isRefetching,
    error: query.error,
    refresh,
  };
}
