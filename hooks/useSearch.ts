import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useSearchStore } from '@store/searchStore';
import { useEtaStore } from '@store/etaStore';
import { fetchProducts } from '@services/productService';
import { fetchSearchSuggestions } from '@services/searchService';
import { useVoiceSearchInput } from '@hooks/useVoiceSearchInput';
import type { Product } from '@/types/catalog';
import type { ProductQueryParams } from '@/types/api-catalog';
import {
  EMPTY_SEARCH_FILTERS,
  fetchLocalSuggestions,
  isOfflineError,
  mapSortToProductQuery,
  sortSearchProducts,
  type SearchFilters,
  type SearchSortOption,
  type Suggestion,
} from '@utils/searchUtils';

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;
const SEARCH_STALE_TIME = 30_000;

export interface UseSearchReturn {
  query: string;
  isActive: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isLoadingRecent: boolean;
  suggestions: Suggestion[];
  products: Product[];
  total: number;
  error: unknown;
  isOffline: boolean;
  recentSearches: string[];
  sortOption: SearchSortOption;
  filters: SearchFilters;
  isVoiceActive: boolean;
  voiceError: string | null;

  setQuery: (text: string) => void;
  submitSearch: (term?: string) => void;
  clearQuery: () => void;
  activateSearch: () => void;
  deactivateSearch: () => void;
  removeRecentSearch: (term: string) => void;
  clearAllRecent: () => void;
  setSortOption: (option: SearchSortOption) => void;
  setFilters: (next: SearchFilters) => void;
  clearFilters: () => void;
  loadMore: () => void;
  retry: () => void;
  startVoiceSearch: () => void;
  cancelVoiceSearch: () => void;
}

