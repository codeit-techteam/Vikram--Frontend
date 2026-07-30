import { useCallback, useState } from 'react';
import * as Haptics from 'expo-haptics';

import { addCartItemApi } from '@services/cart.api';
import { useCartFeedbackStore } from '@store/cartFeedbackStore';
import { useCartStore } from '@store/cartStore';
import { useEtaStore } from '@store/etaStore';
import type { Product } from '@/types/catalog';
import { productToCartItem, type CartItemOptions } from '@utils/cartHelpers';
import { requireAuthOr } from '@utils/requireAuth';

export type AddToCartButtonState = 'idle' | 'loading' | 'success';

const LOADING_MS = 180;

/**
 * Optimistic local cart update + best-effort server sync.
 * Opens variant sheet is handled by callers when variants.length > 1.
 */
export function useAddToCart() {
  const upsertItem = useCartStore((s) => s.upsertItem);
  const showFeedback = useCartFeedbackStore((s) => s.showFeedback);
  const eta = useEtaStore((s) => s.eta);
  const [buttonState, setButtonState] = useState<AddToCartButtonState>('idle');

  const addToCart = useCallback(
    async (product: Product, quantity: number, options?: CartItemOptions) => {
      if (buttonState === 'loading') return null;

      const runAdd = async () => {
        setButtonState('loading');
        await new Promise((resolve) => setTimeout(resolve, LOADING_MS));

        const cartItem = productToCartItem(product, quantity, {
          ...options,
          etaMinutes: options?.etaMinutes ?? eta?.deliveryETA,
        });
        const outcome = upsertItem(cartItem);

        void addCartItemApi({
          productId: product.id,
          quantity,
          variantId: options?.variantId ?? cartItem.variantId,
          etaMinutes: cartItem.etaMinutes,
        }).catch(() => {
          /* local cart remains source of truth until checkout sync */
        });

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
    [upsertItem, buttonState, showFeedback, eta],
  );

  return { addToCart, buttonState };
}
