import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import {
  cancelOrder,
  fetchOrderById,
  fetchOrders,
  getActiveOrderCount,
} from '@services/orders.api';
import type { Order, OrderFilterStatus, OrdersPage } from '@/types/order';

export const ORDERS_QUERY_KEY = 'orders';
export const ORDERS_STALE_TIME = 1000 * 60 * 10;

function ordersKey(status: OrderFilterStatus, search: string) {
  return [ORDERS_QUERY_KEY, status, search] as const;
}

export function useOrders(status: OrderFilterStatus = 'all', search = '') {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ordersKey(status, search),
    queryFn: ({ pageParam }) =>
      fetchOrders({
        status,
        cursor: pageParam as string | undefined,
        limit: 10,
        search: search || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    staleTime: ORDERS_STALE_TIME,
    gcTime: ORDERS_STALE_TIME,
  });

  const orders = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );

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
                    }
                  : order,
              ),
            })),
          };
        },
      );

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
      queryClient.prefetchQuery({
        queryKey: ['order', orderId],
        queryFn: () => fetchOrderById(orderId),
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
  };
}

export function useActiveOrderCount() {
  const { activeCount, isLoading } = useOrders('active');
  return { count: activeCount, isLoading };
}

export type { Order };
