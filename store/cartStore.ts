import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  description: string;
  image: string;
  unitPrice: number;
  bulkPrice: number;
  bulkThreshold: number;
  quantity: number;
  unit: string;
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
  addItem: (item: CartItem) => void;
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

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          cartBumpVersion: state.cartBumpVersion + 1,
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i,
          ),
        };
      }
      return {
        cartBumpVersion: state.cartBumpVersion + 1,
        items: [...state.items, item],
      };
    }),

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
    const state = get();
    return (
      state.itemsTotal() +
      state.gst() +
      state.deliveryCharge() -
      state.loyaltyDiscount()
    );
  },
}));
