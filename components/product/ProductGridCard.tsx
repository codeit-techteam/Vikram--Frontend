import { memo, useCallback } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { getProductGridCardWidth } from '@components/product/productGridLayout';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';

import { ProductImage } from '@components/product/ProductImage';
import { QuantityControls } from '@components/QuantityControls';
import { ScaledPressable } from '@components/ScaledPressable';
import {
  allowsDirectAddToCart,
  getMinOrderQuantity,
  getVariantCount,
  productHasStructuredVariants,
  shouldOpenAddToCartSheet,
  shouldOpenVariantSheet,
} from '@constants/catalogVariantHelpers';
import type { Product } from '@/types/catalog';
import { useLanguageStore } from '@store/languageStore';
import { useCartStore } from '@store/cartStore';
import { useVariantStore } from '@store/variantStore';
import { formatINR } from '@utils/formatCurrency';
import {
  getBulkUnlockLabel,
  getDeliveryEta,
  getProductPricing,
  getStockLeft,
} from '@utils/productPricing';
import { isVisibleProductBrand } from '@utils/categoryDisplay';
import { resolveProductImageSource } from '@utils/catalogPlaceholders';

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
  const openSheet = useVariantStore((s) => s.open);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getLineIdForProduct = useCartStore((s) => s.getLineIdForProduct);

  const cartQty = useCartStore((s) => s.getProductQuantity(product.id));
  const hasVariants = productHasStructuredVariants(product);
  const variantCount = getVariantCount(product);
  const multiVariant = shouldOpenVariantSheet(product);
  const canInlineAdjust = allowsDirectAddToCart(product);
  const minOrder = getMinOrderQuantity(product);
  const step = product.incrementStep ?? 1;
  const pricing = getProductPricing(product);
  const stockLeft = getStockLeft(product);
  const bulkLabel = getBulkUnlockLabel(pricing);
  const deliveryEta = getDeliveryEta(product);
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
  const showBrand = isVisibleProductBrand(product.brand);

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
    if (!isVisibleProductBrand(product.brand)) return;
    router.push({
      pathname: '/products/section/[section]',
      params: {
        section: 'brand',
        brand: product.brand,
        title: product.brand,
      },
    } as unknown as Href);
  }, [product.brand]);

  const resolveLineId = useCallback(() => {
    if (hasVariants && variantCount === 1) {
      return getLineIdForProduct(product.id, product.productVariants?.[0]?.id);
    }
    return getLineIdForProduct(product.id);
  }, [getLineIdForProduct, hasVariants, product, variantCount]);

  const handleAdd = useCallback(() => {
    if (shouldOpenAddToCartSheet(product)) {
      openSheet(product);
      return;
    }
    openDetail();
  }, [openDetail, openSheet, product]);

  const handleIncrement = useCallback(() => {
    if (multiVariant || !canInlineAdjust) {
      openSheet(product);
      return;
    }
    const lineId = resolveLineId();
    if (!lineId) {
      openSheet(product);
      return;
    }
    const lineQty =
      useCartStore.getState().items.find((i) => i.id === lineId)?.quantity ?? cartQty;
    const next = lineQty + step;
    const capped =
      typeof product.maxOrder === 'number' ? Math.min(product.maxOrder, next) : next;
    updateQuantity(lineId, capped);
  }, [
    canInlineAdjust,
    cartQty,
    multiVariant,
    openSheet,
    product,
    resolveLineId,
    step,
    updateQuantity,
  ]);

  const handleDecrement = useCallback(() => {
    if (multiVariant) {
      const line = useCartStore
        .getState()
        .items.find((i) => (i.productId ?? i.id) === product.id || i.id.startsWith(`${product.id}_`));
      if (!line) return;
      const next = line.quantity - step;
      updateQuantity(line.id, next < minOrder ? 0 : next);
      return;
    }

    const lineId = resolveLineId();
    if (!lineId) return;

    const lineQty =
      useCartStore.getState().items.find((i) => i.id === lineId)?.quantity ?? cartQty;
    const next = lineQty - step;
    updateQuantity(lineId, next < minOrder ? 0 : next);
  }, [cartQty, minOrder, multiVariant, product.id, resolveLineId, step, updateQuantity]);

  const addLabel = multiVariant ? `${variantCount} Options` : 'ADD';

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <ScaledPressable onPress={openDetail} style={styles.imageWrap} scaleTo={0.98}>
        <ProductImage
          source={imageSource}
          padding={12}
          borderRadius={12}
          backgroundColor="#FFFFFF"
          recyclingKey={product.slug || product.id}
          showShadow
          style={styles.productImage}
        />
        {product.brandLogoUrl ? (
          <ScaledPressable onPress={openBrand} style={styles.brandLogoHit}>
            <Image
              source={{ uri: product.brandLogoUrl }}
              style={styles.brandLogo}
              contentFit="contain"
            />
          </ScaledPressable>
        ) : showBrand ? (
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

        <View style={styles.addWrap} pointerEvents="box-none">
          <QuantityControls
            quantity={cartQty}
            onAdd={handleAdd}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            addLabel={addLabel}
            size="sm"
          />
        </View>
      </ScaledPressable>

      {bulkLabel ? (
        <View style={styles.bulkBadge}>
          <Text style={styles.bulkText} numberOfLines={1}>
            {bulkLabel}
          </Text>
        </View>
      ) : null}

      <ScaledPressable onPress={openDetail} style={styles.body}>
        {showBrand ? (
          <Text style={styles.brandName} numberOfLines={1}>
            {product.brand}
          </Text>
        ) : null}
        <View style={styles.priceRow}>
          {pricing.hasBulk ? (
            <Text style={styles.startsFrom}>Starts from </Text>
          ) : null}
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
        {pricing.hasBulk ? (
          <Text style={styles.bulkHint} numberOfLines={1}>
            Bulk Price ({pricing.bulkThreshold}+) {formatINR(pricing.bulkPrice, false)}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EEEEEE',
  },
  productImage: {
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
  addWrap: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    zIndex: 2,
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
    marginTop: 8,
    paddingHorizontal: 2,
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
  startsFrom: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
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
  bulkHint: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
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
