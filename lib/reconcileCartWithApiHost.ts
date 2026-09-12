import { storage } from '@lib/storage';
import { clearPendingPayment } from '@lib/pendingPayment';
import { clearServerCart } from '@services/cart.api';
import { useCartStore } from '@store/cartStore';
import { API_BASE_URL } from '@services/api';

const API_HOST_KEY = 'api_base_url_v1';

function waitForCartHydration(): Promise<void> {
  const persistApi = useCartStore.persist;
  if (persistApi.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsub = persistApi.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

/**
 * Cart line IDs are backend-specific UUIDs. Switching between DigitalOcean and
 * local Nest leaves stale product IDs → "Product not found" at checkout.
 * Clear the local cart only after persist rehydration, and only when the host changes.
 */
export async function reconcileCartWithApiHost(): Promise<void> {
  try {
    await waitForCartHydration();

    const previous = await storage.getItem(API_HOST_KEY);
    if (previous && previous !== API_BASE_URL) {
      useCartStore.getState().clearCart();
      await clearPendingPayment().catch(() => undefined);
      // Best-effort server wipe — ignore 401 when the previous session was for another host.
      await clearServerCart();
      if (__DEV__) {
        console.log(
          `[cart] Cleared cart after API host change\n  from: ${previous}\n  to:   ${API_BASE_URL}`,
        );
      }
    }
    await storage.setItem(API_HOST_KEY, API_BASE_URL);
  } catch {
    // Best-effort — never block app boot.
  }
}
