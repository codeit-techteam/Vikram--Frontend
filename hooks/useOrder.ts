import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { usePathname } from 'expo-router';

import {
  cancelOrder,
  fetchOrderById,
  fetchOrderInvoice,
  fetchOrderInvoicePdf,
} from '@services/orders.api';
import { realtimeSocket } from '@services/realtime.socket';
import { ORDERS_QUERY_KEY, ORDERS_STALE_TIME } from '@hooks/useOrders';
import { isActiveStatus } from '@constants/orderStatus';
import { useOrdersSyncStore } from '@store/ordersSyncStore';
import type { CancelOrderPayload, Order, OrdersPage } from '@/types/order';
import { getOrderVersion, mergeOrderState, shouldReplaceOrder } from '@utils/orderMerge';

/** Fallback poll when socket is down; slower when live connection is healthy. */
const ORDER_POLL_MS_FALLBACK = 10_000;
const ORDER_POLL_MS_SOCKET = 60_000;

function findOrderInListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: string,
): Order | undefined {
  const lists = queryClient.getQueriesData<InfiniteData<OrdersPage>>({
    queryKey: [ORDERS_QUERY_KEY],
  });
  for (const [, data] of lists) {
    const match = data?.pages
      .flatMap((page) => page.items)
      .find((order) => order.id === orderId);
    if (match) return match;
  }
  return undefined;
}

function isOrderDetailsPath(pathname: string, orderId: string): boolean {
  return (
    pathname.includes(`/orders/view/${orderId}`) ||
    pathname.includes(`/orders/details/${orderId}`) ||
    pathname.includes(`/orders/${orderId}`)
  );
}

export function useOrder(orderId: string | undefined) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [socketConnected, setSocketConnected] = useState(
    realtimeSocket.isConnected(),
  );

  const storeOrder = useOrdersSyncStore((s) =>
    orderId ? s.ordersById[orderId] : undefined,
  );

  useEffect(() => realtimeSocket.onConnectionChange(setSocketConnected), []);

  useEffect(() => {
    if (!orderId) return;
    useOrdersSyncStore.getState().selectOrder(orderId);
    realtimeSocket.subscribeOrder(orderId);
    return () => {
      realtimeSocket.unsubscribeOrder(orderId);
      const selected = useOrdersSyncStore.getState().selectedOrderId;
      if (selected === orderId) {
        useOrdersSyncStore.getState().selectOrder(null);
      }
    };
  }, [orderId]);

  const seedOrder = useMemo(() => {
    if (!orderId) return undefined;
    const cached = queryClient.getQueryData<Order>(['order', orderId]);
    const fromList = findOrderInListCaches(queryClient, orderId);
    const candidates = [storeOrder, cached, fromList].filter(Boolean) as Order[];
    if (!candidates.length) return undefined;
    return candidates.reduce((best, next) =>
      shouldReplaceOrder(best, next) ? next : best,
    );
  }, [orderId, queryClient, storeOrder]);

  const isTerminal = useMemo(() => {
    const status = storeOrder?.status ?? seedOrder?.status;
    return status === 'delivered' || status === 'cancelled' || status === 'refunded';
  }, [seedOrder?.status, storeOrder?.status]);

  const shouldPoll =
    Boolean(orderId) &&
    !isTerminal &&
    (!socketConnected ||
      isActiveStatus(storeOrder?.status ?? seedOrder?.status ?? 'pending'));

  const query = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const fresh = await fetchOrderById(orderId!);
      const existing =
        queryClient.getQueryData<Order>(['order', orderId]) ??
        useOrdersSyncStore.getState().getOrder(orderId!);

      const merged = existing ? mergeOrderState(existing, fresh) : mergeOrderState(null, fresh);

      // Never let a slower/stale HTTP response overwrite newer realtime state.
      if (existing && !shouldReplaceOrder(existing, fresh)) {
        if (__DEV__) {
          console.log(
            '[realtime] keep newer local order over stale fetch',
            orderId,
            existing.status,
            `v${getOrderVersion(existing)}`,
            '>',
            fresh.status,
            `v${getOrderVersion(fresh)}`,
          );
        }
        useOrdersSyncStore.getState().upsertOrder(existing);
        return existing;
      }

      useOrdersSyncStore.getState().upsertOrder(merged);

      // Keep list caches aligned with the same object.
      queryClient.setQueriesData<InfiniteData<OrdersPage>>(
        { queryKey: [ORDERS_QUERY_KEY] },
        (listData) => {
          if (!listData) return listData;
          return {
            ...listData,
            pages: listData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === merged.id ? mergeOrderState(item, merged) : item,
              ),
            })),
          };
        },
      );

      return merged;
    },
    enabled: Boolean(orderId),
    initialData: seedOrder,
    initialDataUpdatedAt: seedOrder ? getOrderVersion(seedOrder) || Date.now() : undefined,
    staleTime: socketConnected ? ORDER_POLL_MS_SOCKET : ORDER_POLL_MS_FALLBACK,
    gcTime: ORDERS_STALE_TIME,
    refetchInterval: shouldPoll
      ? socketConnected
        ? ORDER_POLL_MS_SOCKET
        : ORDER_POLL_MS_FALLBACK
      : false,
  });

  // Revalidate when this order's details/tracking route is active.
  // Uses expo-router pathname (no NavigationContainer dependency).
  const isViewingThisOrder = Boolean(
    orderId && isOrderDetailsPath(pathname, orderId),
  );
  useEffect(() => {
    if (!orderId || !isViewingThisOrder) return;
    void queryClient.invalidateQueries({
      queryKey: ['order', orderId],
      refetchType: 'active',
    });
  }, [orderId, isViewingThisOrder, queryClient]);

  // Mirror React Query → SSOT when socket/local patches update the cache.
  useEffect(() => {
    if (query.data) {
      useOrdersSyncStore.getState().upsertOrder(query.data);
    }
  }, [query.data]);

  const cancelMutation = useMutation({
    mutationFn: (payload: CancelOrderPayload = {}) => cancelOrder(orderId!, payload),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['order', orderId] });
      const previous = queryClient.getQueryData<Order>(['order', orderId]);

      const optimistic = previous
        ? {
            ...previous,
            status: 'cancelled' as const,
            statusLabel: 'Cancelled',
            cancellationReason: 'Cancelling…',
            expectedDelivery: undefined,
            tracking: undefined,
          }
        : previous;

      if (optimistic) {
        queryClient.setQueryData<Order>(['order', orderId], optimistic);
        useOrdersSyncStore.getState().upsertOrder(optimistic);
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['order', orderId], context.previous);
        useOrdersSyncStore.getState().upsertOrder(context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const invoiceMutation = useMutation({
    mutationFn: () => fetchOrderInvoice(orderId!),
  });

  const invoicePdfMutation = useMutation({
    mutationFn: () => fetchOrderInvoicePdf(orderId!),
  });

  // Prefer live store snapshot so an open details screen updates instantly on socket.
  const order = storeOrder ?? query.data;

  return {
    order,
    isLoading: query.isLoading && !order,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    cancelOrder: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    fetchInvoice: invoiceMutation.mutateAsync,
    isFetchingInvoice: invoiceMutation.isPending,
    downloadInvoicePdf: invoicePdfMutation.mutateAsync,
    isDownloadingInvoicePdf: invoicePdfMutation.isPending,
  };
}
