import { useCallback, useState } from 'react';
import * as Haptics from 'expo-haptics';

import { useCartFeedbackStore } from '@store/cartFeedbackStore';
import { useCartStore } from '@store/cartStore';
import type { Product } from '@/types/catalog';
import { productToCartItem, type CartItemOptions } from '@utils/cartHelpers';

export type AddToCartButtonState = 'idle' | 'loading' | 'success';

const LOADING_MS = 300;
const SUCCESS_MS = 1200;

export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem);
  const showFeedback = useCartFeedbackStore((s) => s.showFeedback);
  const [buttonState, setButtonState] = useState<AddToCartButtonState>('idle');

  const addToCart = useCallback(
    async (product: Product, quantity: number, options?: CartItemOptions) => {
      if (buttonState === 'loading') return null;

      setButtonState('loading');
      await new Promise((resolve) => setTimeout(resolve, LOADING_MS));

      const cartItem = productToCartItem(product, quantity, options);
      const outcome = addItem(cartItem);

      setButtonState('success');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      showFeedback({ outcome });

      setTimeout(() => setButtonState('idle'), SUCCESS_MS);
      return outcome;
    },
    [addItem, buttonState, showFeedback],
  );

  return { addToCart, buttonState };
}
