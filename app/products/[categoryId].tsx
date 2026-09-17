import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { CartIcon, NotificationBell } from '@components/HeaderIcons';
import {
  ActiveFilterSummaryBar,
  type RemovableFilterKey,
} from '@components/ActiveFilterSummaryBar';
import {
  FilterBottomSheet,
  type FilterBottomSheetRef,
} from '@components/FilterBottomSheet';
import { FilterBar } from '@components/FilterBar';
import { openVoiceAssistant } from '@components/VoiceAssistantSheet';
import {
  MaterialExpertCTA,
  MaterialExpertSheet,
  type MaterialExpertSheetRef,
} from '@components/MaterialExpertSheet';
import { ProductGridCard } from '@components/product/ProductGridCard';
import {
  CategorySidebar,
  getCategorySidebarWidth,
} from '@components/catalog/CategorySidebar';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { ProductsEmptyState } from '@components/catalog/ProductsEmptyState';
import { ProductGridSkeleton } from '@components/product/ProductGridSkeleton';
import {
  getProductGridCardWidth,
  PRODUCT_GRID_GAP,
  PRODUCT_GRID_PADDING,
  PRODUCT_GRID_PADDING_COMPACT,
} from '@components/product/productGridLayout';
import { ScaledPressable } from '@components/ScaledPressable';
import { useProducts } from '@hooks/useProducts';
import { useFilterState } from '@hooks/useFilterState';
import {
  ALL_RAIL_SELECTION,
  matchesRailSelection,
  useCategoryFacets,
  type CategoryRailSelection,
} from '@hooks/useCategoryFacets';
import { useTranslation } from '@store/languageStore';
import { useEtaStore } from '@store/etaStore';
import type { FilterKey, QuickFilterKey } from '@/types/filter.types';
import type { Product } from '@/types/catalog';
import { normalizeCategoryDisplayName } from '@utils/categoryDisplay';

const PAGE_SIZE = 24;

/**
 * Client-side filters need the full scoped list, but a huge category must not
 * pull its entire catalog on open. Auto-fill a few pages, then hand over to
 * regular infinite scroll.
 */
const MAX_AUTO_PREFETCH_PAGES = 4;

