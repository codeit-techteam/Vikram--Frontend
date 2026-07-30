import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CatalogCategory } from '@/types/catalog';

interface CategoryStoreState {
  categories: CatalogCategory[];
  fetchedAt: number | null;
  setCategories: (categories: CatalogCategory[]) => void;
  getBySlugOrId: (idOrSlug: string) => CatalogCategory | undefined;
  clear: () => void;
}

export const useCategoryStore = create<CategoryStoreState>()(
  persist(
    (set, get) => ({
      categories: [],
      fetchedAt: null,

      setCategories: (categories) =>
        set({ categories, fetchedAt: Date.now() }),

      getBySlugOrId: (idOrSlug) =>
        get().categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug),

      clear: () => set({ categories: [], fetchedAt: null }),
    }),
    {
      name: 'bajriwala-categories',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
