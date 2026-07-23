import { useCallback, useState } from 'react';
import * as Haptics from 'expo-haptics';

import { useCartFeedbackStore } from '@store/cartFeedbackStore';
import { useCartStore } from '@store/cartStore';
import type { Product } from '@/types/catalog';
import { productToCartItem, type CartItemOptions } from '@utils/cartHelpers';
import { requireAuthOr } from '@utils/requireAuth';

export type AddToCartButtonState = 'idle' | 'loading' | 'success';

const LOADING_MS = 280;

/**
 * Adds or updates cart with an absolute quantity.
 * Cart badge updates only when this runs — not when local qty changes.
 */
export function useAddToCart() {
  const upsertItem = useCartStore((s) => s.upsertItem);
  const showFeedback = useCartFeedbackStore((s) => s.showFeedback);
  const [buttonState, setButtonState] = useState<AddToCartButtonState>('idle');

  const addToCart = useCallback(
    async (product: Product, quantity: number, options?: CartItemOptions) => {
      if (buttonState === 'loading') return null;

      const runAdd = async () => {
        setButtonState('loading');
        await new Promise((resolve) => setTimeout(resolve, LOADING_MS));

        const cartItem = productToCartItem(product, quantity, options);
        const outcome = upsertItem(cartItem);

        setButtonState('success');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showFeedback({ outcome });

        setTimeout(() => setButtonState('idle'), 600);
        return outcome;
      };

      if (!requireAuthOr(() => {
        void runAdd();
      })) {
        return null;
      }

      return runAdd();
    },
    [upsertItem, buttonState, showFeedback],
  );

  return { addToCart, buttonState };
}