export default function ProductListingScreen() {
  const { t } = useTranslation();
  const { categoryId, categorySlug, categoryName, brand, subcategory } =
    useLocalSearchParams<{
      categoryId: string;
      categorySlug?: string;
      categoryName: string;
      brand?: string;
      subcategory?: string;
    }>();

  const filterSheetRef = useRef<FilterBottomSheetRef>(null);
  const expertSheetRef = useRef<MaterialExpertSheetRef>(null);
  const gridRef = useRef<FlatList<Product>>(null);

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const first = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const slug = first(categorySlug) || first(categoryId) || '';
  const rawTitle = first(categoryName) ?? t('catalogLabel');
  const title = normalizeCategoryDisplayName(rawTitle);

  // Deep links may land directly on a brand / subcategory within the category.
  const [selection, setSelection] = useState<CategoryRailSelection>(() => {
    const initialBrand = first(brand);
    if (initialBrand) return { kind: 'brand', value: initialBrand };
    const initialSub = first(subcategory);
    if (initialSub) return { kind: 'subcategory', value: initialSub };
    return ALL_RAIL_SELECTION;
  });

  // Hub-aware stock + ETA come from the saved delivery location.
  const latitude = useEtaStore((s) => s.latitude);
  const longitude = useEtaStore((s) => s.longitude);
  const pincode = useEtaStore((s) => s.pincode);

  /**
   * Always load the parent category catalog. Sidebar brand/type taps filter
   * this list in-memory so the rail never collapses when a brand is selected,
   * and the screen works against production backends without `/facets`.
   */
  const productQuery = useMemo(
    () => ({
      category: slug || undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      pincode: pincode ?? undefined,
    }),
    [slug, latitude, longitude, pincode],
  );

  const {
    products,
    total,
    isLoading,
    isRefreshing,
    isFetchingNextPage,
    hasNextPage,
    error,
    refresh,
    loadMore,
  } = useProducts(productQuery, {
    enabled: Boolean(slug),
    pageSize: PAGE_SIZE,
  });

  const {
    rail,
    refresh: refreshRail,
  } = useCategoryFacets(slug, products, {
    totalProducts: total,
  });

  const scopedProducts = useMemo(
    () => products.filter((product) => matchesRailSelection(product, selection)),
    [products, selection],
  );

  const {
    config: baseConfig,
    activeFilters,
    draftFilters,
    filteredProducts,
    draftFilteredCount,
    activeCount,
    filtersReady,
    setSearch,
    clearFilter,
    clearAll,
    applyDraft,
    clearDraftAndApply,
    syncDraft,
    setDraft,
    updateFilters,
  } = useFilterState({
    products: scopedProducts,
    categoryId: slug || 'cement',
    isLoadingProducts: isLoading,
  });

  const hasBrandRail = rail.some((item) => item.kind === 'brand');
  const hasTypeRail = rail.some((item) => item.kind === 'productType');
  const showSidebar = rail.length > 1;

  // The rail owns brand / type selection, so drop duplicate filter chips.
  const config = useMemo(() => {
    if (!hasBrandRail && !hasTypeRail) return baseConfig;
    return {
      ...baseConfig,
      visibleChips: baseConfig.visibleChips.filter((key) => {
        if (hasBrandRail && key === 'brand') return false;
        if (hasTypeRail && key === 'productType') return false;
        return true;
      }),
      advancedSections: baseConfig.advancedSections.filter((key) => {
        if (hasBrandRail && key === 'brand') return false;
        if (hasTypeRail && key === 'productType') return false;
        return true;
      }),
    };
  }, [baseConfig, hasBrandRail, hasTypeRail]);

  const sidebarWidth = getCategorySidebarWidth(width);
  const gridPadding = showSidebar
    ? PRODUCT_GRID_PADDING_COMPACT
    : PRODUCT_GRID_PADDING;
  const gridWidth = width - (showSidebar ? sidebarWidth : 0);
  const cardWidth = getProductGridCardWidth(gridWidth, gridPadding);

  const loadedPages = Math.ceil(products.length / PAGE_SIZE);

  useEffect(() => {
    if (
      hasNextPage &&
      !isFetchingNextPage &&
      !isLoading &&
      loadedPages < MAX_AUTO_PREFETCH_PAGES
    ) {
      loadMore();
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, loadMore, loadedPages]);

  const handleSelectRail = useCallback(
    (next: CategoryRailSelection) => {
      if (next.kind === selection.kind && next.value === selection.value) return;
      setSelection(next);
      // Filters were scoped to the previous brand/subcategory catalog.
      clearAll();
      gridRef.current?.scrollToOffset({ offset: 0, animated: false });
    },
    [clearAll, selection.kind, selection.value],
  );

  const openFilterSheet = useCallback(
    (section?: QuickFilterKey | FilterKey) => {
      syncDraft();
      filterSheetRef.current?.open(section);
    },
    [syncDraft],
  );

  const handleRemoveTag = useCallback(
    (key: RemovableFilterKey, value?: string) => {
      if (key === 'search') {
        clearFilter('search');
        return;
      }
      if (key === 'grade' && value) {
        updateFilters({
          ...activeFilters,
          grade: activeFilters.grade.filter((g) => g !== value),
        });
        return;
      }
      if (key === 'productType' && value) {
        updateFilters({
          ...activeFilters,
          productType: (activeFilters.productType ?? []).filter(
            (type) => type !== value,
          ),
        });
        return;
      }
      if (key === 'brand' && value) {
        updateFilters({
          ...activeFilters,
          brand: activeFilters.brand.filter((b) => b !== value),
        });
        return;
      }
      if (key === 'pricePresets' && value) {
        updateFilters({
          ...activeFilters,
          pricePresets: activeFilters.pricePresets.filter((id) => id !== value),
        });
        return;
      }
      if (key === 'priceRange') {
        clearFilter('priceRange');
        return;
      }
      clearFilter(key as keyof typeof activeFilters);
    },
    [activeFilters, clearFilter, updateFilters],
  );

  const handleRetry = useCallback(() => {
    void refresh();
    void refreshRail();
  }, [refresh, refreshRail]);

  const handleRefresh = useCallback(() => {
    void refresh();
    void refreshRail();
  }, [refresh, refreshRail]);

  const showActiveSummary = filtersReady && activeCount > 0;

  /**
   * `total` is the server count for the current scope. Once client-side filters
   * narrow the loaded pages we can only speak for what we have.
   */
  const hasClientFilters = activeCount > 0 || selection.kind !== 'all';
  const displayCount = hasClientFilters ? filteredProducts.length : total;

  const gridHeader = useMemo(
    () => (
      <>
        <FilterBar
          activeFilters={activeFilters}
          config={config}
          onChipPress={openFilterSheet}
          onOpenAll={() => openFilterSheet()}
          onClearChip={clearFilter}
        />

        {!isLoading ? (
          <View style={{ marginHorizontal: gridPadding, marginTop: 12 }}>
            <Text className="text-sm font-semibold text-text-secondary">
              {displayCount} {displayCount === 1 ? 'Product' : 'Products'}
              {hasClientFilters ? ' Found' : ''}
            </Text>
          </View>
        ) : (
          <View style={{ marginHorizontal: gridPadding, marginTop: 12 }}>
            <View
              style={{
                height: 14,
                width: 110,
                borderRadius: 4,
                backgroundColor: '#F0F0F0',
              }}
            />
          </View>
        )}

        {showActiveSummary ? (
          <ActiveFilterSummaryBar
            activeFilters={activeFilters}
            config={config}
            onClearAll={clearAll}
            onRemoveTag={handleRemoveTag}
          />
        ) : null}
      </>
    ),
    [
      activeFilters,
      clearAll,
      clearFilter,
      handleRemoveTag,
      openFilterSheet,
      config,
      displayCount,
      gridPadding,
      hasClientFilters,
      isLoading,
      showActiveSummary,
    ],
  );

  const renderFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View className="py-4">
          <ActivityIndicator color="#FEB623" />
        </View>
      );
    }
    return <MaterialExpertCTA onPress={() => expertSheetRef.current?.open()} />;
  }, [isFetchingNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductGridCard
        product={item}
        categoryId={slug}
        categoryName={title}
        width={cardWidth}
      />
    ),
    [cardWidth, slug, title],
  );

  const showEmptyState = !isLoading && !error && filteredProducts.length === 0;

  const gridContent =
    error && products.length === 0 ? (
      <CatalogErrorState onRetry={handleRetry} />
    ) : isLoading ? (
      <Animated.View
        key="product-grid-skeleton"
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={{ flex: 1 }}>
        {gridHeader}
        <ProductGridSkeleton cardWidth={cardWidth} />
      </Animated.View>
    ) : (
      <Animated.View
        key="product-grid"
        entering={FadeIn.duration(200)}
        style={{ flex: 1 }}>
        <FlatList
          ref={gridRef}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{
            paddingHorizontal: gridPadding,
            gap: PRODUCT_GRID_GAP,
          }}
          contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={gridHeader}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          renderItem={renderItem}
          ListEmptyComponent={
            showEmptyState ? (
              <ProductsEmptyState
                hasActiveFilters={
                  hasClientFilters ||
                  Boolean(activeFilters.search.trim()) ||
                  selection.kind !== 'all'
                }
                onResetFilters={() => handleSelectRail(ALL_RAIL_SELECTION)}
              />
            ) : null
          }
          ListFooterComponent={renderFooter}
          removeClippedSubviews
          maxToRenderPerBatch={8}
          windowSize={7}
          initialNumToRender={6}
          keyboardShouldPersistTaps="handled"
        />
      </Animated.View>
    );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader
        title={title}
        rightElement={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <TouchableOpacity
              onPress={openVoiceAssistant}
              accessibilityRole="button"
              accessibilityLabel="Voice search"
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="mic-outline" size={22} color="#FEB623" />
            </TouchableOpacity>
            <NotificationBell color="#FEB623" size={22} compact />
            <CartIcon color="#FEB623" size={22} compact />
          </View>
        }
      />

      <View className="mx-5 mt-4 flex-row items-center rounded-input border border-border bg-surface px-4 py-3">
        <Ionicons name="search" size={20} color="#FEB623" />
        <TextInput
          value={activeFilters.search}
          onChangeText={setSearch}
          placeholder={t('searchCatalog')}
          placeholderTextColor="#AAAAAA"
          returnKeyType="search"
          accessibilityLabel={t('searchCatalog')}
          style={{
            flex: 1,
            marginLeft: 12,
            fontSize: 14,
            color: '#1A1A1A',
            paddingVertical: 0,
          }}
        />
        {activeFilters.search.length > 0 ? (
          <ScaledPressable
            onPress={() => clearFilter('search')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={10}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </ScaledPressable>
        ) : (
          <ScaledPressable
            onPress={openVoiceAssistant}
            accessibilityRole="button"
            accessibilityLabel="Voice search"
            hitSlop={10}>
            <Ionicons name="mic-outline" size={20} color="#FEB623" />
          </ScaledPressable>
        )}
      </View>

      {/*
        Sidebar and grid are siblings, each with its own scroll container — no
        nesting, so neither can steal or lock the other's gestures.
      */}
      <View style={{ flex: 1, flexDirection: 'row', marginTop: 8 }}>
        {showSidebar ? (
          <CategorySidebar
            items={rail}
            selection={selection}
            onSelect={handleSelectRail}
            width={sidebarWidth}
            isLoading={false}
          />
        ) : null}

        <View style={{ flex: 1 }}>{gridContent}</View>
      </View>

      <FilterBottomSheet
        ref={filterSheetRef}
        draft={draftFilters}
        config={config}
        products={products}
        categoryId={slug || 'cement'}
        resultCount={draftFilteredCount}
        onChange={setDraft}
        onApply={applyDraft}
        onReset={clearDraftAndApply}
        onClearAll={clearDraftAndApply}
      />

      <MaterialExpertSheet
        ref={expertSheetRef}
        categorySlug={slug}
        categoryName={title}
      />
    </SafeAreaView>
  );
}
