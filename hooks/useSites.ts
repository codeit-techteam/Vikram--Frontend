import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createSite,
  deleteSite,
  getCurrentSite,
  getSites,
  setPrimarySite,
  updateSite,
  type CreateSitePayload,
  type DeliverySite,
  type UpdateSitePayload,
} from '@services/sites.api';
import { findHubForLocation } from '@services/coverage.api';
import { useAuthStore } from '@store/useAuthStore';
import { useDeliveryStore } from '@store/deliveryStore';

export const SITES_QUERY_KEY = 'customer-sites';
export const CURRENT_SITE_QUERY_KEY = 'customer-current-site';
export const SITES_STALE_TIME = 1000 * 60 * 10;

async function resolveAssignedHub(site?: DeliverySite | null) {
  if (!site) {
    useDeliveryStore.getState().setAssignedHub(null);
    return;
  }
  try {
    const hub = await findHubForLocation({
      lat: site.latitude,
      lng: site.longitude,
      pincode: site.pincode,
    });
    if (hub?.inCoverage) {
      useDeliveryStore.getState().setAssignedHub({
        id: hub.id,
        name: hub.name,
        code: hub.code,
      });
    } else {
      useDeliveryStore.getState().setAssignedHub(null);
    }
  } catch {
    useDeliveryStore.getState().setAssignedHub(null);
  }
}

function syncDeliveryStore(sites: DeliverySite[]) {
  const mapped = sites.map((s) => ({
    id: s.id,
    name: s.siteName,
    address: [s.fullAddress, s.city].filter(Boolean).join(', '),
  }));
  const primary = sites.find((s) => s.isPrimary) ?? sites[0];
  useDeliveryStore.getState().setSites(mapped);
  if (primary) {
    useDeliveryStore.getState().setSelectedSite(primary.id);
  }
  useDeliveryStore.getState().setProfileSitesFromDeliverySites(sites);
  void resolveAssignedHub(primary);
}

export function useSites(enabled = true) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return useQuery({
    queryKey: [SITES_QUERY_KEY],
    queryFn: async () => {
      const sites = await getSites();
      syncDeliveryStore(sites);
      return sites;
    },
    enabled: enabled && isLoggedIn,
    staleTime: SITES_STALE_TIME,
    gcTime: SITES_STALE_TIME * 2,
  });
}

export function useCurrentSite(enabled = true) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return useQuery({
    queryKey: [CURRENT_SITE_QUERY_KEY],
    queryFn: getCurrentSite,
    enabled: enabled && isLoggedIn,
    staleTime: SITES_STALE_TIME,
  });
}

export function useSiteMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [SITES_QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: [CURRENT_SITE_QUERY_KEY] }),
    ]);
  };

  const create = useMutation({
    mutationFn: (payload: CreateSitePayload) => createSite(payload),
    onSuccess: async (site) => {
      queryClient.setQueryData<DeliverySite[]>([SITES_QUERY_KEY], (prev) => {
        const next = [...(prev ?? []).filter((s) => s.id !== site.id), site];
        if (site.isPrimary) {
          return next.map((s) =>
            s.id === site.id ? s : { ...s, isPrimary: false },
          );
        }
        return next;
      });
      syncDeliveryStore(
        (queryClient.getQueryData<DeliverySite[]>([SITES_QUERY_KEY]) ?? [site]),
      );
      await invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSitePayload;
    }) => updateSite(id, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSite(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [SITES_QUERY_KEY] });
      const prev = queryClient.getQueryData<DeliverySite[]>([SITES_QUERY_KEY]);
      if (prev) {
        const next = prev.filter((s) => s.id !== id);
        queryClient.setQueryData([SITES_QUERY_KEY], next);
        syncDeliveryStore(next);
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData([SITES_QUERY_KEY], ctx.prev);
        syncDeliveryStore(ctx.prev);
      }
    },
    onSettled: invalidate,
  });

  const setPrimary = useMutation({
    mutationFn: (id: string) => setPrimarySite(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [SITES_QUERY_KEY] });
      const prev = queryClient.getQueryData<DeliverySite[]>([SITES_QUERY_KEY]);
      if (prev) {
        const next = prev.map((s) => ({ ...s, isPrimary: s.id === id }));
        queryClient.setQueryData([SITES_QUERY_KEY], next);
        syncDeliveryStore(next);
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData([SITES_QUERY_KEY], ctx.prev);
        syncDeliveryStore(ctx.prev);
      }
    },
    onSettled: invalidate,
  });

  return { create, update, remove, setPrimary, invalidate };
}
