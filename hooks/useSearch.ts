import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import { useSearchStore } from '@store/searchStore';
import type { SearchProduct } from '@constants/searchData';
import {
  sortSearchResults,
  type SearchSortOption,
  type Suggestion,
} from '@utils/searchUtils';
import {
  fetchSearchSuggestions,
  searchCatalog,
} from '@services/searchService';

export type { Suggestion, SearchSortOption };

export interface UseSearchReturn {
  query: string;
  isActive: boolean;
  isLoading: boolean;
  isLoadingRecent: boolean;
  hasSubmitted: boolean;
  suggestions: Suggestion[];
  results: SearchProduct[];
  sortedResults: SearchProduct[];
  recentSearches: string[];
  sortOption: SearchSortOption;
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
  startVoiceSearch: () => void;
  cancelVoiceSearch: () => void;
}

const VOICE_FALLBACK_TERMS = ['UltraTech cement', 'TMT bars 12mm', 'River sand', 'Stone aggregate'];

const SORT_API_MAP: Record<SearchSortOption, string> = {
  relevance: 'relevance',
  price_asc: 'price_asc',
  price_desc: 'price_desc',
  newest: 'newest',
};

export function useSearch(): UseSearchReturn {
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [sortOption, setSortOption] = useState<SearchSortOption>('relevance');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  const recentSearches = useSearchStore((s) => s.recentSearches);
  const addRecentSearch = useSearchStore((s) => s.addRecentSearch);
  const removeRecentSearch = useSearchStore((s) => s.removeRecentSearch);
  const clearAllRecent = useSearchStore((s) => s.clearRecentSearches);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionAbortRef = useRef(0);
  const voiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceHandlersRef = useRef<{
    onResult: (text: string) => void;
    onError: (msg: string) => void;
  } | null>(null);

  useEffect(() => {
    if (!isActive) return;
    setIsLoadingRecent(true);
    const timer = setTimeout(() => setIsLoadingRecent(false), 150);
    return () => clearTimeout(timer);
  }, [isActive]);

  const cancelVoiceSearchInternal = useCallback(() => {
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    setIsVoiceActive(false);
  }, []);

  const runSuggestions = useCallback(async (text: string) => {
    const requestId = ++suggestionAbortRef.current;
    setIsLoading(true);

    try {
      const { suggestions: next } = await fetchSearchSuggestions(text);
      if (requestId !== suggestionAbortRef.current) return;
      setSuggestions(next);
    } catch {
      if (requestId !== suggestionAbortRef.current) return;
      setSuggestions([]);
    } finally {
      if (requestId === suggestionAbortRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const submitSearch = useCallback(
    async (term?: string) => {
      const searchTerm = (term ?? query).trim();
      if (!searchTerm) return;

      suggestionAbortRef.current += 1;
      setQueryState(searchTerm);
      setDebouncedQuery(searchTerm);
      setHasSubmitted(true);
      setSuggestions([]);
      setIsLoading(true);

      try {
        const page = await searchCatalog({
          q: searchTerm,
          sort: SORT_API_MAP[sortOption],
          limit: 40,
        });
        setResults(page.products);
        addRecentSearch(searchTerm);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
        Keyboard.dismiss();
      }
    },
    [query, addRecentSearch, sortOption],
  );

  const setQuery = useCallback(
    (text: string) => {
      setQueryState(text);
      setHasSubmitted(false);
      setResults([]);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!text.trim()) {
        suggestionAbortRef.current += 1;
        setSuggestions([]);
        setIsLoading(false);
        setDebouncedQuery('');
        return;
      }

      debounceRef.current = setTimeout(() => {
        setDebouncedQuery(text);
        void runSuggestions(text);
      }, 300);
    },
    [runSuggestions],
  );

  const clearQuery = useCallback(() => {
    suggestionAbortRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQueryState('');
    setDebouncedQuery('');
    setSuggestions([]);
    setResults([]);
    setHasSubmitted(false);
    setIsLoading(false);
  }, []);

  const activateSearch = useCallback(() => {
    setIsActive(true);
  }, []);

  const deactivateSearch = useCallback(() => {
    suggestionAbortRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    cancelVoiceSearchInternal();
    setIsActive(false);
    setQueryState('');
    setDebouncedQuery('');
    setSuggestions([]);
    setResults([]);
    setHasSubmitted(false);
    setIsLoading(false);
    setSortOption('relevance');
    setVoiceError(null);
    Keyboard.dismiss();
  }, [cancelVoiceSearchInternal]);

  const cancelVoiceSearch = useCallback(() => {
    setVoiceError(null);
    cancelVoiceSearchInternal();
  }, [cancelVoiceSearchInternal]);

  const startVoiceSearch = useCallback(() => {
    setVoiceError(null);
    setIsActive(true);
    setIsVoiceActive(true);

    const handleResult = (text: string) => {
      cancelVoiceSearchInternal();
      void submitSearch(text);
    };

    voiceHandlersRef.current = {
      onResult: handleResult,
      onError: (msg: string) => {
        cancelVoiceSearchInternal();
        setVoiceError(msg);
      },
    };

    voiceTimeoutRef.current = setTimeout(() => {
      const term =
        VOICE_FALLBACK_TERMS[Math.floor(Math.random() * VOICE_FALLBACK_TERMS.length)];
      voiceHandlersRef.current?.onResult(term);
    }, 2200);
  }, [cancelVoiceSearchInternal, submitSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      cancelVoiceSearchInternal();
    };
  }, [cancelVoiceSearchInternal]);

  const sortedResults = useMemo(
    () => sortSearchResults(results, sortOption),
    [results, sortOption],
  );

  return {
    query,
    isActive,
    isLoading: isLoading && (debouncedQuery.length > 0 || hasSubmitted),
    isLoadingRecent,
    hasSubmitted,
    suggestions,
    results,
    sortedResults,
    recentSearches,
    sortOption,
    isVoiceActive,
    voiceError,
    setQuery,
    submitSearch: (term?: string) => {
      void submitSearch(term);
    },
    clearQuery,
    activateSearch,
    deactivateSearch,
    removeRecentSearch,
    clearAllRecent,
    setSortOption,
    startVoiceSearch,
    cancelVoiceSearch,
  };
}
