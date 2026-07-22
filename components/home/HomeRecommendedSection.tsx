import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';

import { RecommendedProductCard } from '@components/home/RecommendedProductCard';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import {
  IMAGE_BADGE_COLORS,
  IMAGE_BADGE_LABELS,
  type RecommendedProduct,
  type RecommendationReason,
  type ImageBadgeType,
} from '@constants/recommendedData';
import { useHomeCatalog } from '@hooks/useHome';
import { useCarouselDrawerLock } from '@hooks/useCarouselDrawerLock';
import { useTranslation } from '@store/languageStore';
import type { Product } from '@/types/catalog';

const H_PAD = 16;
const CARD_GAP = 14;
const CARD_WIDTH_RATIO = 0.76;
const MAX_CARD_WIDTH = 320;

const FALLBACK_REASONS: RecommendationReason[] = [
  'previously_ordered',
  'popular_near_you',
  'frequently_bought',
];

function toRecommended(product: Product, index: number): RecommendedProduct {
  const badges: ImageBadgeType[] = [];
  if (product.isBestSelling) badges.push('best_seller');
  if (product.isFeatured) badges.push('new_arrival');
  if ((product.stockLeft ?? 99) < 20) badges.push('limited_stock');
  if (product.bulkThreshold > 0 && product.bulkPriceValue > 0) badges.push('bulk_price');
  if (badges.length === 0) badges.push('eta');

  return {
    ...product,
    meta: {
      productId: product.id,
      brand: product.brand ?? product.category,
      rating: product.rating ?? 4.5,
      reviewCount: 0,
      reason: FALLBACK_REASONS[index % FALLBACK_REASONS.length],
      imageBadges: badges.slice(0, 2),
    },
  };
}

interface HomeRecommendedSectionProps {
  onHorizontalInteractionChange?: (isInteracting: boolean) => void;
}

export function HomeRecommendedSection({
  onHorizontalInteractionChange,
}: HomeRecommendedSectionProps) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const scrollLock = useCarouselDrawerLock(onHorizontalInteractionChange);
  const {
    recommendedProducts,
    featuredProducts,
    bestSellingProducts,
    isLoading,
    error,
    refresh,
  } = useHomeCatalog();

  const cardWidth = Math.min(screenWidth * CARD_WIDTH_RATIO, MAX_CARD_WIDTH);
  const snapInterval = cardWidth + CARD_GAP;

  const products = useMemo(() => {
    const source =
      recommendedProducts.length > 0
        ? recommendedProducts
        : featuredProducts.length > 0
          ? featuredProducts
          : bestSellingProducts;
    return source.slice(0, 8).map(toRecommended);
  }, [recommendedProducts, featuredProducts, bestSellingProducts]);

  const onViewAll = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push('/(tabs)/catalog' as Href);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: RecommendedProduct }) => (
      <RecommendedProductCard product={item} width={cardWidth} />
    ),
    [cardWidth],
  );

  const keyExtractor = useCallback((item: RecommendedProduct) => item.id, []);

  const ItemSeparator = useCallback(() => <View style={{ width: CARD_GAP }} />, []);

  if (isLoading && products.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{t('recommendedForYou')}</Text>
            <Text style={styles.subtitle}>{t('recommendedSubtitle')}</Text>
          </View>
        </View>
        <ActivityIndicator color="#FEB623" style={{ marginVertical: 24 }} />
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={styles.section}>
        <CatalogErrorState onRetry={() => void refresh()} />
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{t('recommendedForYou')}</Text>
          <Text style={styles.subtitle}>{t('recommendedSubtitle')}</Text>
        </View>
        <Pressable onPress={() => void onViewAll()} hitSlop={10} style={styles.viewAll}>
          <Text style={styles.viewAllText}>{t('viewAll')}</Text>
          <Ionicons name="arrow-forward" size={12} color="#FEB623" />
        </Pressable>
      </View>

      <FlatList
        data={products}
        horizontal
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={[styles.listContent, { paddingRight: H_PAD }]}
        {...scrollLock}
      />
    </View>
  );
}

export { IMAGE_BADGE_COLORS, IMAGE_BADGE_LABELS };

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    marginBottom: 14,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
    lineHeight: 16,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingTop: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FEB623',
  },
  listContent: {
    paddingLeft: H_PAD,
    paddingBottom: 6,
  },
});
