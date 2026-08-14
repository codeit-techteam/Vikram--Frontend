import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchBar, type SearchBarRef } from '@components/SearchBar';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { RecentSearches } from '@components/search/RecentSearches';
import { SearchEmptyState } from '@components/search/SearchEmptyState';
import { SearchProductCard } from '@components/search/SearchProductCard';
import { SearchProductSkeletonList } from '@components/search/SearchProductSkeleton';
import { SearchSuggestions } from '@components/search/SearchSuggestions';
import { VoiceSearchUI } from '@components/search/VoiceSearchUI';
import { useCategories } from '@hooks/useCategories';
import type { UseSearchReturn } from '@hooks/useSearch';
import type { Product } from '@/types/catalog';
import { useTranslation } from '@store/languageStore';
import {
  filterMarketplaceCategories,
  getCategoryDisplayName,
} from '@utils/categoryDisplay';
import {
  getCategoryIcon,
  sortCategoriesForSearch,
  type SearchSortOption,
} from '@utils/searchUtils';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';

const SORT_OPTIONS: { id: SearchSortOption; label: string }[] = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price_asc', label: 'Price: Low → High' },
  { id: 'price_desc', label: 'Price: High → Low' },
  { id: 'popular', label: 'Popular' },
  { id: 'fastest', label: 'Fastest Delivery' },
];

interface SearchExperienceProps extends UseSearchReturn {
  onClose: () => void;
}

