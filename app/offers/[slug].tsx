import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { ProductGridCard } from '@components/product/ProductGridCard';
import { ProductGridCardSkeleton } from '@components/product/ProductGridCardSkeleton';
import {
  PRODUCT_GRID_GAP,
  PRODUCT_GRID_PADDING,
  getProductGridCardWidth,
} from '@components/product/productGridLayout';
import { useOfferCatalogProducts, useOfferDetail } from '@hooks/useOffers';
import type { Product } from '@/types/catalog';
import { resolveCmsImageSource } from '@utils/cmsMedia';
import { formatINR } from '@utils/formatCurrency';

const PRIMARY = '#FEB623';
const DARK = '#1A1A1A';
const GREEN = '#2E7D32';

function formatValidUntil(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

function pairProducts(products: Product[]): Product[][] {
  const rows: Product[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push(products.slice(i, i + 2));
  }
  return rows;
}

export default function OfferDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useOfferDetail(slug);
  const offer = query.data;
  const { width } = useWindowDimensions();
  const cardWidth = getProductGridCardWidth(width);

  const productIds = useMemo(
    () => (offer?.products ?? []).map((product) => product.id),
    [offer?.products],
  );
  const catalog = useOfferCatalogProducts(productIds);

  const image = resolveCmsImageSource(
    offer?.mobileImageUrl || offer?.bannerImage || offer?.imageUrl,
  );
  const validUntil = formatValidUntil(offer?.endDate);
  const savings =
    offer?.discountLabel ||
    (offer?.discountPercent ? `${offer.discountPercent}% OFF` : null) ||
    (offer?.discountValue ? `Save ${formatINR(offer.discountValue)}` : null);
  const gridRows = pairProducts(catalog.products);
  const catalogLoading = catalog.isLoading && catalog.products.length === 0;

  const onRefresh = useCallback(() => {
    void Promise.all([query.refetch(), catalog.refetch()]);
  }, [catalog, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title={offer?.title || 'Offer'} />
      {query.isLoading && !offer ? (
        <View style={styles.centered}>
          <ActivityIndicator color={PRIMARY} />
        </View>
      ) : query.error && !offer ? (
        <CatalogErrorState
          message="Could not load this offer."
          onRetry={() => void query.refetch()}
        />
      ) : offer ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={
                (query.isRefetching && !query.isLoading) ||
                (catalog.isRefetching && !catalog.isLoading)
              }
              onRefresh={onRefresh}
              tintColor={PRIMARY}
            />
          }>
          <View style={styles.banner}>
            {image ? (
              <Image source={image} style={styles.bannerImage} contentFit="cover" />
            ) : (
              <View style={styles.bannerFallback}>
                <Text style={styles.fallbackMark}>Bajriwala</Text>
              </View>
            )}
            {offer.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{offer.badge}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.panel}>
            <Text style={styles.title}>{offer.title}</Text>
            {offer.description ? (
              <Text style={styles.description}>{offer.description}</Text>
            ) : null}
            {validUntil ? (
              <Text style={styles.validity}>Valid until: {validUntil}</Text>
            ) : null}
            {savings ? <Text style={styles.savings}>{savings}</Text> : null}
            {offer.startingFrom ? (
              <Text style={styles.from}>
                From {formatINR(offer.startingFrom)}
              </Text>
            ) : null}
          </View>

          <View style={styles.productsBlock}>
            <Text style={styles.sectionTitle}>Products included</Text>
            {catalogLoading ? (
              <View style={styles.grid}>
                {Array.from({ length: 2 }).map((_, rowIndex) => (
                  <View key={`sk-${rowIndex}`} style={styles.row}>
                    <ProductGridCardSkeleton />
                    <ProductGridCardSkeleton />
                  </View>
                ))}
              </View>
            ) : catalog.products.length === 0 ? (
              <View style={styles.emptyProducts}>
                <Text style={styles.emptyText}>
                  These products are currently unavailable. Check back soon.
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {gridRows.map((pair, rowIndex) => (
                  <View key={`row-${pair[0]?.id ?? rowIndex}`} style={styles.row}>
                    {pair.map((product) => (
                      <ProductGridCard key={product.id} product={product} />
                    ))}
                    {pair.length === 1 ? (
                      <View style={{ width: cardWidth }} />
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 40 },
  banner: {
    height: 200,
    backgroundColor: '#FFF8E8',
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
  },
  fallbackMark: { fontSize: 22, fontWeight: '800', color: DARK },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: DARK },
  panel: { paddingHorizontal: 16, paddingTop: 16, gap: 6 },
  title: { fontSize: 22, fontWeight: '800', color: DARK },
  description: { fontSize: 14, color: '#555', lineHeight: 20 },
  validity: { fontSize: 13, color: '#888', marginTop: 4 },
  savings: { fontSize: 15, fontWeight: '700', color: GREEN },
  from: { fontSize: 20, fontWeight: '800', color: DARK, marginTop: 4 },
  productsBlock: { paddingTop: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 12,
    paddingHorizontal: PRODUCT_GRID_PADDING,
  },
  emptyProducts: {
    marginHorizontal: PRODUCT_GRID_PADDING,
    borderRadius: 14,
    backgroundColor: '#F7F7F7',
    padding: 16,
  },
  emptyText: { fontSize: 13, color: '#666', textAlign: 'center' },
  grid: { gap: PRODUCT_GRID_GAP },
  row: {
    flexDirection: 'row',
    paddingHorizontal: PRODUCT_GRID_PADDING,
    gap: PRODUCT_GRID_GAP,
  },
});
