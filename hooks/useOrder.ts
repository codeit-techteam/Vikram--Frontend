import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cancelOrder,
  fetchOrderById,
  fetchOrderInvoice,
  fetchOrderInvoicePdf,
} from '@services/orders.api';
import { ORDERS_STALE_TIME } from '@hooks/useOrders';
import type { CancelOrderPayload, Order } from '@/types/order';

const ORDER_POLL_MS = 10_000;

export function useOrder(orderId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId!),
    enabled: Boolean(orderId),
    staleTime: ORDER_POLL_MS,
    gcTime: ORDERS_STALE_TIME,
    refetchInterval: ORDER_POLL_MS,
  });

  const cancelMutation = useMutation({
    mutationFn: (payload: CancelOrderPayload = {}) => cancelOrder(orderId!, payload),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['order', orderId] });
      const previous = queryClient.getQueryData<Order>(['order', orderId]);

      queryClient.setQueryData<Order>(['order', orderId], (old) =>
        old
          ? {
              ...old,
              status: 'cancelled',
              statusLabel: 'Cancelled',
              cancellationReason: 'Cancelling…',
            }
          : old,
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['order', orderId], context.previous);
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

  return {
    order: query.data,
    isLoading: query.isLoading,
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
