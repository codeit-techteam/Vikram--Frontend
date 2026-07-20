import { useRef } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { CartIcon, NotificationBell } from '@components/HeaderIcons';
import { ActiveFilterSummaryBar } from '@components/ActiveFilterSummaryBar';
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
import { MaterialExpertCTA, MaterialExpertSheet } from '@components/MaterialExpertSheet';
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
  const expertSheetRef = useRef<BottomSheet>(null);

  const category = CATALOG_CATEGORIES.find((c) => c.id === (categoryId ?? 'cement'));
  const products = PRODUCTS_BY_CATEGORY[categoryId ?? 'cement'] ?? [];
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
  } = useFilterState({ products, categoryId: categoryId ?? 'cement' });

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
      <BackHeader
        title={title}
        rightElement={
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.push('/search')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="mic-outline" size={21} color="#FEB623" />
            </TouchableOpacity>
            <NotificationBell color="#FEB623" size={21} />
            <CartIcon color="#FEB623" size={21} />
          </View>
        }
      />

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
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
            <ProductCard product={item} categoryId={categoryId} categoryName={title} />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Text className="text-center text-text-secondary">{t('noProductsFound')}</Text>
            {categoryId === 'hardware' ? (
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: '#999',
                  textAlign: 'center',
                  paddingHorizontal: 24,
                }}>
                {t('comingSoon')}
              </Text>
            ) : null}
          </View>
        }
        ListFooterComponent={
          <MaterialExpertCTA onPress={() => expertSheetRef.current?.expand()} />
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

      <MaterialExpertSheet ref={expertSheetRef} />
    </SafeAreaView>
  );
}
