import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import { MaterialExpertCTA, MaterialExpertSheet } from '@components/MaterialExpertSheet';
import { ProductGridCard } from '@components/product/ProductGridCard';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { ProductsEmptyState } from '@components/catalog/ProductsEmptyState';
import { ProductGridSkeleton } from '@components/product/ProductGridSkeleton';
import {
  PRODUCT_GRID_GAP,
  PRODUCT_GRID_PADDING,
} from '@components/product/productGridLayout';
import { ScaledPressable } from '@components/ScaledPressable';
import { useProducts } from '@hooks/useProducts';
import { useFilterState } from '@hooks/useFilterState';
import { useTranslation } from '@store/languageStore';
import type { FilterKey, QuickFilterKey } from '@/types/filter.types';
import type { Product } from '@/types/catalog';
import { normalizeCategoryDisplayName } from '@utils/categoryDisplay';

export default function ProductListingScreen() {
  const { t } = useTranslation();
  const { categoryId, categorySlug, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categorySlug?: string;
    categoryName: string;
  }>();

  const filterSheetRef = useRef<FilterBottomSheetRef>(null);
  const expertSheetRef = useRef<BottomSheet>(null);

  const slug =
    (Array.isArray(categorySlug) ? categorySlug[0] : categorySlug) ||
    (Array.isArray(categoryId) ? categoryId[0] : categoryId) ||
    '';
  const rawTitle =
    (Array.isArray(categoryName) ? categoryName[0] : categoryName) ??
    t('catalogLabel');
  const title = normalizeCategoryDisplayName(rawTitle);

  // Always load the full category catalog. Filters are client-side only and
  // must not be seeded from persisted / default state on entry.
  const productQuery = useMemo(
    () => ({ category: slug || undefined }),
    [slug],
  );

  const {
    products,
    isLoading,
    isRefreshing,
    isFetchingNextPage,
    hasNextPage,
    error,
    refresh,
    loadMore,
  } = useProducts(productQuery, { enabled: Boolean(slug), pageSize: 50 });

  const {
    config,
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
    products,
    categoryId: slug || 'cement',
    isLoadingProducts: isLoading,
  });

  // Prefetch remaining pages so client-side filters cover the full catalog
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoading) {
      loadMore();
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, loadMore, products.length]);

  const openFilterSheet = (section?: QuickFilterKey | FilterKey) => {
    syncDraft();
    filterSheetRef.current?.open(section);
  };

  const handleRemoveTag = (key: RemovableFilterKey, value?: string) => {
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
        productType: (activeFilters.productType ?? []).filter((t) => t !== value),
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
  };

  const showActiveSummary = filtersReady && activeCount > 0;

  const listHeader = useMemo(
    () => (
      <>
        <View className="mx-5 mt-4 flex-row items-center rounded-input border border-border bg-surface px-4 py-3">
          <Ionicons name="search" size={20} color="#FEB623" />
          <TextInput
            value={activeFilters.search}
            onChangeText={setSearch}
            placeholder={t('searchCatalog')}
            placeholderTextColor="#AAAAAA"
            returnKeyType="search"
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 14,
              color: '#1A1A1A',
              paddingVertical: 0,
            }}
          />
          {activeFilters.search.length > 0 ? (
            <ScaledPressable onPress={() => clearFilter('search')} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </ScaledPressable>
          ) : (
            <ScaledPressable onPress={openVoiceAssistant} hitSlop={10}>
              <Ionicons name="mic-outline" size={20} color="#FEB623" />
            </ScaledPressable>
          )}
        </View>

        <FilterBar
          activeFilters={activeFilters}
          config={config}
          onChipPress={openFilterSheet}
          onOpenAll={() => openFilterSheet()}
          onClearChip={clearFilter}
        />

        {!isLoading ? (
          <View className="mx-5 mt-3">
            <Text className="text-sm font-semibold text-text-secondary">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'Product Found' : 'Products Found'}
            </Text>
          </View>
        ) : (
          <View className="mx-5 mt-3">
            <View
              style={{
                height: 14,
                width: 120,
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
      showActiveSummary,
      clearAll,
      clearFilter,
      config,
      filteredProducts.length,
      isLoading,
      setSearch,
      t,
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
    return <MaterialExpertCTA onPress={() => expertSheetRef.current?.expand()} />;
  }, [isFetchingNextPage]);

  const showEmptyState =
    !isLoading &&
    !error &&
    filteredProducts.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader
        title={title}
        rightElement={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <TouchableOpacity
              onPress={openVoiceAssistant}
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

      {isLoading ? (
        <Animated.View
          key="product-grid-skeleton"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={{ flex: 1 }}>
          {listHeader}
          <ProductGridSkeleton />
        </Animated.View>
      ) : error && products.length === 0 ? (
        <CatalogErrorState onRetry={() => void refresh()} />
      ) : (
        <Animated.View
          key="product-grid"
          entering={FadeIn.duration(200)}
          style={{ flex: 1 }}>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{
              paddingHorizontal: PRODUCT_GRID_PADDING,
              gap: PRODUCT_GRID_GAP,
            }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={listHeader}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            renderItem={({ item }: { item: Product }) => (
              <ProductGridCard product={item} categoryId={slug} categoryName={title} />
            )}
            ListEmptyComponent={
              showEmptyState ? (
                <ProductsEmptyState
                  hasActiveFilters={activeCount > 0 || Boolean(activeFilters.search.trim())}
                  onResetFilters={clearAll}
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
      )}

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
