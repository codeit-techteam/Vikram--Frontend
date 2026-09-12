import { useCallback, useState } from 'react';
import * as Haptics from 'expo-haptics';

import { useCartFeedbackStore } from '@store/cartFeedbackStore';
import { useCartStore } from '@store/cartStore';
import { useEtaStore } from '@store/etaStore';
import type { Product } from '@/types/catalog';
import { productToCartItem, sanitizeEtaMinutes, type CartItemOptions } from '@utils/cartHelpers';

export type AddToCartButtonState = 'idle' | 'loading' | 'success';

const LOADING_MS = 180;

/**
 * Optimistic local cart update + best-effort server sync.
 * Auth is required at checkout, not when adding items (guest browsing OK).
 * Listing screens open VariantBottomSheet first so quantity is always chosen.
 */
export function useAddToCart() {
  const upsertItem = useCartStore((s) => s.upsertItem);
  const showFeedback = useCartFeedbackStore((s) => s.showFeedback);
  const eta = useEtaStore((s) => s.eta);
  const [buttonState, setButtonState] = useState<AddToCartButtonState>('idle');

  const addToCart = useCallback(
    async (product: Product, quantity: number, options?: CartItemOptions) => {
      if (buttonState === 'loading') return null;

      const minOrder =
        typeof product.minOrder === 'number' && product.minOrder >= 1
          ? Math.floor(product.minOrder)
          : 1;
      const clampedQty = Math.max(minOrder, Math.max(1, Math.floor(quantity) || 1));

      setButtonState('loading');
      await new Promise((resolve) => setTimeout(resolve, LOADING_MS));

      try {
        const cartItem = productToCartItem(product, clampedQty, {
          ...options,
          etaMinutes: sanitizeEtaMinutes(options?.etaMinutes ?? eta?.deliveryETA),
        });
        const outcome = upsertItem(cartItem);

        setButtonState('success');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showFeedback({ outcome });

        setTimeout(() => setButtonState('idle'), 600);
        return outcome;
      } catch (error) {
        if (__DEV__) {
          console.warn('[cart] addToCart failed', error);
        }
        setButtonState('idle');
        return null;
      }
    },
    [upsertItem, buttonState, showFeedback, eta],
  );

  return { addToCart, buttonState };
}
