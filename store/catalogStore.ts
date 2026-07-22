import { create } from 'zustand';

import type { CatalogCategory, Product } from '@/types/catalog';
import type { HomeCatalogData } from '@services/homeService';

interface CatalogState {
  categories: CatalogCategory[];
  categoriesFetchedAt: number | null;
  home: HomeCatalogData | null;
  homeFetchedAt: number | null;
  productCache: Record<string, Product>;

  setCategories: (categories: CatalogCategory[]) => void;
  setHome: (home: HomeCatalogData) => void;
  cacheProduct: (product: Product) => void;
  getCachedProduct: (idOrSlug: string) => Product | undefined;
  clearCatalog: () => void;
}

const CATEGORY_TTL_MS = 1000 * 60 * 10;
const HOME_TTL_MS = 1000 * 60 * 5;

export const useCatalogStore = create<CatalogState>((set, get) => ({
  categories: [],
  categoriesFetchedAt: null,
  home: null,
  homeFetchedAt: null,
  productCache: {},

  setCategories: (categories) =>
    set({ categories, categoriesFetchedAt: Date.now() }),

  setHome: (home) => set({ home, homeFetchedAt: Date.now() }),

  cacheProduct: (product) =>
    set((state) => {
      const next = { ...state.productCache };
      next[product.id] = product;
      if (product.slug) next[product.slug] = product;
      return { productCache: next };
    }),

  getCachedProduct: (idOrSlug) => get().productCache[idOrSlug],

  clearCatalog: () =>
    set({
      categories: [],
      categoriesFetchedAt: null,
      home: null,
      homeFetchedAt: null,
      productCache: {},
    }),
}));

export function areCategoriesFresh(fetchedAt: number | null): boolean {
  if (!fetchedAt) return false;
  return Date.now() - fetchedAt < CATEGORY_TTL_MS;
}

export function isHomeFresh(fetchedAt: number | null): boolean {
  if (!fetchedAt) return false;
  return Date.now() - fetchedAt < HOME_TTL_MS;
}
