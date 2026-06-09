import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, PermissionsAndroid, Platform } from 'react-native';

import { useSearchStore } from '@store/searchStore';
import type { SearchProduct } from '@constants/searchData';
import {
  fetchSuggestions,
  searchProducts,
  sortSearchResults,
  type SearchSortOption,
  type Suggestion,
} from '@utils/searchUtils';

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

let VoiceModule: typeof import('@react-native-voice/voice').default | null = null;

async function loadVoiceModule() {
  if (VoiceModule) return VoiceModule;
  try {
    const mod = await import('@react-native-voice/voice');
    VoiceModule = mod.default;
    return VoiceModule;
  } catch {
    return null;
  }
}

async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'Bajriwala needs microphone access for voice search.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

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
    void loadVoiceModule().then((Voice) => {
      if (Voice) {
        void Voice.stop().catch(() => undefined);
        void Voice.destroy().catch(() => undefined);
      }
    });
  }, []);

  const runSuggestions = useCallback((text: string) => {
    const requestId = ++suggestionAbortRef.current;
    setIsLoading(true);

    setTimeout(() => {
      if (requestId !== suggestionAbortRef.current) return;
      const next = fetchSuggestions(text);
      setSuggestions(next);
      setIsLoading(false);
    }, 0);
  }, []);

  const submitSearch = useCallback(
    (term?: string) => {
      const searchTerm = (term ?? query).trim();
      if (!searchTerm) return;

      suggestionAbortRef.current += 1;
      setQueryState(searchTerm);
      setDebouncedQuery(searchTerm);
      setIsLoading(false);
      setHasSubmitted(true);
      setSuggestions([]);

      const found = searchProducts(searchTerm);
      setResults(found);
      addRecentSearch(searchTerm);
      Keyboard.dismiss();
    },
    [query, addRecentSearch],
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
        runSuggestions(text);
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

  const startVoiceSearch = useCallback(async () => {
    setVoiceError(null);
    const permitted = await requestMicPermission();
    if (!permitted) {
      setIsActive(true);
      setVoiceError('Microphone permission needed');
      return;
    }

    setIsActive(true);
    setIsVoiceActive(true);

    const Voice = await loadVoiceModule();

    const handleResult = (text: string) => {
      cancelVoiceSearchInternal();
      submitSearch(text);
    };

    const handleError = (msg: string) => {
      cancelVoiceSearchInternal();
      setVoiceError(msg);
    };

    voiceHandlersRef.current = { onResult: handleResult, onError: handleError };

    if (Voice) {
      Voice.onSpeechResults = (e) => {
        const transcript = e.value?.[0];
        if (transcript) {
          voiceHandlersRef.current?.onResult(transcript);
        }
      };
      Voice.onSpeechError = () => {
        voiceHandlersRef.current?.onError("Didn't catch that. Try again.");
      };

      try {
        await Voice.start(Platform.OS === 'ios' ? 'en-IN' : 'en-US');
        voiceTimeoutRef.current = setTimeout(() => {
          voiceHandlersRef.current?.onError("Didn't catch that. Try again.");
        }, 8000);
        return;
      } catch {
        // fall through to simulated voice
      }
    }

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
    isLoading: isLoading && debouncedQuery.length > 0 && !hasSubmitted,
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
    submitSearch,
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
