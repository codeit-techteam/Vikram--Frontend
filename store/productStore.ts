import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Product } from '@/types/catalog';

interface ProductStoreState {
  items: Product[];
  byId: Record<string, Product>;
  lastQueryKey: string | null;
  setProducts: (products: Product[], queryKey?: string) => void;
  appendProducts: (products: Product[]) => void;
  upsertProduct: (product: Product) => void;
  getProduct: (idOrSlug: string) => Product | undefined;
  clear: () => void;
}

function indexProducts(products: Product[]): Record<string, Product> {
  const byId: Record<string, Product> = {};
  for (const p of products) {
    byId[p.id] = p;
    if (p.slug) byId[p.slug] = p;
  }
  return byId;
}

export const useProductStore = create<ProductStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      byId: {},
      lastQueryKey: null,

      setProducts: (products, queryKey) =>
        set({
          items: products,
          byId: indexProducts(products),
          lastQueryKey: queryKey ?? null,
        }),

      appendProducts: (products) => {
        const merged = [...get().items];
        const seen = new Set(merged.map((p) => p.id));
        for (const p of products) {
          if (!seen.has(p.id)) {
            merged.push(p);
            seen.add(p.id);
          }
        }
        set({ items: merged, byId: { ...get().byId, ...indexProducts(products) } });
      },

      upsertProduct: (product) => {
        const byId = { ...get().byId };
        byId[product.id] = product;
        if (product.slug) byId[product.slug] = product;
        const items = get().items.some((p) => p.id === product.id)
          ? get().items.map((p) => (p.id === product.id ? product : p))
          : [...get().items, product];
        set({ items, byId });
      },

      getProduct: (idOrSlug) => get().byId[idOrSlug],

      clear: () => set({ items: [], byId: {}, lastQueryKey: null }),
    }),
    {
      name: 'bajriwala-products',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items.slice(0, 80),
        byId: indexProducts(state.items.slice(0, 80)),
        lastQueryKey: state.lastQueryKey,
      }),
    },
  ),
);
