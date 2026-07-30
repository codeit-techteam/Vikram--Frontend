import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { CartIcon, NotificationBell } from '@components/HeaderIcons';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { ProductsEmptyState } from '@components/catalog/ProductsEmptyState';
import { ProductGridCard } from '@components/product/ProductGridCard';
import { ProductGridSkeleton } from '@components/product/ProductGridSkeleton';
import {
  PRODUCT_GRID_GAP,
  PRODUCT_GRID_PADDING,
} from '@components/product/productGridLayout';
import { useProducts } from '@hooks/useProducts';
import { useTranslation } from '@store/languageStore';
import type { ProductQueryParams } from '@/types/api-catalog';
import type { Product } from '@/types/catalog';

type SectionParam = 'featured' | 'popular' | 'offers' | 'new' | 'brand';

function sectionToQuery(
  section: SectionParam,
  brand?: string,
): Omit<ProductQueryParams, 'page'> {
  switch (section) {
    case 'featured':
      return { featured: true };
    case 'popular':
      return { bestSelling: true, sortBy: 'sales', sortOrder: 'desc' };
    case 'offers':
      return { offers: true };
    case 'new':
      return { sortBy: 'createdAt', sortOrder: 'desc' };
    case 'brand':
      return brand ? { brand } : {};
    default:
      return { featured: true };
  }
}

export default function HomeSectionListingScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    section: string;
    title?: string;
    brand?: string;
  }>();

  const section = (params.section ?? 'featured') as SectionParam;
  const brand = params.brand;

  const title = useMemo(() => {
    if (params.title) return params.title;
    switch (section) {
      case 'featured':
        return t('featuredProducts');
      case 'popular':
        return t('popularNearYou');
      case 'offers':
        return t('topDeals');
      case 'new':
        return t('recentlyAdded');
      case 'brand':
        return brand || t('catalogLabel');
      default:
        return t('catalogLabel');
    }
  }, [params.title, section, brand, t]);

  const queryParams = useMemo(
    () => sectionToQuery(section, brand),
    [section, brand],
  );

  const {
    products,
    isLoading,
    isRefreshing,
    isFetchingNextPage,
    error,
    refresh,
    loadMore,
  } = useProducts(queryParams, { enabled: true });

  const renderFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View className="py-4">
          <ActivityIndicator color="#FEB623" />
        </View>
      );
    }
    return null;
  }, [isFetchingNextPage]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader
        title={title}
        rightElement={
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <NotificationBell color="#FEB623" size={21} />
            <CartIcon color="#FEB623" size={21} />
          </View>
        }
      />

      {isLoading ? (
        <Animated.View
          key="section-grid-skeleton"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={{ flex: 1 }}>
          <ProductGridSkeleton />
        </Animated.View>
      ) : error && products.length === 0 ? (
        <CatalogErrorState onRetry={() => void refresh()} />
      ) : (
        <Animated.View
          key="section-grid"
          entering={FadeIn.duration(300)}
          style={{ flex: 1 }}>
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{
              paddingHorizontal: PRODUCT_GRID_PADDING,
              gap: PRODUCT_GRID_GAP,
            }}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void refresh()}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            renderItem={({ item, index }: { item: Product; index: number }) => (
              <Animated.View
                entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}>
                <ProductGridCard product={item} />
              </Animated.View>
            )}
            ListEmptyComponent={<ProductsEmptyState />}
            ListFooterComponent={renderFooter}
            removeClippedSubviews
            maxToRenderPerBatch={8}
            windowSize={7}
            initialNumToRender={6}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
