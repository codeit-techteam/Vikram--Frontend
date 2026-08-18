import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getVehicleTier } from '@constants/deliveryVehicles';
import { useEtaStore } from '@store/etaStore';
import { useLoyaltyStore } from '@store/loyaltyStore';
import { calculateLoyaltyDiscountPreview, toMoney } from '@utils/loyaltyPricing';

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  productName?: string;
  brand?: string;
  category?: string;
  description: string;
  /** @deprecated Use getCartItemImageSource — kept for legacy persisted carts */
  image: string;
  imageSearch?: string;
  unitPrice: number;
  bulkPrice: number;
  bulkThreshold: number;
  quantity: number;
  unit: string;
  variantId?: string;
  variantLabel?: string;
  hubId?: string;
  etaMinutes?: number;
  /** Effective unit price after bulk rules at add time */
  appliedPrice?: number;
  bulkApplied?: boolean;
  /** Server cart line id when known (used for PATCH qty). */
  serverItemId?: string;
  vehicleType?: string;
  deliveryMode?: string;
  eta?: string;
  weightPerUnitKg?: number;
  estimatedWeightKg?: number;
}

export type CartAddResult = 'added' | 'quantity_updated';

export interface CartAddOutcome {
  result: CartAddResult;
  item: CartItem;
  quantityAdded: number;
  totalQuantity: number;
  lineTotal: number;
}

export function getEffectivePrice(item: CartItem): number {
  const unitPrice = Number(item.unitPrice);
  const bulkPrice = Number(item.bulkPrice);
  const safeUnit = Number.isFinite(unitPrice) ? unitPrice : 0;
  const safeBulk = Number.isFinite(bulkPrice) ? bulkPrice : 0;
  return item.quantity >= item.bulkThreshold && item.bulkThreshold > 0 && safeBulk > 0
    ? safeBulk
    : safeUnit;
}

export function getLineTotal(item: CartItem): number {
  return item.quantity * getEffectivePrice(item);
}

/** Refresh bulk + logistics snapshots when quantity changes. */
function withQuantityDerivedFields(item: CartItem, quantity: number): CartItem {
  const bulkApplied =
    item.bulkThreshold > 0 &&
    quantity >= item.bulkThreshold &&
    item.bulkPrice > 0 &&
    item.bulkPrice < item.unitPrice;
  const appliedPrice = bulkApplied ? item.bulkPrice : item.unitPrice;
  const vehicle = item.vehicleType
    ? getVehicleTier(item.vehicleType)
    : null;
  const weightPerUnitKg = item.weightPerUnitKg;
  return {
    ...item,
    quantity,
    appliedPrice,
    bulkApplied,
    vehicleType: vehicle?.type ?? item.vehicleType,
    deliveryMode: vehicle?.label ?? item.deliveryMode,
    eta: item.eta && !/23\s*mins?/i.test(item.eta) ? item.eta : '',
    estimatedWeightKg:
      weightPerUnitKg != null
        ? Math.round(weightPerUnitKg * quantity * 100) / 100
        : item.estimatedWeightKg,
  };
}

function resolveProductId(item: CartItem): string {
  return item.productId ?? item.id;
}

function sameProductLine(a: CartItem, b: CartItem): boolean {
  const aPid = resolveProductId(a);
  const bPid = resolveProductId(b);
  if (aPid !== bPid) return false;
  return (a.variantId ?? undefined) === (b.variantId ?? undefined);
}

function findExistingLine(items: CartItem[], item: CartItem): CartItem | undefined {
  return (
    items.find((i) => i.id === item.id) ??
    items.find((i) => sameProductLine(i, item))
  );
}

interface CartState {
  items: CartItem[];
  savedForLater: CartItem[];
  pointsApplied: boolean;
  cartBumpVersion: number;
  addItem: (item: CartItem) => CartAddOutcome;
  /** Set absolute quantity (or add if missing). Used by Add / Update Cart. */
  upsertItem: (item: CartItem) => CartAddOutcome;
  removeItem: (id: string) => void;
  remove: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  increment: (id: string, by?: number) => void;
  decrement: (id: string, by?: number) => void;
  saveForLater: (id: string) => void;
  togglePoints: () => void;
  clearCart: () => void;
  clear: () => void;
  totalItems: () => number;
  itemsTotal: () => number;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getQuantity: (id: string) => number;
  getProductQuantity: (productId: string) => number;
  getLineIdForProduct: (productId: string, variantId?: string) => string | undefined;
  gst: () => number;
  deliveryCharge: () => number;
  loyaltyDiscount: () => number;
  grandTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      savedForLater: [],
      pointsApplied: false,
      cartBumpVersion: 0,

      addItem: (item) => {
        const state = get();
        const existing = findExistingLine(state.items, item);

        if (existing) {
          const totalQuantity = existing.quantity + item.quantity;
          const merged = withQuantityDerivedFields(
            { ...existing, ...item, id: existing.id },
            totalQuantity,
          );
          set({
            cartBumpVersion: state.cartBumpVersion + 1,
            items: state.items
              .filter((i) => i.id === existing.id || !sameProductLine(i, existing))
              .map((i) => (i.id === existing.id ? merged : i)),
          });
          return {
            result: 'quantity_updated',
            item: merged,
            quantityAdded: item.quantity,
            totalQuantity,
            lineTotal: getLineTotal(merged),
          };
        }

        set({
          cartBumpVersion: state.cartBumpVersion + 1,
          items: [...state.items, item],
        });
        return {
          result: 'added',
          item,
          quantityAdded: item.quantity,
          totalQuantity: item.quantity,
          lineTotal: getLineTotal(item),
        };
      },

