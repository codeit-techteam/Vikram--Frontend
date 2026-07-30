import { memo, useCallback } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { getProductGridCardWidth } from '@components/product/productGridLayout';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';

import { ScaledPressable } from '@components/ScaledPressable';
import {
  allowsDirectAddToCart,
  getVariantCount,
  productHasStructuredVariants,
} from '@constants/catalogVariantHelpers';
import type { Product } from '@/types/catalog';
import { useLanguageStore } from '@store/languageStore';
import { useAddToCart } from '@hooks/useAddToCart';
import { useDeliveryEta } from '@hooks/useDeliveryEta';
import { useVariantStore } from '@store/variantStore';
import { formatINR } from '@utils/formatCurrency';
import {
  getBulkUnlockLabel,
  getDeliveryEta,
  getProductPricing,
  getStockLeft,
} from '@utils/productPricing';
import { resolveProductImageSource } from '@utils/catalogPlaceholders';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';
const GREEN = '#2E7D32';

interface ProductGridCardProps {
  product: Product;
  categoryId?: string;
  categoryName?: string;
}

function ProductGridCardComponent({
  product,
  categoryId,
  categoryName,
}: ProductGridCardProps) {
  const { width } = useWindowDimensions();
  const cardWidth = getProductGridCardWidth(width);
  const language = useLanguageStore((s) => s.language);
  const { addToCart, buttonState } = useAddToCart();
  const openVariantSheet = useVariantStore((s) => s.open);
  const { estimatedMinutes, deliveryMessage: etaLabel } = useDeliveryEta({ autoFetch: false });

  const hasVariants = productHasStructuredVariants(product);
  const variantCount = getVariantCount(product);
  const directAdd = allowsDirectAddToCart(product);
  const pricing = getProductPricing(product);
  const stockLeft = getStockLeft(product);
  const bulkLabel = getBulkUnlockLabel(pricing);
  const deliveryEta = getDeliveryEta(product, estimatedMinutes, etaLabel);
  const rating =
    typeof product.rating === 'number' && product.rating > 0
      ? product.rating
      : null;

  const displayName =
    language === 'hi' && product.nameHi
      ? product.nameHi
      : (product.detailName ?? product.name);

  const variantLabel =
    product.spec ||
    product.unit ||
    (hasVariants && variantCount > 1 ? `${variantCount} variants` : null);

  const imageSource = resolveProductImageSource({
    imageUrl: product.imageUrl,
    productSlug: product.slug,
    categorySlug: product.categorySlug,
  });

  const openDetail = useCallback(() => {
    router.push({
      pathname: '/products/detail/[productId]',
      params: {
        productId: product.slug || product.id,
        categoryId: categoryId ?? product.categorySlug ?? '',
        categoryName: categoryName ?? product.category,
        productName: displayName,
      },
    } as Href);
  }, [categoryId, categoryName, displayName, product]);

  const openBrand = useCallback(() => {
    if (!product.brand) return;
    router.push({
      pathname: '/products/section/[section]',
      params: {
        section: 'brand',
        brand: product.brand,
        title: product.brand,
      },
    } as unknown as Href);
  }, [product.brand]);

  const handleAdd = useCallback(async () => {
    if (!directAdd && hasVariants && variantCount > 1) {
      openVariantSheet(product);
      return;
    }
    if (hasVariants && variantCount === 1) {
      const only = product.productVariants?.[0];
      await addToCart(product, product.defaultQuantity || 1, {
        variantId: only?.id,
      });
      return;
    }
    await addToCart(product, product.defaultQuantity || 1);
  }, [addToCart, directAdd, hasVariants, openVariantSheet, product, variantCount]);

  const addLabel =
    hasVariants && variantCount > 1
      ? `${variantCount} Options`
      : 'ADD';

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <ScaledPressable onPress={openDetail} style={styles.imageWrap}>
        <Image
          source={imageSource}
          style={styles.image}
          contentFit="contain"
          recyclingKey={product.slug || product.id}
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          transition={200}
        />
        {product.brandLogoUrl ? (
          <ScaledPressable onPress={openBrand} style={styles.brandLogoHit}>
            <Image
              source={{ uri: product.brandLogoUrl }}
              style={styles.brandLogo}
              contentFit="contain"
            />
          </ScaledPressable>
        ) : product.brand ? (
          <ScaledPressable onPress={openBrand} style={styles.brandBadge}>
            <Text style={styles.brandText} numberOfLines={1}>
              {product.brand}
            </Text>
          </ScaledPressable>
        ) : null}

        {deliveryEta ? (
          <View style={styles.etaBadge}>
            <Text style={styles.etaText} numberOfLines={1}>
              {deliveryEta}
            </Text>
          </View>
        ) : null}

        <ScaledPressable
          onPress={() => void handleAdd()}
          style={styles.addBtn}
          disabled={buttonState === 'loading'}>
          <Text style={styles.addText}>{addLabel}</Text>
          {hasVariants && variantCount > 1 ? (
            <Text style={styles.optionsHint}>{variantCount} options</Text>
          ) : null}
        </ScaledPressable>
      </ScaledPressable>

      {bulkLabel ? (
        <View style={styles.bulkBadge}>
          <Text style={styles.bulkText} numberOfLines={1}>
            {bulkLabel}
          </Text>
        </View>
      ) : null}

      <ScaledPressable onPress={openDetail} style={styles.body}>
        {product.brand ? (
          <Text style={styles.brandName} numberOfLines={1}>
            {product.brand}
          </Text>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatINR(pricing.sellingPrice, false)}</Text>
          <Text style={styles.unit}>/{pricing.unit}</Text>
          {pricing.originalPrice > pricing.sellingPrice ? (
            <Text style={styles.mrp}>{formatINR(pricing.originalPrice, false)}</Text>
          ) : null}
        </View>
        {pricing.discountPercent > 0 ? (
          <Text style={styles.off}>{pricing.discountPercent}% OFF</Text>
        ) : null}
        <Text style={styles.name} numberOfLines={2}>
          {displayName}
        </Text>
        {variantLabel ? (
          <Text style={styles.variant} numberOfLines={1}>
            {variantLabel}
          </Text>
        ) : null}
        {rating != null ? (
          <Text style={styles.rating}>★ {rating.toFixed(1)}</Text>
        ) : null}
        {stockLeft != null && stockLeft > 0 && stockLeft <= 10 ? (
          <Text style={styles.stock}>{stockLeft} left</Text>
        ) : null}
      </ScaledPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  brandLogoHit: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
  },
  brandLogo: {
    width: 36,
    height: 24,
  },
  brandBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    maxWidth: '55%',
  },
  brandText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#555',
  },
  etaBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(26,26,26,0.78)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    maxWidth: '48%',
    zIndex: 1,
  },
  etaText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  addBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 52,
    alignItems: 'center',
    zIndex: 2,
  },
  addText: {
    fontSize: 12,
    fontWeight: '800',
    color: GREEN,
  },
  optionsHint: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8B6914',
    marginTop: 1,
  },
  bulkBadge: {
    marginTop: 6,
    backgroundColor: GREEN,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bulkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  body: {
    marginTop: 6,
  },
  brandName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 3,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
  },
  unit: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  mrp: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 2,
  },
  off: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: GREEN,
  },
  name: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
    lineHeight: 17,
  },
  variant: {
    marginTop: 2,
    fontSize: 11,
    color: '#777',
    fontWeight: '500',
  },
  rating: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '600',
    color: '#C9A227',
  },
  stock: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#1A73E8',
  },
});

export const ProductGridCard = memo(ProductGridCardComponent);
