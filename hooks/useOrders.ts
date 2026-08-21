import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  cancelOrder,
  fetchOrderById,
  fetchOrders,
  getActiveOrderCount,
} from '@services/orders.api';
import { realtimeSocket } from '@services/realtime.socket';
import { isActiveStatus } from '@constants/orderStatus';
import { useOrdersSyncStore } from '@store/ordersSyncStore';
import type { Order, OrderFilterStatus, OrdersPage } from '@/types/order';
import { mergeOrderState, preferFresherOrder } from '@utils/orderMerge';

export const ORDERS_QUERY_KEY = 'orders';
export const ORDERS_STALE_TIME = 1000 * 60 * 10;
const ACTIVE_POLL_MS = 10_000;

function ordersKey(status: OrderFilterStatus, search: string) {
  return [ORDERS_QUERY_KEY, status, search] as const;
}

/** Merge HTTP list page with SSOT so a socket Delivered is never overwritten by stale cache. */
function mergePageWithStore(page: OrdersPage): OrdersPage {
  const store = useOrdersSyncStore.getState();
  const items = page.items.map((item) => {
    const local = store.getOrder(item.id);
    return local ? preferFresherOrder(item, local) : mergeOrderState(null, item);
  });
  store.upsertMany(items);
  return { ...page, items };
}

export function useOrders(status: OrderFilterStatus = 'all', search = '') {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(
    realtimeSocket.isConnected(),
  );
  const ordersById = useOrdersSyncStore((s) => s.ordersById);

  useEffect(() => realtimeSocket.onConnectionChange(setSocketConnected), []);

  const query = useInfiniteQuery({
    queryKey: ordersKey(status, search),
    queryFn: async ({ pageParam }) => {
      const page = await fetchOrders({
        status,
        cursor: pageParam as string | undefined,
        limit: 10,
        search: search || undefined,
      });
      return mergePageWithStore(page);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    staleTime: socketConnected ? ORDERS_STALE_TIME : ACTIVE_POLL_MS,
    gcTime: ORDERS_STALE_TIME,
    refetchInterval: (q) => {
      const items = q.state.data?.pages.flatMap((page) => page.items) ?? [];
      const hasActive = items.some((order) => isActiveStatus(order.status));
      if (!hasActive) return false;
      // Poll every 10s ONLY while an active order exists AND socket is down.
      return realtimeSocket.isConnected() ? false : ACTIVE_POLL_MS;
    },
  });

  const orders = useMemo(() => {
    const fromQuery = query.data?.pages.flatMap((page) => page.items) ?? [];
    // Overlay SSOT so list cards update the instant a socket patch lands.
    return fromQuery.map((item) => {
      const live = ordersById[item.id];
      return live ? preferFresherOrder(item, live) : item;
    });
  }, [query.data?.pages, ordersById]);

  const activeCount = useMemo(() => getActiveOrderCount(orders), [orders]);

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      cancelOrder(orderId, { reason }),
    onMutate: async ({ orderId }) => {
      await queryClient.cancelQueries({ queryKey: [ORDERS_QUERY_KEY] });

      const previous = queryClient.getQueriesData<InfiniteData<OrdersPage>>({
        queryKey: [ORDERS_QUERY_KEY],
      });

      queryClient.setQueriesData<InfiniteData<OrdersPage>>(
        { queryKey: [ORDERS_QUERY_KEY] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((order) =>
                order.id === orderId
                  ? {
                      ...order,
                      status: 'cancelled' as const,
                      cancellationReason: 'Cancelling…',
                      expectedDelivery: undefined,
                      tracking: undefined,
                    }
                  : order,
              ),
            })),
          };
        },
      );

      const existing = useOrdersSyncStore.getState().getOrder(orderId);
      if (existing) {
        useOrdersSyncStore.getState().upsertOrder({
          ...existing,
          status: 'cancelled',
          statusLabel: 'Cancelled',
          cancellationReason: 'Cancelling…',
          expectedDelivery: undefined,
          tracking: undefined,
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: (_data, _err, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });

  const prefetchOrder = useCallback(
    (orderId: string) => {
      const seed =
        useOrdersSyncStore.getState().getOrder(orderId) ??
        queryClient.getQueryData<Order>(['order', orderId]);

      if (seed) {
        queryClient.setQueryData(['order', orderId], seed);
      }

      queryClient.prefetchQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
          const fresh = await fetchOrderById(orderId);
          const local =
            useOrdersSyncStore.getState().getOrder(orderId) ??
            queryClient.getQueryData<Order>(['order', orderId]);
          const merged = local ? mergeOrderState(local, fresh) : mergeOrderState(null, fresh);
          useOrdersSyncStore.getState().upsertOrder(merged);
          return merged;
        },
        staleTime: ORDERS_STALE_TIME,
      });
    },
    [queryClient],
  );

  return {
    orders,
    activeCount,
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    error: query.error,
    refresh,
    loadMore,
    cancelOrder: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    prefetchOrder,
    socketConnected,
  };
}

export function useActiveOrderCount() {
  const { activeCount, isLoading } = useOrders('active');
  return { count: activeCount, isLoading };
}

export type { Order };
