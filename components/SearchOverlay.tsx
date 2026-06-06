import { useEffect, useRef } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchBar, type SearchBarRef } from '@components/SearchBar';
import { RecentSearches } from '@components/search/RecentSearches';
import { SearchEmptyState } from '@components/search/SearchEmptyState';
import { SearchResults } from '@components/search/SearchResults';
import { SearchSuggestions } from '@components/search/SearchSuggestions';
import { SkeletonRows } from '@components/search/SkeletonRows';
import { openVoiceAssistant } from '@components/VoiceAssistantSheet';
import type { UseSearchReturn } from '@hooks/useSearch';

interface SearchOverlayProps extends UseSearchReturn {
  onClose: () => void;
}

export function SearchOverlay({
  query,
  isLoading,
  isLoadingRecent,
  hasSubmitted,
  suggestions,
  sortedResults,
  recentSearches,
  sortOption,
  setQuery,
  submitSearch,
  clearQuery,
  removeRecentSearch,
  clearAllRecent,
  setSortOption,
  onClose,
}: SearchOverlayProps) {
  const searchBarRef = useRef<SearchBarRef>(null);
  const slideY = useSharedValue(40);
  const backdropOpacity = useSharedValue(0);

  const handleVoicePress = () => {
    onClose();
    openVoiceAssistant();
  };

  useEffect(() => {
    slideY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
    backdropOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
    const timer = setTimeout(() => searchBarRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [backdropOpacity, slideY]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value * 0.3,
  }));

  const renderBody = () => {
    if (hasSubmitted && sortedResults.length > 0) {
      return (
        <SearchResults
          query={query}
          results={sortedResults}
          sortOption={sortOption}
          onSortChange={setSortOption}
        />
      );
    }

    if (hasSubmitted && sortedResults.length === 0 && query.trim()) {
      return (
        <SearchEmptyState
          query={query}
          onSuggestionPress={(term) => submitSearch(term)}
        />
      );
    }

    if (query.length > 0 && isLoading) {
      return <SkeletonRows count={4} />;
    }

    if (query.length > 0 && !isLoading && suggestions.length > 0) {
      return (
        <SearchSuggestions
          suggestions={suggestions}
          query={query}
          onSelect={(term) => submitSearch(term)}
        />
      );
    }

    if (query.length === 0) {
      return (
        <RecentSearches
          recentSearches={recentSearches}
          isLoading={isLoadingRecent}
          onSelect={(term) => submitSearch(term)}
          onRemove={removeRecentSearch}
          onClearAll={clearAllRecent}
          onCategorySelect={(term) => submitSearch(term)}
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, panelStyle]}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
              <Pressable onPress={onClose} hitSlop={12} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
              </Pressable>
              <SearchBar
                ref={searchBarRef}
                query={query}
                isActive
                autoFocus
                onChangeText={setQuery}
                onSubmit={() => submitSearch()}
                onClear={clearQuery}
                onVoicePress={handleVoicePress}
              />
            </View>

            <View style={styles.body}>{renderBody()}</View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  panel: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
  },
  backBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
});
