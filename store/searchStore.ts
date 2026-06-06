import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SearchProduct } from '@constants/searchData';

interface SearchStore {
  recentSearches: string[];
  recentlyViewed: SearchProduct[];
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
  addRecentlyViewed: (product: SearchProduct) => void;
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      recentSearches: ['UltraTech Cement', 'TMT Steel 12mm', 'River Sand'],
      recentlyViewed: [],

      addRecentSearch: (term) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        set((state) => {
          const filtered = state.recentSearches.filter(
            (s) => s.toLowerCase() !== trimmed.toLowerCase(),
          );
          return { recentSearches: [trimmed, ...filtered].slice(0, 8) };
        });
      },

      removeRecentSearch: (term) =>
        set((state) => ({
          recentSearches: state.recentSearches.filter(
            (s) => s.toLowerCase() !== term.trim().toLowerCase(),
          ),
        })),

      clearRecentSearches: () => set({ recentSearches: [] }),

      addRecentlyViewed: (product) =>
        set((state) => {
          const filtered = state.recentlyViewed.filter((p) => p.id !== product.id);
          return { recentlyViewed: [product, ...filtered].slice(0, 10) };
        }),
    }),
    {
      name: 'buildquick-search',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
