import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type { CartItem } from '@store/cartStore';

const CART_BASE = '/cart';

function isUuid(value?: string): value is string {
  return !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
}

/** Replace server cart with local cart lines so place-order can use backend checkout. */
export async function syncLocalCartToServer(items: CartItem[]): Promise<void> {
  await api.delete(`${CART_BASE}`);

  for (const item of items) {
    const productId = item.productId;
    if (!isUuid(productId)) {
      throw new Error(
        `Cart item "${item.name}" is missing a catalog product id. Please re-add it from the catalog.`,
      );
    }
    // Backend route is POST /cart (not /cart/items)
    await api.post(`${CART_BASE}`, {
      productId,
      quantity: item.quantity,
    });
  }
}

export async function clearServerCart(): Promise<void> {
  try {
    await api.delete(`${CART_BASE}`);
  } catch {
    /* ignore */
  }
}

export async function getServerCart(): Promise<unknown> {
  const { data } = await api.get<ApiResponse<unknown>>(CART_BASE);
  return data.data;
}
