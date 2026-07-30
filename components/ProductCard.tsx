import { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';

import { AddToCartButton, getAddToCartMode } from '@components/product/AddToCartButton';
import { ProductBulkPrice } from '@components/product/ProductBulkPrice';
import { ProductPrice } from '@components/product/ProductPrice';
import { ProductQuantitySelector } from '@components/product/ProductQuantitySelector';
import { ProductStockInfo } from '@components/product/ProductStockInfo';
import { ScaledPressable } from '@components/ScaledPressable';
import { HighlightedText } from '@components/search/HighlightedText';
import { ProductUnit } from '@components/product/ProductUnit';
import {
  allowsDirectAddToCart,
  getVariantCount,
  productHasStructuredVariants,
  shouldOpenVariantSheet,
} from '@constants/catalogVariantHelpers';
import type { Product } from '@/types/catalog';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useCartStore } from '@store/cartStore';
import { useVariantStore } from '@store/variantStore';
import { useAddToCart } from '@hooks/useAddToCart';
import { useDeliveryEta } from '@hooks/useDeliveryEta';
import {
  getDeliveryEta,
  getOfferLabel,
  getProductPricing,
  getStockLeft,
} from '@utils/productPricing';
import { resolveProductImageSource } from '@utils/catalogPlaceholders';

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
  const { t } = useTranslation();
  const hasVariants = productHasStructuredVariants(product);
  const variantCount = getVariantCount(product);
  const directAdd = allowsDirectAddToCart(product);
  const openVariantSheet = useVariantStore((s) => s.open);
  const { addToCart, buttonState } = useAddToCart();
  const { estimatedMinutes, deliveryMessage: etaLabel } = useDeliveryEta({ autoFetch: false });

  const cartQty = useCartStore(
    (s) =>
      s.items.reduce(
        (sum, i) => ((i.productId ?? i.id) === product.id ? sum + i.quantity : sum),
        0,
      ),
  );

  const [localQty, setLocalQty] = useState(() =>
    Math.max(1, cartQty || product.defaultQuantity || 1),
  );

  useEffect(() => {
    if (cartQty > 0) setLocalQty(cartQty);
  }, [cartQty, product.id]);

  const displayName =
    language === 'hi' && product.nameHi ? product.nameHi : product.name;
  const detailName =
    language === 'hi' && product.nameHi
      ? product.nameHi
      : (product.detailName ?? product.name);

  const pricing = getProductPricing(product);
  const stockLeft = getStockLeft(product);
  const deliveryEta = getDeliveryEta(product, estimatedMinutes, etaLabel);
  const offer = getOfferLabel(product);
  const mode = getAddToCartMode(localQty, cartQty);

  const imageSource = resolveProductImageSource({
    imageUrl: product.imageUrl,
    productSlug: product.slug,
    categorySlug: product.categorySlug,
  });

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

  const handleAddToCart = async () => {
    if (shouldOpenVariantSheet(product)) {
      openVariantSheet(product);
      return;
    }
    if (hasVariants && variantCount === 1) {
      await addToCart(product, localQty, {
        variantId: product.productVariants?.[0]?.id,
      });
      return;
    }
    if (!directAdd) {
      openDetail();
      return;
    }
    await addToCart(product, localQty);
  };

  const addLabel =
    shouldOpenVariantSheet(product)
      ? `${variantCount} Options`
      : undefined;

  return (
    <View style={styles.card}>
      <ScaledPressable onPress={openDetail} style={styles.imageWrap}>
        <Image
          source={imageSource}
          style={styles.image}
          contentFit="cover"
          recyclingKey={product.slug || product.id}
          transition={200}
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
          {product.brand ? ` · ${product.brand}` : ''}
        </Text>

        <ProductPrice pricing={pricing} size="sm" />
        <ProductStockInfo
          stockLeft={stockLeft}
          deliveryEta={deliveryEta}
          variant="row"
        />
        <ProductBulkPrice pricing={pricing} variant="inline" />

        <View style={styles.actions}>
          {directAdd ? (
            <>
              <ProductQuantitySelector
                quantity={localQty}
                onChange={setLocalQty}
                min={product.minOrder ?? 1}
                max={product.maxOrder}
                step={product.incrementStep ?? 1}
                size="sm"
              />
              <AddToCartButton
                mode={mode}
                onPress={() => void handleAddToCart()}
                loading={buttonState === 'loading'}
                compact
                fullWidth={false}
              />
            </>
          ) : (
            <AddToCartButton
              mode="add"
              onPress={() => void handleAddToCart()}
              compact
              fullWidth={false}
              labelOverride={addLabel ?? t('addToCart')}
            />
          )}
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
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
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
    gap: 8,
  },
});

export const ProductCard = memo(ProductCardComponent);
