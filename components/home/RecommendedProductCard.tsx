import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { QuantityControls } from '@components/QuantityControls';
import { ProductBulkPrice } from '@components/product/ProductBulkPrice';
import { ProductImage } from '@components/product/ProductImage';
import { ProductPrice } from '@components/product/ProductPrice';
import { ProductRating } from '@components/product/ProductRating';
import { ProductStock } from '@components/product/ProductStock';
import { ProductUnit } from '@components/product/ProductUnit';
import { ScaledPressable } from '@components/ScaledPressable';
import { getProductImageSource } from '@constants/catalogData';
import {
  IMAGE_BADGE_COLORS,
  IMAGE_BADGE_LABELS,
  type RecommendedProduct,
} from '@constants/recommendedData';
import {
  allowsDirectAddToCart,
  getMinOrderQuantity,
  getVariantCount,
  shouldOpenAddToCartSheet,
  shouldOpenVariantSheet,
} from '@constants/catalogVariantHelpers';
import type { StringKey } from '@constants/strings';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useCartStore } from '@store/cartStore';
import { useVariantStore } from '@store/variantStore';
import {
  getDeliveryEta,
  getProductPricing,
  getStockLeft,
} from '@utils/productPricing';

const DARK = '#1A1A1A';
const CARD_RADIUS = 18;
const IMAGE_HEIGHT = 168;

interface RecommendedProductCardProps {
  product: RecommendedProduct;
  width: number;
}

function getReasonLabel(
  reason: RecommendedProduct['meta']['reason'],
  t: (key: StringKey) => string,
): string {
  switch (reason) {
    case 'previously_ordered':
      return t('recommendedPreviouslyOrdered');
    case 'popular_near_you':
      return t('recommendedPopularNearYou');
    case 'frequently_bought':
      return t('recommendedFrequentlyBought');
    default:
      return '';
  }
}

export function RecommendedProductCard({ product, width }: RecommendedProductCardProps) {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const multiVariant = shouldOpenVariantSheet(product);
  const variantCount = getVariantCount(product);
  const canInlineAdjust = allowsDirectAddToCart(product);
  const openSheet = useVariantStore((s) => s.open);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getLineIdForProduct = useCartStore((s) => s.getLineIdForProduct);

  const cartQty = useCartStore((s) => s.getProductQuantity(product.id));
  const minOrder = getMinOrderQuantity(product);
  const step = product.incrementStep ?? 1;

  const displayName =
    language === 'hi' && product.nameHi ? product.nameHi : (product.detailName ?? product.name);

  const pricing = getProductPricing(product);
  const stockLeft = getStockLeft(product);
  const deliveryEta = getDeliveryEta(product);
  const reasonLabel = getReasonLabel(product.meta.reason, t);

  const openDetail = () => {
    router.push({
      pathname: '/products/detail/[productId]',
      params: {
        productId: product.slug || product.id,
        categoryId: product.categorySlug ?? product.categoryType,
        categoryName: product.category,
        productName: displayName,
      },
    } as Href);
  };

  const resolveLineId = useCallback(() => {
    if (variantCount === 1) {
      return getLineIdForProduct(product.id, product.productVariants?.[0]?.id);
    }
    return getLineIdForProduct(product.id);
  }, [getLineIdForProduct, product, variantCount]);

  const handleAdd = useCallback(() => {
    if (shouldOpenAddToCartSheet(product)) {
      openSheet(product);
      return;
    }
    openDetail();
  }, [openSheet, product]);

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
        .items.find((i) => (i.productId ?? i.id) === product.id || i.id.startsWith(`${product.id}_`));
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

  const addLabel = multiVariant ? `${variantCount} Options` : 'ADD';

  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.imageSection}>
        <ScaledPressable onPress={openDetail} style={styles.imagePressable} scaleTo={0.99}>
          <ProductImage
            source={getProductImageSource(product)}
            padding={12}
            borderRadius={14}
            recyclingKey={product.slug || product.id}
          />
        </ScaledPressable>
        <View style={styles.badgeRow} pointerEvents="none">
          {product.meta.imageBadges.map((badge) => {
            const colors = IMAGE_BADGE_COLORS[badge];
            return (
              <View key={badge} style={[styles.badge, { backgroundColor: colors.bg }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  {IMAGE_BADGE_LABELS[badge]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.body}>
        {reasonLabel ? (
          <View style={styles.reasonChip}>
            <Text style={styles.reasonLabel}>{t('recommendedBecause')}</Text>
            <Text style={styles.reasonValue}>• {reasonLabel}</Text>
          </View>
        ) : null}

        <ScaledPressable onPress={openDetail} scaleTo={0.995}>
          <Text style={styles.brand} numberOfLines={1}>
            {product.meta.brand}
          </Text>
          <Text style={styles.name} numberOfLines={2}>
            {displayName}
          </Text>

          <ProductRating
            rating={product.meta.rating}
            reviewCount={product.meta.reviewCount}
            size="sm"
          />

          <Text style={styles.unit}>
            <ProductUnit unit={product.unit} variant="label" />
          </Text>

          <ProductPrice pricing={pricing} size="sm" />

          <ProductStock stockLeft={stockLeft} deliveryEta={deliveryEta} compact />

          <ProductBulkPrice pricing={pricing} variant="box" compact />
        </ScaledPressable>

        <View style={styles.actions}>
          <QuantityControls
            quantity={cartQty}
            onAdd={handleAdd}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            addLabel={addLabel}
            size="md"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EBEBEB',
  },
  imageSection: {
    height: IMAGE_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePressable: {
    flex: 1,
    width: '100%',
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    maxWidth: '70%',
    zIndex: 1,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 4,
  },
  reasonChip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
  },
  reasonValue: {
    fontSize: 10,
    fontWeight: '700',
    color: DARK,
  },
  brand: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: DARK,
    lineHeight: 20,
    marginTop: 2,
  },
  unit: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
  },
  actions: {
    marginTop: 12,
    alignItems: 'stretch',
  },
});
