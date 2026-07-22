import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { type Href, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@components/AppHeader';
import { DrawerShell } from '@components/DrawerShell';
import { CategoryCard } from '@components/CategoryCard';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { CategoriesGridSkeleton } from '@components/catalog/CatalogSkeletons';
import { ScaledPressable } from '@components/ScaledPressable';
import { useCategories } from '@hooks/useCategories';
import { useTranslation } from '@store/languageStore';
import type { CatalogCategory } from '@/types/catalog';
import type { StringKey } from '@constants/strings';

function categoryDisplayName(
  cat: CatalogCategory,
  t: (key: StringKey) => string,
  language: string,
): string {
  if (language === 'hi' && cat.nameHi) return cat.nameHi;
  if (cat.labelKey) {
    try {
      return t(cat.labelKey);
    } catch {
      return cat.name;
    }
  }
  return cat.name;
}

export default function CatalogScreen() {
  const { t, language } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { categories, isLoading, isRefreshing, error, refresh } = useCategories();

  const rows = useMemo(() => {
    const result: CatalogCategory[][] = [];
    for (let i = 0; i < categories.length; i += 2) {
      result.push(categories.slice(i, i + 2));
    }
    return result;
  }, [categories]);

  const navigateToCategory = (cat: CatalogCategory) => {
    const name = categoryDisplayName(cat, t, language);
    router.push({
      pathname: '/products/[categoryId]',
      params: { categoryId: cat.slug, categoryName: name },
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
      onClose={() => setDrawerOpen(false)}>
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <AppHeader onMenuPress={() => setDrawerOpen(true)} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} />
          }>
          <View className="px-5 pb-2">
            <Text className="text-2xl font-bold text-text">{t('catalogTitle')}</Text>
            <Text className="mt-2 text-sm leading-5 text-text-secondary">
              {t('catalogSubtitle')}
            </Text>
          </View>

          {isLoading ? (
            <View className="mt-4">
              <CategoriesGridSkeleton />
            </View>
          ) : error && categories.length === 0 ? (
            <CatalogErrorState
              message={t('unableToLoadCategories')}
              onRetry={() => void refresh()}
            />
          ) : (
            <View className="mt-4 px-5">
              {rows.map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row gap-3">
                  {row.map((cat) => (
                    <CategoryCard
                      key={cat.id}
                      name={categoryDisplayName(cat, t, language)}
                      image={cat.image}
                      productCountLabel={t('productsCount').replace(
                        '{count}',
                        String(cat.productCount ?? 0),
                      )}
                      onPress={() => navigateToCategory(cat)}
                    />
                  ))}
                  {row.length === 1 && <View className="flex-1" />}
                </View>
              ))}
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
      </SafeAreaView>
    </DrawerShell>
  );
}
