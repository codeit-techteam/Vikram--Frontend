import { memo, useCallback, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ProductGridCard } from '@components/product/ProductGridCard';
import { ProductGridCardSkeleton } from '@components/product/ProductGridCardSkeleton';
import {
  PRODUCT_GRID_GAP,
  PRODUCT_GRID_PADDING,
  getProductGridCardWidth,
} from '@components/product/productGridLayout';
import type { HomeProductSection as SectionKey } from '@services/productService';
import type { Product } from '@/types/catalog';
import { useTranslation } from '@store/languageStore';

const GOLD = '#FEB623';
const SKELETON_ROWS = 2;

export type HomeProductSectionId = SectionKey;

interface HomeProductSectionProps {
  section: HomeProductSectionId;
  title: string;
  subtitle?: string;
  products: Product[];
  isLoading?: boolean;
  /** Max products shown on home (default 8) */
  maxItems?: number;
}

function HomeProductSectionComponent({
  section,
  title,
  subtitle,
  products,
  isLoading = false,
  maxItems = 8,
}: HomeProductSectionProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = getProductGridCardWidth(width);

  const visible = useMemo(
    () => products.slice(0, maxItems),
    [products, maxItems],
  );

  const rows = useMemo(() => {
    const pairs: Product[][] = [];
    for (let i = 0; i < visible.length; i += 2) {
      pairs.push(visible.slice(i, i + 2));
    }
    return pairs;
  }, [visible]);

  const onViewAll = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push({
      pathname: '/products/section/[section]',
      params: {
        section,
        title,
      },
    } as unknown as Href);
  }, [section, title]);

  if (!isLoading && visible.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Pressable onPress={() => void onViewAll()} hitSlop={10} style={styles.viewAll}>
          <Text style={styles.viewAllText}>{t('viewAll')}</Text>
          <Ionicons name="chevron-forward" size={14} color={GOLD} />
        </Pressable>
      </View>

      {isLoading && visible.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.grid}>
          {Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
            <View key={`sk-row-${rowIndex}`} style={styles.row}>
              <ProductGridCardSkeleton />
              <ProductGridCardSkeleton />
            </View>
          ))}
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(280)} style={styles.grid}>
          {rows.map((pair, rowIndex) => (
            <View key={`row-${pair[0]?.id ?? rowIndex}`} style={styles.row}>
              {pair.map((product) => (
                <ProductGridCard key={product.id} product={product} />
              ))}
              {pair.length === 1 ? (
                <View style={{ width: cardWidth }} />
              ) : null}
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: PRODUCT_GRID_PADDING,
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
    gap: 2,
    paddingTop: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
  },
  grid: {
    gap: PRODUCT_GRID_GAP,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: PRODUCT_GRID_PADDING,
    gap: PRODUCT_GRID_GAP,
  },
});

export const HomeProductSection = memo(HomeProductSectionComponent);