export function SearchExperience({
  query,
  isLoading,
  isFetchingNextPage,
  isLoadingRecent,
  suggestions,
  products,
  total,
  error,
  isOffline,
  recentSearches,
  sortOption,
  filters,
  isVoiceActive,
  voiceError,
  setQuery,
  submitSearch,
  clearQuery,
  removeRecentSearch,
  clearAllRecent,
  setSortOption,
  setFilters,
  clearFilters,
  loadMore,
  retry,
  startVoiceSearch,
  cancelVoiceSearch,
  onClose,
}: SearchExperienceProps) {
  const { t, language } = useTranslation();
  const searchBarRef = useRef<SearchBarRef>(null);
  const keyboardOpen = useRef(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const { categories } = useCategories();

  const popularCategories = useMemo(() => {
    const marketplace = sortCategoriesForSearch(filterMarketplaceCategories(categories));
    if (marketplace.length === 0) {
      return [
        { id: 'cement', label: 'Cement', icon: '🧱' },
        { id: 'rmc', label: 'RMC', icon: '🚛' },
        { id: 'aggregates', label: 'Aggregates', icon: '🪨' },
        { id: 'bricks', label: 'Bricks', icon: '🧱' },
        { id: 'sand', label: 'Sand', icon: '🏖' },
        { id: 'waterproofing', label: 'Waterproofing', icon: '💧' },
      ];
    }
    return marketplace.slice(0, 10).map((cat) => ({
      id: cat.slug,
      label: getCategoryDisplayName(cat, language, t),
      icon: getCategoryIcon(cat.slug),
    }));
  }, [categories, language, t]);

  useEffect(() => {
    const timer = setTimeout(() => searchBarRef.current?.focus(), 80);
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        keyboardOpen.current = true;
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardOpen.current = false;
      },
    );
    return () => {
      clearTimeout(timer);
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sortOpen) {
        setSortOpen(false);
        return true;
      }
      if (filterOpen) {
        setFilterOpen(false);
        return true;
      }
      if (isVoiceActive) {
        cancelVoiceSearch();
        return true;
      }
      if (keyboardOpen.current) {
        Keyboard.dismiss();
        return true;
      }
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [cancelVoiceSearch, filterOpen, isVoiceActive, onClose, sortOpen]);

  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const showResults = hasQuery && !isLoading && products.length > 0;
  const showEmptyResults = hasQuery && !isLoading && products.length === 0 && !error;
  const showSuggestions =
    hasQuery && suggestions.length > 0 && (!showResults || isLoading);
  const visibleCount = filters.inStock ? products.length : total;
  const filterCount = (filters.category ? 1 : 0) + (filters.inStock ? 1 : 0);
  const sortLabel =
    SORT_OPTIONS.find((option) => option.id === sortOption)?.label ?? 'Relevance';

  const handleCategorySelect = useCallback(
    (label: string) => {
      submitSearch(label);
    },
    [submitSearch],
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.cardWrap}>
        <SearchProductCard product={item} query={trimmed} />
      </View>
    ),
    [trimmed],
  );

  const listHeader = showResults ? (
    <Animated.View entering={FadeIn.duration(180)} style={styles.resultsHeader}>
      <Text style={styles.resultsTitle} accessibilityRole="header">
        Search results for “{trimmed}”
      </Text>
      <Text style={styles.resultsCount}>
        {visibleCount} {visibleCount === 1 ? 'product' : 'products'}
      </Text>
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            setFilterOpen(true);
          }}
          style={[styles.actionChip, filterCount > 0 && styles.actionChipActive]}
          accessibilityRole="button"
          accessibilityLabel="Filters">
          <Ionicons name="options-outline" size={14} color={DARK} />
          <Text style={styles.actionText}>Filters{filterCount > 0 ? ` (${filterCount})` : ''}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            setSortOpen(true);
          }}
          style={styles.actionChip}
          accessibilityRole="button"
          accessibilityLabel={`Sort: ${sortLabel}`}>
          <Ionicons name="swap-vertical" size={14} color={DARK} />
          <Text style={styles.actionText} numberOfLines={1}>
            Sort: {sortLabel}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  ) : null;

  const listFooter =
    isFetchingNextPage ? (
      <View style={styles.footerLoading}>
        <ActivityIndicator color={GOLD} />
      </View>
    ) : null;

  const renderBody = () => {
    if (isVoiceActive || voiceError) {
      return <VoiceSearchUI onCancel={cancelVoiceSearch} error={voiceError} />;
    }

    if (error && products.length === 0) {
      return (
        <CatalogErrorState
          message={
            isOffline ? "You're offline. Check your connection." : "Couldn't load products"
          }
          onRetry={retry}
        />
      );
    }

    if (!hasQuery) {
      return (
        <RecentSearches
          recentSearches={recentSearches}
          isLoading={isLoadingRecent}
          categories={popularCategories}
          onSelect={(term) => submitSearch(term)}
          onRemove={removeRecentSearch}
          onClearAll={clearAllRecent}
          onCategorySelect={(term) => handleCategorySelect(term)}
        />
      );
    }

    if (showEmptyResults) {
      return (
        <SearchEmptyState
          query={trimmed}
          categories={popularCategories}
          onSuggestionPress={(term) => submitSearch(term)}
          onCategorySelect={(term) => handleCategorySelect(term)}
        />
      );
    }

    if (isLoading && products.length === 0) {
      return (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
          {showSuggestions ? (
            <SearchSuggestions
              suggestions={suggestions}
              query={query}
              onSelect={(term) => submitSearch(term)}
            />
          ) : null}
          <SearchProductSkeletonList count={3} />
        </Animated.View>
      );
    }

    if (showSuggestions && !showResults) {
      return (
        <SearchSuggestions
          suggestions={suggestions}
          query={query}
          onSelect={(term) => submitSearch(term)}
        />
      );
    }

    return (
      <FlashList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={DARK} />
          </Pressable>
          <SearchBar
            ref={searchBarRef}
            query={query}
            isActive
            autoFocus
            onChangeText={setQuery}
            onSubmit={() => submitSearch()}
            onClear={clearQuery}
            onVoicePress={startVoiceSearch}
          />
        </View>
        <View style={styles.body}>{renderBody()}</View>
      </KeyboardAvoidingView>

      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSortOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Sort by</Text>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={styles.sheetRow}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSortOption(option.id);
                  setSortOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: sortOption === option.id }}>
                <Text
                  style={[
                    styles.sheetLabel,
                    sortOption === option.id && styles.sheetLabelActive,
                  ]}>
                  {option.label}
                </Text>
                {sortOption === option.id ? (
                  <Ionicons name="checkmark" size={18} color={GOLD} />
                ) : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <Text style={styles.filterSection}>Category</Text>
            <View style={styles.filterChips}>
              {popularCategories.map((cat) => {
                const selected = filters.category === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[styles.filterChip, selected && styles.filterChipActive]}
                    onPress={() =>
                      setFilters({
                        ...filters,
                        category: selected ? null : cat.id,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected }}>
                    <Text style={styles.filterChipIcon}>{cat.icon}</Text>
                    <Text style={[styles.filterChipLabel, selected && styles.filterChipLabelActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              style={styles.sheetRow}
              onPress={() => setFilters({ ...filters, inStock: !filters.inStock })}
              accessibilityRole="button"
              accessibilityState={{ selected: filters.inStock }}>
              <Text style={styles.sheetLabel}>In stock only</Text>
              {filters.inStock ? <Ionicons name="checkmark" size={18} color={GOLD} /> : null}
            </Pressable>
            <Pressable
              style={styles.clearFilters}
              onPress={() => {
                clearFilters();
                setFilterOpen(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear filters">
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  cardWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 32,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 6,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#777',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  actionChipActive: {
    borderColor: GOLD,
    backgroundColor: '#FFF8E8',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
    maxWidth: 180,
  },
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 8,
  },
  sheetRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  sheetLabel: {
    fontSize: 15,
    color: DARK,
  },
  sheetLabelActive: {
    fontWeight: '700',
    color: GOLD,
  },
  filterSection: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#777',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  filterChipActive: {
    borderColor: GOLD,
    backgroundColor: '#FFF8E8',
  },
  filterChipIcon: {
    fontSize: 13,
  },
  filterChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
  },
  filterChipLabelActive: {
    color: DARK,
  },
  clearFilters: {
    marginTop: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
  },
});