      upsertItem: (item) => {
        const state = get();
        const existing = findExistingLine(state.items, item);
        const qty = Math.max(0, item.quantity);

        if (qty <= 0) {
          if (existing) {
            get().removeItem(existing.id);
          }
          return {
            result: 'quantity_updated',
            item: { ...item, quantity: 0 },
            quantityAdded: 0,
            totalQuantity: 0,
            lineTotal: 0,
          };
        }

        if (existing) {
          const merged = withQuantityDerivedFields(
            { ...existing, ...item, id: existing.id },
            qty,
          );
          set({
            cartBumpVersion: state.cartBumpVersion + 1,
            items: state.items
              .filter((i) => i.id === existing.id || !sameProductLine(i, existing))
              .map((i) => (i.id === existing.id ? merged : i)),
          });
          return {
            result: 'quantity_updated',
            item: merged,
            quantityAdded: qty - existing.quantity,
            totalQuantity: qty,
            lineTotal: getLineTotal(merged),
          };
        }

        const created = withQuantityDerivedFields({ ...item, quantity: qty }, qty);
        set({
          cartBumpVersion: state.cartBumpVersion + 1,
          items: [...state.items, created],
        });
        return {
          result: 'added',
          item: created,
          quantityAdded: qty,
          totalQuantity: qty,
          lineTotal: getLineTotal(created),
        };
      },

      removeItem: (id) =>
        set((state) => ({
          cartBumpVersion: state.cartBumpVersion + 1,
          items: state.items.filter((i) => i.id !== id),
        })),

      remove: (id) => get().removeItem(id),

      updateQuantity: (id, qty) => {
        if (qty <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          cartBumpVersion: state.cartBumpVersion + 1,
          items: state.items.map((i) =>
            i.id === id ? withQuantityDerivedFields(i, qty) : i,
          ),
        }));
      },

      increment: (id, by = 1) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;
        get().updateQuantity(id, item.quantity + by);
      },

      decrement: (id, by = 1) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;
        get().updateQuantity(id, item.quantity - by);
      },

      saveForLater: (id) =>
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (!item) return state;
          const saved = state.savedForLater.find((i) => i.id === id);
          return {
            cartBumpVersion: state.cartBumpVersion + 1,
            items: state.items.filter((i) => i.id !== id),
            savedForLater: saved ? state.savedForLater : [...state.savedForLater, item],
          };
        }),

      togglePoints: () => set((state) => ({ pointsApplied: !state.pointsApplied })),

      clearCart: () =>
        set((state) => ({ items: [], cartBumpVersion: state.cartBumpVersion + 1 })),

      clear: () => get().clearCart(),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      itemsTotal: () => get().items.reduce((sum, i) => sum + getLineTotal(i), 0),

      getTotalItems: () => get().totalItems(),

      getTotalPrice: () => get().itemsTotal(),

      getQuantity: (id) => get().items.find((i) => i.id === id)?.quantity ?? 0,

      getProductQuantity: (productId) =>
        get().items.reduce(
          (sum, i) => (resolveProductId(i) === productId ? sum + i.quantity : sum),
          0,
        ),

      getLineIdForProduct: (productId, variantId) => {
        const items = get().items;
        if (variantId) {
          return items.find(
            (i) => resolveProductId(i) === productId && i.variantId === variantId,
          )?.id;
        }
        return (
          items.find((i) => resolveProductId(i) === productId && !i.variantId)?.id ??
          items.find((i) => resolveProductId(i) === productId)?.id
        );
      },

      gst: () => get().itemsTotal() * 0.18,

      deliveryCharge: () => {
        if (get().items.length === 0) return 0;
        const eta = useEtaStore.getState().eta;
        // Preview only — final amount is always recalculated by backend at checkout/order.
        // Never fall back to a hardcoded business price.
        if (eta?.freeDelivery) return 0;
        if (eta?.deliveryCharge != null) return eta.deliveryCharge;
        return 0;
      },

      loyaltyDiscount: () => {
        if (!get().pointsApplied) return 0;
        const loyalty = useLoyaltyStore.getState();
        const pointValueInr = loyalty.summary?.pointValueInr ?? 0.01;
        const minOrderValue = loyalty.summary?.minRedeemOrderValue ?? 500;
        const maxRedeemPercent = loyalty.summary?.maxOrderRedeemPercent ?? 0.3;
        const orderValueInr = get().itemsTotal() + get().deliveryCharge();
        return calculateLoyaltyDiscountPreview({
          pointsApplied: true,
          availablePoints: loyalty.totalPoints,
          orderValueInr,
          minOrderValue,
          maxRedeemPercent,
          pointValueInr,
        }).discountAmount;
      },

      grandTotal: () => {
        const s = get();
        return toMoney(s.itemsTotal() + s.deliveryCharge() - s.loyaltyDiscount());
      },
    }),
    {
      name: 'bajriwala-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        savedForLater: state.savedForLater,
        pointsApplied: state.pointsApplied,
      }),
    },
  ),
);
