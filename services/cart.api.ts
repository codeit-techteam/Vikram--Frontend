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

export interface AddToCartApiPayload {
  productId: string;
  quantity?: number;
  variantId?: string;
  hubId?: string;
  etaMinutes?: number;
}

export async function addCartItemApi(payload: AddToCartApiPayload): Promise<unknown> {
  const { data } = await api.post<ApiResponse<unknown>>(CART_BASE, payload);
  return data.data;
}

export async function updateCartItemApi(
  itemId: string,
  quantity: number,
): Promise<unknown> {
  const { data } = await api.patch<ApiResponse<unknown>>(
    `${CART_BASE}/item/${itemId}`,
    { quantity },
  );
  return data.data;
}

export async function removeCartItemApi(itemId: string): Promise<unknown> {
  const { data } = await api.delete<ApiResponse<unknown>>(
    `${CART_BASE}/item/${itemId}`,
  );
  return data.data;
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
    await api.post(`${CART_BASE}`, {
      productId,
      quantity: item.quantity,
      variantId: item.variantId && isUuid(item.variantId) ? item.variantId : undefined,
      hubId: item.hubId && isUuid(item.hubId) ? item.hubId : undefined,
      etaMinutes: item.etaMinutes,
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
