import { create } from 'zustand';

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
  return item.quantity >= item.bulkThreshold ? item.bulkPrice : item.unitPrice;
}

export function getLineTotal(item: CartItem): number {
  return item.quantity * getEffectivePrice(item);
}

interface CartState {
  items: CartItem[];
  savedForLater: CartItem[];
  pointsApplied: boolean;
  cartBumpVersion: number;
  addItem: (item: CartItem) => CartAddOutcome;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  saveForLater: (id: string) => void;
  togglePoints: () => void;
  clearCart: () => void;
  totalItems: () => number;
  itemsTotal: () => number;
  gst: () => number;
  deliveryCharge: () => number;
  loyaltyDiscount: () => number;
  grandTotal: () => number;
}

const DELIVERY_CHARGE = 1200;
const LOYALTY_DISCOUNT = 500;

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  savedForLater: [],
  pointsApplied: true,
  cartBumpVersion: 0,

  addItem: (item) => {
    const state = get();
    const existing = state.items.find((i) => i.id === item.id);

    if (existing) {
      const totalQuantity = existing.quantity + item.quantity;
      const merged: CartItem = { ...existing, ...item, quantity: totalQuantity };
      set({
        cartBumpVersion: state.cartBumpVersion + 1,
        items: state.items.map((i) => (i.id === item.id ? merged : i)),
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

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),

  updateQuantity: (id, qty) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, qty) } : i,
      ),
    })),

  saveForLater: (id) =>
    set((state) => {
      const item = state.items.find((i) => i.id === id);
      if (!item) return state;
      const saved = state.savedForLater.find((i) => i.id === id);
      return {
        items: state.items.filter((i) => i.id !== id),
        savedForLater: saved ? state.savedForLater : [...state.savedForLater, item],
      };
    }),

  togglePoints: () => set((state) => ({ pointsApplied: !state.pointsApplied })),

  clearCart: () => set({ items: [] }),

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  itemsTotal: () => get().items.reduce((sum, i) => sum + getLineTotal(i), 0),

  gst: () => get().itemsTotal() * 0.18,

  deliveryCharge: () => (get().items.length > 0 ? DELIVERY_CHARGE : 0),

  loyaltyDiscount: () => (get().pointsApplied ? LOYALTY_DISCOUNT : 0),

  grandTotal: () => {
    const s = get();
    return s.itemsTotal() + s.gst() + s.deliveryCharge() - s.loyaltyDiscount();
  },
}));
