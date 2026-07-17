import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { fetchOrderById, reorderItems } from '@services/orders.api';
import { useReorderFeedbackStore } from '@store/reorderFeedbackStore';
import {
  applyReorderToCart,
  resolveReorderProducts,
} from '@utils/reorderHelpers';

export const CART_QUERY_KEY = 'cart';

export function useReorder() {
  const queryClient = useQueryClient();
  const showToast = useReorderFeedbackStore((s) => s.showToast);
  const showUnavailableSheet = useReorderFeedbackStore((s) => s.showUnavailableSheet);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (orderId: string) => {
      setPendingOrderId(orderId);
      const response = await reorderItems(orderId);
      const order = await fetchOrderById(orderId);
      const products = resolveReorderProducts(response.products, order.products);
      const result = applyReorderToCart(products);
      return { ...result, orderId };
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });

      if (result.allUnavailable) {
        showUnavailableSheet();
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(result.message);

      setTimeout(() => {
        router.push('/(tabs)/cart');
      }, 400);
    },
    onSettled: () => {
      setPendingOrderId(null);
    },
  });

  const reorder = useCallback(
    (orderId: string) => mutation.mutateAsync(orderId),
    [mutation],
  );

  return {
    reorder,
    isReordering: mutation.isPending,
    reorderingOrderId: pendingOrderId,
  };
}
