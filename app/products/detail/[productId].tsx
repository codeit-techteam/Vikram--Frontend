import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BackHeader } from '@components/BackHeader';
import { CartIcon } from '@components/HeaderIcons';
import { safeGoBack } from '@utils/navigation';
import { DeliveryOptions, type DeliveryType } from '@components/DeliveryOptions';
import { FrequentlyBoughtTogether } from '@components/FrequentlyBoughtTogether';
import { PricingSummary } from '@components/PricingSummary';
import { ProductImageCarousel } from '@components/ProductImageCarousel';
import { ProductSelectionSummary } from '@components/product/ProductSelectionSummary';
import { SelectedVariantCard } from '@components/product/SelectedVariantCard';
import { ScaledPressable } from '@components/ScaledPressable';
import { SiteSelector } from '@components/SiteSelector';
import { ProductVariantsRow } from '@components/ProductVariantsRow';
import { TechSpecsGrid } from '@components/TechSpecsGrid';
import {
  getCarouselImages,
  getCategoryIdForProduct,
  getProductById,
} from '@constants/catalogData';
import {
  getProductSkuUnit,
  getVariantById,
  getVariantDisplayUnit,
  productHasStructuredVariants,
} from '@constants/catalogVariantHelpers';
import { getSearchProductById, searchProductToProduct } from '@constants/searchData';
import { useSearchStore } from '@store/searchStore';
import { FREQUENTLY_BOUGHT, SPECS_BY_TYPE } from '@constants/productSpecs';
import { useAddToCart } from '@hooks/useAddToCart';
import { useDeliveryStore } from '@store/deliveryStore';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { formatINR } from '@utils/formatCurrency';

const DARK = '#1A1A1A';

