import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type { CartItem } from '@store/cartStore';
import { useCartStore } from '@store/cartStore';
import { sanitizeEtaMinutes } from '@utils/cartHelpers';

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

interface ServerCartLine {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
}

interface ServerCart {
  items?: ServerCartLine[];
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

function sameServerLine(
  server: ServerCartLine,
  item: CartItem,
): boolean {
  const productId = item.productId;
  if (!productId || server.productId !== productId) return false;
  const localVariant = item.variantId && isUuid(item.variantId) ? item.variantId : null;
  const serverVariant = server.variantId ?? null;
  return localVariant === serverVariant;
}

/**
 * Upsert each local line onto the server (PATCH absolute qty / POST new / DELETE extras).
 * Never wipe the server cart first — a failed re-add used to empty checkout.
 */
export async function syncLocalCartToServer(items: CartItem[]): Promise<void> {
  if (items.length === 0) {
    await clearServerCart();
    return;
  }

  let serverItems: ServerCartLine[] = [];
  try {
    const serverCart = (await getServerCart()) as ServerCart | null;
    serverItems = Array.isArray(serverCart?.items) ? [...serverCart.items] : [];
  } catch {
    serverItems = [];
  }

  const matchedServerIds = new Set<string>();

  for (const item of items) {
    const productId = item.productId;
    if (!isUuid(productId)) {
      throw new Error(
        `Cart item "${item.name}" is missing a catalog product id. Please re-add it from the catalog.`,
      );
    }

    const variantId = item.variantId && isUuid(item.variantId) ? item.variantId : undefined;
    const existing = serverItems.find((s) => sameServerLine(s, item) && !matchedServerIds.has(s.id));

    if (existing) {
      matchedServerIds.add(existing.id);
      if (existing.quantity !== item.quantity) {
        await updateCartItemApi(existing.id, item.quantity);
      }
      continue;
    }

    await api.post(`${CART_BASE}`, {
      productId,
      quantity: item.quantity,
      variantId,
      hubId: item.hubId && isUuid(item.hubId) ? item.hubId : undefined,
      etaMinutes: sanitizeEtaMinutes(item.etaMinutes),
    });
  }

  for (const serverItem of serverItems) {
    if (!matchedServerIds.has(serverItem.id)) {
      await removeCartItemApi(serverItem.id);
    }
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

let cartSyncStarted = false;
let cartSyncTimer: ReturnType<typeof setTimeout> | null = null;
let cartSyncInFlight = false;
let cartSyncQueued = false;

async function flushCartServerSync() {
  if (cartSyncInFlight) {
    cartSyncQueued = true;
    return;
  }
  cartSyncInFlight = true;
  try {
    const items = useCartStore.getState().items;
    await syncLocalCartToServer(items);
  } catch {
    /* local cart remains source of truth until checkout */
  } finally {
    cartSyncInFlight = false;
    if (cartSyncQueued) {
      cartSyncQueued = false;
      void flushCartServerSync();
    }
  }
}

/** Debounced local → server quantity sync after any cart mutation. */
export function startCartServerSync() {
  if (cartSyncStarted) return;
  cartSyncStarted = true;

  useCartStore.subscribe((state, prev) => {
    if (state.cartBumpVersion === prev.cartBumpVersion) return;
    if (cartSyncTimer) clearTimeout(cartSyncTimer);
    cartSyncTimer = setTimeout(() => {
      cartSyncTimer = null;
      void flushCartServerSync();
    }, 400);
  });
}
