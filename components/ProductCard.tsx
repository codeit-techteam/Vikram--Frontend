import { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { QuantityControls } from '@components/QuantityControls';
import { ProductBulkPrice } from '@components/product/ProductBulkPrice';
import { ProductImage } from '@components/product/ProductImage';
import { ProductPrice } from '@components/product/ProductPrice';
import { ProductStockInfo } from '@components/product/ProductStockInfo';
import { ScaledPressable } from '@components/ScaledPressable';
import { HighlightedText } from '@components/search/HighlightedText';
import { ProductUnit } from '@components/product/ProductUnit';
import {
  allowsDirectAddToCart,
  getMinOrderQuantity,
  getVariantCount,
  shouldOpenAddToCartSheet,
  shouldOpenVariantSheet,
} from '@constants/catalogVariantHelpers';
import type { Product } from '@/types/catalog';
import { useLanguageStore } from '@store/languageStore';
import { useCartStore } from '@store/cartStore';
import { useVariantStore } from '@store/variantStore';
import {
  getDeliveryEta,
  getOfferLabel,
  getProductPricing,
  getStockLeft,
} from '@utils/productPricing';
import { resolveProductImageSource } from '@utils/catalogPlaceholders';
import { isVisibleProductBrand } from '@utils/categoryDisplay';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';
const IMAGE_SIZE = 96;

interface ProductCardProps {
  product: Product;
  categoryId?: string;
  categoryName?: string;
  highlightQuery?: string;
}

function ProductCardComponent({ product, categoryId, categoryName, highlightQuery }: ProductCardProps) {
  const language = useLanguageStore((s) => s.language);
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
    language === 'hi' && product.nameHi ? product.nameHi : product.name;
  const detailName =
    language === 'hi' && product.nameHi
      ? product.nameHi
      : (product.detailName ?? product.name);

  const pricing = getProductPricing(product);
  const stockLeft = getStockLeft(product);
  const deliveryEta = getDeliveryEta(product);
  const offer = getOfferLabel(product);

  const imageSource = resolveProductImageSource({
    imageUrl: product.imageUrl,
    productSlug: product.slug,
    categorySlug: product.categorySlug,
  });
  const showBrand = isVisibleProductBrand(product.brand);

  const openDetail = () => {
    router.push({
      pathname: '/products/detail/[productId]',
      params: {
        productId: product.slug || product.id,
        categoryId: categoryId ?? product.categorySlug ?? '',
        categoryName: categoryName ?? product.category,
        productName: detailName,
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
    <View style={styles.card}>
      <ScaledPressable onPress={openDetail} style={styles.imageWrap} scaleTo={0.98}>
        <ProductImage
          source={imageSource}
          size={IMAGE_SIZE}
          padding={10}
          borderRadius={10}
          recyclingKey={product.slug || product.id}
        />
        {offer ? (
          <View style={styles.offerBadge}>
            <Text style={styles.offerText} numberOfLines={1}>
              {offer}
            </Text>
          </View>
        ) : null}
      </ScaledPressable>

      <View style={styles.body}>
        <ScaledPressable onPress={openDetail}>
          {highlightQuery ? (
            <HighlightedText text={displayName} query={highlightQuery} style={styles.name} />
          ) : (
            <Text style={styles.name} numberOfLines={2}>
              {displayName}
            </Text>
          )}
        </ScaledPressable>

        <Text style={styles.unit} numberOfLines={1}>
          <ProductUnit unit={product.unit} variant="label" />
          {showBrand ? ` · ${product.brand}` : ''}
        </Text>

        <ProductPrice pricing={pricing} size="sm" />
        <ProductStockInfo
          stockLeft={stockLeft}
          deliveryEta={deliveryEta}
          variant="row"
        />
        <ProductBulkPrice pricing={pricing} variant="inline" />

        <View style={styles.actions}>
          <QuantityControls
            quantity={cartQty}
            onAdd={handleAdd}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            addLabel={addLabel}
            size="sm"
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 10,
    padding: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EEEEEE',
  },
  offerBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    maxWidth: IMAGE_SIZE - 12,
    backgroundColor: GOLD,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  offerText: {
    fontSize: 8,
    fontWeight: '800',
    color: DARK,
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-start',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
    lineHeight: 17,
  },
  unit: {
    marginTop: 1,
    marginBottom: 2,
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
  },
  actions: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

export const ProductCard = memo(ProductCardComponent);
