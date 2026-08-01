import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { type Href, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppHeader } from '@components/AppHeader';
import { DrawerShell } from '@components/DrawerShell';
import { MaterialCategoriesGrid } from '@components/home/MaterialCategoriesGrid';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { HomeCategoriesSkeleton } from '@components/catalog/CatalogSkeletons';
import { ScaledPressable } from '@components/ScaledPressable';
import { useCategories } from '@hooks/useCategories';
import { useTranslation } from '@store/languageStore';
import type { CatalogCategory } from '@/types/catalog';
import {
  filterMarketplaceCategories,
  getCategoryDisplayName,
} from '@utils/categoryDisplay';

export default function CatalogScreen() {
  const { t, language } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { categories, isLoading, isRefreshing, error, refresh } = useCategories();

  const marketplaceCategories = useMemo(
    () => filterMarketplaceCategories(categories),
    [categories],
  );

  const navigateToCategory = (cat: CatalogCategory) => {
    const name = getCategoryDisplayName(cat, language, t);
    router.push({
      pathname: '/products/[categoryId]',
      params: {
        categoryId: cat.id,
        categorySlug: cat.slug,
        categoryName: name,
      },
    } as Href);
  };

  const handleBulkEnquiry = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/bulk-procurement/enquiry' as Href);
  };

  return (
    <DrawerShell
      isOpen={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}
      header={
        <AppHeader
          onMenuPress={() => setDrawerOpen((open) => !open)}
          isDrawerOpen={drawerOpen}
        />
      }>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-background"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} />
        }>
          <View className="px-5 pb-2 pt-3">
            <Text className="text-2xl font-bold text-text">{t('catalogTitle')}</Text>
            <Text className="mt-2 text-sm leading-5 text-text-secondary">
              {t('catalogSubtitle')}
            </Text>
          </View>

          {isLoading ? (
            <View className="mt-4">
              <HomeCategoriesSkeleton rows={4} />
            </View>
          ) : error && marketplaceCategories.length === 0 ? (
            <CatalogErrorState
              message={t('unableToLoadCategories')}
              onRetry={() => void refresh()}
            />
          ) : marketplaceCategories.length === 0 ? (
            <CatalogErrorState
              message={t('unableToLoadCategories')}
              onRetry={() => void refresh()}
            />
          ) : (
            <View className="mt-4">
              <MaterialCategoriesGrid
                categories={marketplaceCategories}
                language={language}
                onCategoryPress={navigateToCategory}
              />
            </View>
          )}

          <View className="mx-5 mt-6 rounded-card bg-primary p-5">
            <Text className="text-lg font-bold text-onPrimary">{t('bulkProcurementTitle')}</Text>
            <Text className="mt-2 text-sm leading-5 text-onPrimary/90">
              {t('bulkProcurementSubtitle')}
            </Text>
            <ScaledPressable
              onPress={handleBulkEnquiry}
              className="mt-4 self-center rounded-pill border-2 border-surface bg-surface px-8 py-2.5">
              <Text className="text-sm font-bold text-primary">{t('inquireNow')}</Text>
            </ScaledPressable>
          </View>

          <View className="mx-5 mt-5 mb-8 items-center rounded-card bg-trust p-6">
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-surface">
              <Ionicons name="bus-outline" size={24} color="#FEB623" />
            </View>
            <Text className="text-base font-bold text-text">{t('priorityExpress')}</Text>
            <Text className="mt-2 text-center text-sm text-text-secondary">
              {t('priorityExpressSubtitle')}
            </Text>
          </View>
        </ScrollView>
    </DrawerShell>
  );
}