export function useSearch(options?: { alwaysActive?: boolean }): UseSearchReturn {
  const alwaysActive = options?.alwaysActive === true;
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isActive, setIsActive] = useState(alwaysActive);
  const [sortOption, setSortOption] = useState<SearchSortOption>('relevance');
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_SEARCH_FILTERS);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  const recentSearches = useSearchStore((s) => s.recentSearches);
  const addRecentSearch = useSearchStore((s) => s.addRecentSearch);
  const removeRecentSearch = useSearchStore((s) => s.removeRecentSearch);
  const clearAllRecent = useSearchStore((s) => s.clearRecentSearches);

  const latitude = useEtaStore((s) => s.latitude);
  const longitude = useEtaStore((s) => s.longitude);
  const pincode = useEtaStore((s) => s.pincode);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRecordedQuery = useRef('');

  const trimmedDebounced = debouncedQuery.trim();
  const searchEnabled = (alwaysActive || isActive) && trimmedDebounced.length > 0;
  const sortQuery = mapSortToProductQuery(sortOption);

  const productParams = useMemo<Omit<ProductQueryParams, 'page'>>(
    () => ({
      search: trimmedDebounced || undefined,
      category: filters.category || undefined,
      sortBy: sortQuery.sortBy,
      sortOrder: sortQuery.sortOrder,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      pincode: pincode ?? undefined,
    }),
    [
      trimmedDebounced,
      filters.category,
      sortQuery.sortBy,
      sortQuery.sortOrder,
      latitude,
      longitude,
      pincode,
    ],
  );

  const productsQuery = useInfiniteQuery({
    queryKey: ['catalog-search', productParams, PAGE_SIZE],
    queryFn: ({ pageParam, signal }) =>
      fetchProducts(
        {
          ...productParams,
          page: pageParam,
          limit: PAGE_SIZE,
        },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    enabled: searchEnabled,
    staleTime: SEARCH_STALE_TIME,
    refetchOnWindowFocus: false,
  });

  const suggestionsQuery = useQuery({
    queryKey: ['search-suggestions', trimmedDebounced],
    queryFn: ({ signal }) => fetchSearchSuggestions(trimmedDebounced, signal),
    enabled: searchEnabled && trimmedDebounced.length >= 1,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isActive && !alwaysActive) return;
    setIsLoadingRecent(true);
    const timer = setTimeout(() => setIsLoadingRecent(false), 120);
    return () => clearTimeout(timer);
  }, [alwaysActive, isActive]);

  useEffect(() => {
    if (!searchEnabled || !productsQuery.isSuccess || !trimmedDebounced) return;
    if (lastRecordedQuery.current.toLowerCase() === trimmedDebounced.toLowerCase()) return;
    lastRecordedQuery.current = trimmedDebounced;
    addRecentSearch(trimmedDebounced);
  }, [addRecentSearch, productsQuery.isSuccess, searchEnabled, trimmedDebounced]);

  const setQuery = useCallback((text: string) => {
    setQueryState(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = text.trim();
    if (!trimmed) {
      setDebouncedQuery('');
      return;
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, DEBOUNCE_MS);
  }, []);

  const submitSearch = useCallback(
    (term?: string) => {
      const searchTerm = (term ?? query).trim();
      if (!searchTerm) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setQueryState(searchTerm);
      setDebouncedQuery(searchTerm);
      addRecentSearch(searchTerm);
    },
    [addRecentSearch, query],
  );

  const clearQuery = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQueryState('');
    setDebouncedQuery('');
  }, []);

  const activateSearch = useCallback(() => {
    setIsActive(true);
  }, []);

  const deactivateSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!alwaysActive) setIsActive(false);
    setQueryState('');
    setDebouncedQuery('');
    setSortOption('relevance');
    setFilters(EMPTY_SEARCH_FILTERS);
    Keyboard.dismiss();
  }, [alwaysActive]);

  const handleVoiceTranscript = useCallback(
    (text: string) => {
      submitSearch(text);
    },
    [submitSearch],
  );

  const voice = useVoiceSearchInput(handleVoiceTranscript);

  const startVoiceSearch = useCallback(() => {
    setIsActive(true);
    void voice.start();
  }, [voice]);

  const loadMore = useCallback(() => {
    if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
      void productsQuery.fetchNextPage();
    }
  }, [productsQuery]);

  const retry = useCallback(() => {
    void productsQuery.refetch();
    void suggestionsQuery.refetch();
  }, [productsQuery, suggestionsQuery]);

  const rawProducts = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [productsQuery.data?.pages],
  );

  const products = useMemo(() => {
    const filtered = filters.inStock
      ? rawProducts.filter((product) => (product.availableStock ?? product.stockLeft ?? 1) > 0)
      : rawProducts;
    return sortSearchProducts(filtered, sortOption);
  }, [filters.inStock, rawProducts, sortOption]);

  const apiSuggestions = suggestionsQuery.data?.suggestions ?? [];
  const suggestions = useMemo(() => {
    if (apiSuggestions.length > 0) return apiSuggestions.slice(0, 8);
    return fetchLocalSuggestions(trimmedDebounced);
  }, [apiSuggestions, trimmedDebounced]);

  const total = productsQuery.data?.pages[0]?.meta.total ?? products.length;
  const error = productsQuery.error;
  const isOffline = isOfflineError(error);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    query,
    isActive,
    isLoading: searchEnabled && productsQuery.isLoading && products.length === 0,
    isFetchingNextPage: productsQuery.isFetchingNextPage,
    hasNextPage: productsQuery.hasNextPage ?? false,
    isLoadingRecent,
    suggestions,
    products,
    total,
    error,
    isOffline,
    recentSearches,
    sortOption,
    filters,
    isVoiceActive: voice.isListening,
    voiceError: voice.error,
    setQuery,
    submitSearch,
    clearQuery,
    activateSearch,
    deactivateSearch,
    removeRecentSearch,
    clearAllRecent,
    setSortOption,
    setFilters,
    clearFilters: () => setFilters(EMPTY_SEARCH_FILTERS),
    loadMore,
    retry,
    startVoiceSearch,
    cancelVoiceSearch: voice.cancel,
  };
}
