import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@store/useAuthStore';
import { useUserStore } from '@store/userStore';

export const CUSTOMER_PROFILE_QUERY_KEY = 'customer-profile';
const PROFILE_STALE_TIME = 1000 * 60;

/**
 * Loads `/customer/profile` when Account is opened.
 * Cached identity from userStore is shown immediately; this call refreshes it.
 */
export function useCustomerProfile(enabled = true) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isGuest = useAuthStore((s) => s.isGuest);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const active = enabled && isLoggedIn && !isGuest;

  const query = useQuery({
    queryKey: [CUSTOMER_PROFILE_QUERY_KEY],
    queryFn: () => refreshProfile(),
    enabled: active,
    staleTime: PROFILE_STALE_TIME,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    retry: 2,
  });

  useFocusEffect(
    useCallback(() => {
      if (!active) return undefined;
      void query.refetch();
      return undefined;
    }, [active, query.refetch]),
  );

  const user = useUserStore((s) => s.user);
  return { ...query, user };
}
