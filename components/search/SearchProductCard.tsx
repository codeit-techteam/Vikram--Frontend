import { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { QuantityControls } from '@components/QuantityControls';
import { ProductImage } from '@components/product/ProductImage';
import { ScaledPressable } from '@components/ScaledPressable';
import { HighlightedText } from '@components/search/HighlightedText';
import {
  allowsDirectAddToCart,
  getMinOrderQuantity,
  getVariantCount,
  shouldOpenVariantSheet,
} from '@constants/catalogVariantHelpers';
import { resolvePlaceholderVehicle } from '@constants/deliveryVehicles';
import type { Product } from '@/types/catalog';
import { useAddToCart } from '@hooks/useAddToCart';
import { useLanguageStore } from '@store/languageStore';
import { useCartStore } from '@store/cartStore';
import { useEtaStore } from '@store/etaStore';
import { useVariantStore } from '@store/variantStore';
import { isVisibleProductBrand } from '@utils/categoryDisplay';
import { resolveProductImageSource } from '@utils/catalogPlaceholders';
import { formatINR } from '@utils/formatCurrency';
import {
  getDeliveryEta,
  getProductPricing,
  getStockLeft,
} from '@utils/productPricing';

const DARK = '#1A1A1A';
const GREEN = '#2E7D32';
const IMAGE_SIZE = 96;
const MISSING_LOCATION = 'Select delivery location';

interface SearchProductCardProps {
  product: Product;
  query: string;
}

function isOutOfStock(product: Product): boolean {
  const stock = getStockLeft(product);
  if (stock === 0) return true;
  if (product.status === 'OUT OF STOCK') return true;
  if (product.isAvailable === false) return true;
  return false;
}

function SearchProductCardComponent({ product, query }: SearchProductCardProps) {
  const language = useLanguageStore((s) => s.language);
  const openSheet = useVariantStore((s) => s.open);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getLineIdForProduct = useCartStore((s) => s.getLineIdForProduct);
  const cartQty = useCartStore((s) => s.getProductQuantity(product.id));
  const { addToCart, buttonState } = useAddToCart();
  const hasLocation =
    useEtaStore((s) => s.latitude) != null && useEtaStore((s) => s.longitude) != null;

  const multiVariant = shouldOpenVariantSheet(product);
  const variantCount = getVariantCount(product);
  const canInlineAdjust = allowsDirectAddToCart(product);
  const minOrder = getMinOrderQuantity(product);
  const step = product.incrementStep ?? 1;
  const outOfStock = isOutOfStock(product);

  const displayName =
    language === 'hi' && product.nameHi
      ? product.nameHi
      : (product.detailName ?? product.name);

  const pricing = getProductPricing(product);
  const stockLeft = getStockLeft(product);
  const deliveryEta = getDeliveryEta(product);
  const etaLabel = deliveryEta || (!hasLocation ? MISSING_LOCATION : '');
  const vehicle = resolvePlaceholderVehicle(product.categorySlug, product.name);
  const showBrand = isVisibleProductBrand(product.brand);
  const grade =
    product.gradeLabel && product.gradeLabel !== '-'
      ? product.gradeLabel
      : product.grade && product.grade !== '-'
        ? product.grade
        : null;
  const materialBits = [
    showBrand ? product.brand : null,
    grade,
    product.productTypeLabel,
  ].filter(Boolean);

  const imageSource = resolveProductImageSource({
    imageUrl: product.imageUrl,
    productSlug: product.slug,
    categorySlug: product.categorySlug,
  });

  const rating =
    typeof product.rating === 'number' && product.rating > 0 ? product.rating : null;

  const openDetail = useCallback(() => {
    router.push({
      pathname: '/products/detail/[productId]',
      params: {
        productId: product.slug || product.id,
        categoryId: product.categorySlug ?? '',
        categoryName: product.category,
        productName: displayName,
      },
    } as Href);
  }, [displayName, product]);

  const resolveLineId = useCallback(() => {
    if (variantCount === 1) {
      return getLineIdForProduct(product.id, product.productVariants?.[0]?.id);
    }
    return getLineIdForProduct(product.id);
  }, [getLineIdForProduct, product, variantCount]);

  const handleAdd = useCallback(() => {
    if (outOfStock) return;
    if (multiVariant) {
      openSheet(product);
      return;
    }
    void addToCart(product, minOrder);
  }, [addToCart, minOrder, multiVariant, openSheet, outOfStock, product]);

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
    const next = cartQty + step;
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
        .items.find(
          (item) =>
            (item.productId ?? item.id) === product.id ||
            item.id.startsWith(`${product.id}_`),
        );
      if (!line) return;
      const next = line.quantity - step;
      updateQuantity(line.id, next < minOrder ? 0 : next);
      return;
    }

    const lineId = resolveLineId();
    if (!lineId) return;
    const next = cartQty - step;
    updateQuantity(lineId, next < minOrder ? 0 : next);
  }, [cartQty, minOrder, multiVariant, product.id, resolveLineId, step, updateQuantity]);

  const addLabel = outOfStock
    ? 'Out of stock'
    : multiVariant
      ? `${variantCount} Options`
      : 'Add';

  return (
    <View style={styles.card}>
      <ScaledPressable
        onPress={openDetail}
        style={styles.imageWrap}
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel={`${displayName} details`}>
        <ProductImage
          source={imageSource}
          size={IMAGE_SIZE}
          padding={10}
          borderRadius={12}
          recyclingKey={product.slug || product.id}
        />
      </ScaledPressable>

      <View style={styles.body}>
        <ScaledPressable onPress={openDetail} accessibilityRole="button">
          {query.trim() ? (
            <HighlightedText text={displayName} query={query} style={styles.name} />
          ) : (
            <Text style={styles.name} numberOfLines={2}>
              {displayName}
            </Text>
          )}
        </ScaledPressable>

        {materialBits.length > 0 ? (
          <Text style={styles.meta} numberOfLines={1}>
            {materialBits.join(' · ')}
          </Text>
        ) : null}

        {rating != null ? (
          <Text style={styles.rating}>★ {rating.toFixed(1)}</Text>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatINR(pricing.sellingPrice, false)}</Text>
          <Text style={styles.unit}>/ {pricing.unit}</Text>
          {pricing.originalPrice > pricing.sellingPrice ? (
            <Text style={styles.mrp}>{formatINR(pricing.originalPrice, false)}</Text>
          ) : null}
          {pricing.discountPercent > 0 ? (
            <Text style={styles.off}>{pricing.discountPercent}% OFF</Text>
          ) : null}
        </View>

        {pricing.hasBulk ? (
          <View style={styles.bulkRow}>
            <Text style={styles.bulkBadge}>BULK PRICE AVAILABLE</Text>
            <Text style={styles.bulkHint} numberOfLines={1}>
              Bulk from {pricing.bulkThreshold}+: {formatINR(pricing.bulkPrice, false)} /{' '}
              {pricing.unit}
            </Text>
          </View>
        ) : null}

        {etaLabel ? (
          <View style={styles.etaRow}>
            <Ionicons name={vehicle.icon} size={13} color={GREEN} />
            <Text style={styles.eta} numberOfLines={1}>
              {etaLabel}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          {outOfStock ? (
            <Text style={styles.oos}>Out of stock</Text>
          ) : stockLeft != null && stockLeft > 0 && stockLeft <= 12 ? (
            <Text style={styles.stock}>Only {stockLeft} left</Text>
          ) : (
            <Text style={styles.inStock}>In stock</Text>
          )}

          <QuantityControls
            quantity={outOfStock ? 0 : cartQty}
            onAdd={handleAdd}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            addLabel={addLabel}
            disabled={outOfStock}
            loading={buttonState === 'loading'}
            size="md"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EEEEEE',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    lineHeight: 20,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#777',
  },
  rating: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: '#C9A227',
  },
  priceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
  },
  mrp: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  off: {
    fontSize: 12,
    fontWeight: '800',
    color: GREEN,
  },
  bulkRow: {
    marginTop: 6,
    gap: 2,
  },
  bulkBadge: {
    alignSelf: 'flex-start',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#FFFFFF',
    backgroundColor: GREEN,
    overflow: 'hidden',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bulkHint: {
    fontSize: 11,
    fontWeight: '700',
    color: GREEN,
  },
  etaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eta: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 44,
  },
  inStock: {
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
  },
  stock: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
  },
  oos: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C62828',
  },
});

export const SearchProductCard = memo(SearchProductCardComponent);
