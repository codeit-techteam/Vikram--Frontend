import { useRef } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActiveFilterSummaryBar } from '@components/ActiveFilterSummaryBar';
import { AppHeader } from '@components/AppHeader';
import {
  FilterBottomSheet,
  type FilterBottomSheetRef,
} from '@components/FilterBottomSheet';
import { FilterBar } from '@components/FilterBar';
import {
  QuickFilterSheet,
  type QuickFilterSheetRef,
} from '@components/QuickFilterSheet';
import { openVoiceAssistant } from '@components/VoiceAssistantSheet';
import { ProductCard } from '@components/ProductCard';
import { ScaledPressable } from '@components/ScaledPressable';
import { CATALOG_CATEGORIES, PRODUCTS_BY_CATEGORY } from '@constants/catalogData';
import { useFilterState } from '@hooks/useFilterState';
import { useTranslation } from '@store/languageStore';
import type { FilterKey } from '@/types/filter.types';

export default function ProductListingScreen() {
  const { t } = useTranslation();
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
  }>();

  const fullSheetRef = useRef<FilterBottomSheetRef>(null);
  const quickSheetRef = useRef<QuickFilterSheetRef>(null);

  const category = CATALOG_CATEGORIES.find((c) => c.id === (categoryId ?? '1'));
  const products = PRODUCTS_BY_CATEGORY[categoryId ?? '1'] ?? [];
  const title = category ? t(category.labelKey) : (categoryName ?? t('catalogLabel'));

  const {
    config,
    activeFilters,
    draftFilters,
    filteredProducts,
    draftFilteredCount,
    activeCount,
    clearFilter,
    clearAll,
    applyDraft,
    resetDraft,
    syncDraft,
    setDraft,
    updateFilters,
  } = useFilterState({ products, categoryId: categoryId ?? '1' });

  const openQuickFilterSheet = (key: FilterKey) => {
    syncDraft();
    quickSheetRef.current?.open(key);
  };

  const openFullFilterSheet = () => {
    syncDraft();
    fullSheetRef.current?.open();
  };

  const handleRemoveTag = (key: FilterKey, value?: string) => {
    if (key === 'grade' && value) {
      updateFilters({
        ...activeFilters,
        grade: activeFilters.grade.filter((g) => g !== value),
      });
      return;
    }
    if (key === 'availability' && value) {
      updateFilters({
        ...activeFilters,
        availability: activeFilters.availability.filter((a) => a !== value),
      });
      return;
    }
    clearFilter(key);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader showBack title={title} />

      <View className="mx-5 mt-4 flex-row items-center rounded-input border border-border bg-surface px-4 py-3">
        <Ionicons name="search" size={20} color="#FEB623" />
        <Text className="ml-3 flex-1 text-sm text-text-secondary">{t('searchCatalog')}</Text>
        <ScaledPressable onPress={openVoiceAssistant} hitSlop={10}>
          <Ionicons name="mic-outline" size={20} color="#FEB623" />
        </ScaledPressable>
      </View>

      <FilterBar
        activeFilters={activeFilters}
        config={config}
        onChipPress={openQuickFilterSheet}
        onOpenAll={openFullFilterSheet}
        onClearChip={clearFilter}
      />

      {activeCount > 0 && (
        <ActiveFilterSummaryBar
          activeFilters={activeFilters}
          config={config}
          resultCount={filteredProducts.length}
          onClearAll={clearAll}
          onRemoveTag={handleRemoveTag}
        />
      )}

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
            <ProductCard product={item} categoryId={categoryId} categoryName={title} />
          </Animated.View>
        )}
        ListEmptyComponent={
          <Text className="mt-8 text-center text-text-secondary">{t('noProductsFound')}</Text>
        }
      />

      <FilterBottomSheet
        ref={fullSheetRef}
        draft={draftFilters}
        config={config}
        products={products}
        resultCount={draftFilteredCount}
        onChange={setDraft}
        onApply={applyDraft}
        onReset={resetDraft}
        onClearAll={resetDraft}
      />

      <QuickFilterSheet
        ref={quickSheetRef}
        draft={draftFilters}
        config={config}
        products={products}
        resultCount={draftFilteredCount}
        onChange={setDraft}
        onApply={applyDraft}
        onClearSection={clearFilter}
      />
    </SafeAreaView>
  );
}