export default function ProductDetailScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const { productId, categoryName, productName, categoryId } = useLocalSearchParams<{
    productId: string;
    categoryName?: string;
    productName?: string;
    categoryId?: string;
  }>();

  const catalogProduct = getProductById(productId ?? '');
  const searchProduct = getSearchProductById(productId ?? '');
  const product =
    catalogProduct ?? (searchProduct ? searchProductToProduct(searchProduct) : undefined);
  const resolvedCategoryId = categoryId ?? getCategoryIdForProduct(productId ?? '') ?? 'cement';
  const addRecentlyViewed = useSearchStore((s) => s.addRecentlyViewed);
  const { addToCart, buttonState } = useAddToCart();

  const hasVariants = product ? productHasStructuredVariants(product) : false;
  const skuUnit = product ? getProductSkuUnit(product) : '';

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [specsExpanded, setSpecsExpanded] = useState(true);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('priority');
  const [cartFlash, setCartFlash] = useState(false);

  const sites = useDeliveryStore((s) => s.sites);
  const selectedSiteId = useDeliveryStore((s) => s.selectedSiteId);
  const setSelectedSite = useDeliveryStore((s) => s.setSelectedSite);

  const btnScale = useSharedValue(1);
  const qtyOpacity = useSharedValue(1);
  const priceScale = useSharedValue(1);
  const subtotalScale = useSharedValue(1);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) ?? sites[0];

  const selectedVariant = useMemo(
    () => (product ? getVariantById(product, selectedVariantId) : undefined),
    [product, selectedVariantId],
  );

  const selectionReady = !hasVariants || Boolean(selectedVariantId);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    if (hasVariants && selectedVariant) return selectedVariant.price;
    const isBulkPrice = product.bulkThreshold > 0 && quantity >= product.bulkThreshold;
    return isBulkPrice ? product.bulkPriceValue : product.retailPriceValue;
  }, [product, hasVariants, selectedVariant, quantity]);

  const subtotal = quantity * unitPrice;
  const gst = subtotal * 0.18;
  const logistics = deliveryType === 'priority' ? 250 : 0;
  const estimatedTotal = subtotal + gst + logistics;

  const priceUnitLabel = hasVariants
    ? getVariantDisplayUnit(selectedVariant) || selectedVariant?.label || skuUnit
    : product?.unit ?? '';

  const isBulkPrice =
    !hasVariants && product ? product.bulkThreshold > 0 && quantity >= product.bulkThreshold : false;

  const carouselImages = useMemo(
    () => (product ? getCarouselImages(product) : []),
    [product],
  );

  const specs = product ? SPECS_BY_TYPE[product.categoryType] : [];

  useEffect(() => {
    priceScale.value = withSequence(
      withSpring(1.05, { damping: 12, stiffness: 280 }),
      withSpring(1, { damping: 14 }),
    );
    subtotalScale.value = withSequence(
      withSpring(1.06, { damping: 12, stiffness: 280 }),
      withSpring(1, { damping: 14 }),
    );
  }, [unitPrice, subtotal, priceScale, subtotalScale]);

  const animateQtyChange = useCallback(() => {
    qtyOpacity.value = withSequence(withTiming(0, { duration: 80 }), withTiming(1, { duration: 150 }));
  }, [qtyOpacity]);

  const changeQuantity = useCallback(
    async (delta: number) => {
      if (!selectionReady) return;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setQuantity((q) => {
        const min = product?.minOrder ?? 1;
        const max = product?.maxOrder;
        const step = product?.incrementStep ?? 1;
        let next = q + delta * step;
        if (delta < 0) next = Math.max(min, next);
        else next = Math.max(min, next);
        if (max !== undefined) next = Math.min(max, next);
        return next;
      });
      animateQtyChange();
    },
    [animateQtyChange, product?.minOrder, product?.maxOrder, product?.incrementStep, selectionReady],
  );

  const handleVariantSelect = useCallback((variantId: string) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
  }, []);

  const qtyAnimStyle = useAnimatedStyle(() => ({
    opacity: qtyOpacity.value,
  }));

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const priceAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: priceScale.value }],
  }));

  const subtotalAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: subtotalScale.value }],
  }));

  const canAddToCart = selectionReady;

  const handleAddToCart = async () => {
    if (!product || !selectionReady) return;
    if (hasVariants && !selectedVariantId) return;

    btnScale.value = withSequence(
      withSpring(0.97, { damping: 15 }),
      withSpring(1, { damping: 12 }),
    );

    await addToCart(product, quantity, { variantId: selectedVariantId });
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 400);
  };

  const addButtonLabel = (() => {
    if (!canAddToCart) return 'Select Variant First';
    if (buttonState === 'loading') return 'Adding...';
    if (buttonState === 'success') return '✓ Added';
    return t('addToCart');
  })();

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedVariantId(undefined);
    }
  }, [product?.id]);

  useEffect(() => {
    if (searchProduct) addRecentlyViewed(searchProduct);
  }, [searchProduct?.id, addRecentlyViewed]);

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">{t('productNotFound')}</Text>
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/catalog')} className="mt-4">
          <Text className="font-bold text-primary">{t('goBack')}</Text>
        </ScaledPressable>
      </View>
    );
  }

  const localizedName =
    language === 'hi' && product.nameHi
      ? product.nameHi
      : (product.detailName ?? product.name);
  const localizedDescription =
    language === 'hi' && product.descriptionHi ? product.descriptionHi : product.description;
  const displayCategory = categoryName ?? product.category;
  const displayName = productName ?? localizedName;

  const navigateBreadcrumb = (segment: 'catalog' | 'category' | 'product') => {
    if (segment === 'catalog') {
      router.push('/(tabs)/catalog' as Href);
    } else if (segment === 'category') {
      router.push({
        pathname: '/products/[categoryId]',
        params: { categoryId: resolvedCategoryId, categoryName: displayCategory },
      } as Href);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title={displayName} rightElement={<CartIcon />} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ProductImageCarousel images={carouselImages} />

        <View className="px-5 pt-4">
          <View className="flex-row flex-wrap items-center">
            <ScaledPressable onPress={() => navigateBreadcrumb('catalog')}>
              <Text className="text-sm text-text-secondary">{t('catalogLabel')}</Text>
            </ScaledPressable>
            <Text className="text-sm text-text-secondary"> / </Text>
            <ScaledPressable onPress={() => navigateBreadcrumb('category')}>
              <Text className="text-sm text-text-secondary">{displayCategory}</Text>
            </ScaledPressable>
            <Text className="text-sm text-text-secondary"> / </Text>
            <Text className="text-sm font-semibold text-primary">{displayName}</Text>
          </View>

          <Text className="mt-3 text-2xl font-bold text-text">{localizedName}</Text>
          {product.brand ? (
            <Text className="mt-1 text-sm font-semibold text-primary">{product.brand}</Text>
          ) : null}
          <Text className="mt-2 text-sm leading-5 text-text-secondary">{localizedDescription}</Text>

          {(hasVariants || product.variantsPlaceholder) && (
            <View className="mt-5 rounded-card border border-border bg-surface p-4">
              <Text className="mb-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
                {product.variantsPlaceholder ? 'Pack Size' : 'Available Variants'}
              </Text>
              <Text className="mb-2 text-xs text-text-secondary">
                Tap a pack size to select before adding to cart
              </Text>
              <ProductVariantsRow
                product={product}
                selectedVariantId={selectedVariantId}
                onSelectVariant={handleVariantSelect}
              />
              {hasVariants && !selectedVariant ? (
                <View className="mt-3 flex-row items-start gap-2 rounded-lg bg-trust p-3">
                  <Ionicons name="information-circle-outline" size={18} color="#888" />
                  <Text className="flex-1 text-sm leading-5 text-text-secondary">
                    Please select a pack size before adding this product.
                  </Text>
                </View>
              ) : null}
              {selectedVariant ? (
                <SelectedVariantCard
                  variantLabel={selectedVariant.label}
                  unit={skuUnit}
                  price={selectedVariant.price}
                />
              ) : null}
            </View>
          )}

          {product.perPiecePrice ? (
            <Text className="mt-3 text-sm text-text-secondary">
              {formatINR(product.perPiecePrice, false)} / piece
              {product.bulkPerPiecePrice
                ? ` · Bulk: ${formatINR(product.bulkPerPiecePrice, false)} / piece`
                : ''}
            </Text>
          ) : null}

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-card bg-trust p-3">
              <Ionicons name="receipt-outline" size={18} color="#FEB623" />
              <Text className="mt-2 text-[10px] font-bold tracking-wider text-text-secondary">
                {t('financials')}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-text">{t('gstInvoiceReady')}</Text>
            </View>
            <View className="flex-1 rounded-card bg-trust p-3">
              <Ionicons name="bus-outline" size={18} color="#FEB623" />
              <Text className="mt-2 text-[10px] font-bold tracking-wider text-text-secondary">
                {t('shipping')}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-text">{t('flatbedLogistics')}</Text>
            </View>
          </View>
        </View>

        <TechSpecsGrid
          specs={specs}
          expanded={specsExpanded}
          onToggle={() => setSpecsExpanded((v) => !v)}
        />

        <View className="mt-5 px-5">
          {selectionReady ? (
            <>
              <Animated.View style={priceAnimStyle}>
                <Text className="text-2xl font-extrabold text-text">
                  {formatINR(unitPrice)}
                  <Text className="text-base font-normal text-text-secondary">
                    {' '}/ {priceUnitLabel}
                  </Text>
                </Text>
              </Animated.View>

              {!hasVariants && product.bulkThreshold > 0 && (
                <View
                  className={`mt-3 self-start rounded-full border-2 px-4 py-2 ${
                    isBulkPrice ? 'border-primary bg-primary/10' : 'border-primary/40 bg-surface'
                  }`}>
                  <Text
                    className={`text-sm font-semibold ${isBulkPrice ? 'text-primary' : 'text-text'}`}>
                    🏷 {product.bulkLabel}: {product.bulkPrice}
                    {isBulkPrice ? ` ✓ ${t('applied')}` : ''}
                  </Text>
                </View>
              )}

              <View className="mt-4 flex-row items-center">
                <View className="flex-1 flex-row items-center rounded-card bg-trust px-2 py-2">
                  <ScaledPressable
                    onPress={() => changeQuantity(-1)}
                    className="h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface">
                    <Text className="text-xl font-bold text-text-secondary">−</Text>
                  </ScaledPressable>
                  <Animated.Text
                    style={qtyAnimStyle}
                    className="min-w-[48px] text-center text-xl font-bold text-text">
                    {quantity}
                  </Animated.Text>
                  <ScaledPressable
                    onPress={() => changeQuantity(1)}
                    className="h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface">
                    <Text className="text-xl font-bold text-text-secondary">+</Text>
                  </ScaledPressable>
                </View>

                <Animated.View style={subtotalAnimStyle} className="ml-4 items-end">
                  <Text className="text-xs text-text-secondary">{t('totalSubtotal')}</Text>
                  <Text className="text-lg font-extrabold text-primary">{formatINR(subtotal)}</Text>
                </Animated.View>
              </View>

              <ProductSelectionSummary
                productName={localizedName}
                variantLabel={selectedVariant?.label}
                quantity={quantity}
                unit={hasVariants ? skuUnit : product.unit}
                total={subtotal}
              />
            </>
          ) : (
            <View className="rounded-card border border-dashed border-border bg-trust p-5">
              <Text className="text-center text-sm font-semibold text-text-secondary">
                Select a variant above to see price and quantity options
              </Text>
            </View>
          )}

          <Animated.View style={btnAnimStyle} className="mt-4">
            <ScaledPressable
              onPress={handleAddToCart}
              disabled={!canAddToCart || buttonState === 'loading'}
              className={`flex-row items-center justify-center rounded-pill py-4 ${
                cartFlash || buttonState === 'success'
                  ? 'bg-success'
                  : canAddToCart
                    ? 'bg-primary'
                    : 'bg-border'
              }`}>
              {buttonState === 'loading' ? (
                <ActivityIndicator size="small" color={DARK} />
              ) : (
                <Ionicons
                  name={
                    buttonState === 'success'
                      ? 'checkmark-circle'
                      : canAddToCart
                        ? 'cart-outline'
                        : 'options-outline'
                  }
                  size={20}
                  color={
                    cartFlash || buttonState === 'success'
                      ? '#FFFFFF'
                      : canAddToCart
                        ? DARK
                        : '#AAA'
                  }
                />
              )}
              <Text
                className="ml-2 text-base font-bold"
                style={{
                  color:
                    cartFlash || buttonState === 'success'
                      ? '#FFFFFF'
                      : canAddToCart
                        ? DARK
                        : '#AAA',
                }}
                numberOfLines={1}>
                {addButtonLabel}
              </Text>
            </ScaledPressable>
          </Animated.View>
        </View>

        <SiteSelector
          sites={sites}
          selectedSiteId={selectedSiteId}
          onSelect={setSelectedSite}
        />

        {selectionReady && (
          <PricingSummary
            unitLabel={priceUnitLabel}
            baseRate={unitPrice}
            subtotal={subtotal}
            gst={gst}
            estimatedTotal={estimatedTotal}
          />
        )}

        <DeliveryOptions
          selected={deliveryType}
          onSelect={setDeliveryType}
          siteName={selectedSite?.name ?? 'your site'}
        />

        <FrequentlyBoughtTogether items={FREQUENTLY_BOUGHT} />

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
