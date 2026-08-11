import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { BackHeader } from '@components/BackHeader';
import { CartIcon } from '@components/HeaderIcons';
import { AddToCartButton, getAddToCartMode } from '@components/product/AddToCartButton';
import { ProductBulkPrice } from '@components/product/ProductBulkPrice';
import { ProductPrice } from '@components/product/ProductPrice';
import { ProductQuantitySelector } from '@components/product/ProductQuantitySelector';
import { ProductStockInfo } from '@components/product/ProductStockInfo';
import { safeGoBack } from '@utils/navigation';
import {
  isVisibleProductBrand,
  normalizeCategoryDisplayName,
} from '@utils/categoryDisplay';
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
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { ProductDetailSkeleton } from '@components/catalog/CatalogSkeletons';
import { getCarouselImages } from '@constants/catalogData';
import {
  getProductSkuUnit,
  getVariantById,
  getVariantDisplayUnit,
  productHasStructuredVariants,
} from '@constants/catalogVariantHelpers';
import { useSearchStore } from '@store/searchStore';
import { useProductDetail, useRelatedProducts } from '@hooks/useProducts';
import { useAddToCart } from '@hooks/useAddToCart';
import { useDeliveryEta } from '@hooks/useDeliveryEta';
import { useCartStore } from '@store/cartStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { formatINR } from '@utils/formatCurrency';
import { specsMapToTechItems, productToSearchProduct } from '@utils/catalogAdapters';
import {
  getDeliveryEta,
  getProductPricing,
  getStockLeft,
} from '@utils/productPricing';
import { computeQuantityPricing } from '@utils/quantityPricing';
import type { FrequentlyBoughtItem } from '@/types/catalog';

export default function ProductDetailScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const { estimatedMinutes, deliveryMessage: etaLabel } = useDeliveryEta({ autoFetch: true });
  const { productId, categoryName, productName, categoryId } = useLocalSearchParams<{
    productId: string;
    categoryName?: string;
    productName?: string;
    categoryId?: string;
  }>();

  const {
    product,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useProductDetail(productId);

  const { related } = useRelatedProducts(product);
  const addRecentlyViewed = useSearchStore((s) => s.addRecentlyViewed);
  const { addToCart, buttonState } = useAddToCart();

  const hasVariants = product ? productHasStructuredVariants(product) : false;
  const skuUnit = product ? getProductSkuUnit(product) : '';

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [localQty, setLocalQty] = useState(1);
  const [specsExpanded, setSpecsExpanded] = useState(true);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('priority');

  const sites = useDeliveryStore((s) => s.sites);
  const selectedSiteId = useDeliveryStore((s) => s.selectedSiteId);
  const setSelectedSite = useDeliveryStore((s) => s.setSelectedSite);

  const btnScale = useSharedValue(1);
  const subtotalScale = useSharedValue(1);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) ?? sites[0];

  const selectedVariant = useMemo(
    () => (product ? getVariantById(product, selectedVariantId) : undefined),
    [product, selectedVariantId],
  );

  const selectionReady = !hasVariants || Boolean(selectedVariantId);

  const cartLineId = useMemo(() => {
    if (!product || !selectionReady) return undefined;
    if (hasVariants && selectedVariantId) return `${product.id}_${selectedVariantId}`;
    return product.id;
  }, [product, selectionReady, hasVariants, selectedVariantId]);

  const cartQty = useCartStore((s) =>
    cartLineId ? (s.items.find((i) => i.id === cartLineId)?.quantity ?? 0) : 0,
  );

  useEffect(() => {
    if (!product) return;
    const lineId =
      hasVariants && selectedVariantId
        ? `${product.id}_${selectedVariantId}`
        : !hasVariants
          ? product.id
          : undefined;
    const lineQty = lineId
      ? (useCartStore.getState().items.find((i) => i.id === lineId)?.quantity ?? 0)
      : 0;
    setLocalQty(
      lineQty > 0
        ? lineQty
        : 1,
    );
  }, [product?.id, selectedVariantId, hasVariants, product]);

  const pricing = useMemo(
    () => (product ? getProductPricing(product, selectedVariant) : null),
    [product, selectedVariant],
  );

  const quote = useMemo(() => {
    if (!product || !pricing) return null;
    return computeQuantityPricing(product, localQty, selectedVariant, pricing);
  }, [product, pricing, localQty, selectedVariant]);

  const unitPrice = quote?.appliedUnitPrice ?? pricing?.sellingPrice ?? 0;
  const subtotal = quote?.subtotalBeforeGst ?? localQty * unitPrice;
  const gst = quote?.gstAmount ?? subtotal * ((product?.gst ?? 18) / 100);
  const logistics = deliveryType === 'priority' ? 250 : 0;
  const estimatedTotal = (quote?.estimatedTotal ?? subtotal + gst) + logistics;

  const priceUnitLabel = hasVariants
    ? getVariantDisplayUnit(selectedVariant) || selectedVariant?.label || skuUnit
    : product?.unit ?? '';

  const stockLeft = product ? getStockLeft(product) : null;
  const deliveryEta = product
    ? getDeliveryEta(product, estimatedMinutes, etaLabel)
    : etaLabel || '';
  const mode = getAddToCartMode(localQty, cartQty);

  const carouselImages = useMemo(
    () => (product ? getCarouselImages(product) : []),
    [product],
  );

  const specs = useMemo(
    () => (product ? specsMapToTechItems(product.specsMap) : []),
    [product],
  );

  const relatedItems = useMemo<FrequentlyBoughtItem[]>(
    () =>
      related.slice(0, 6).map((p) => ({
        id: p.slug || p.id,
        name: p.detailName ?? p.name,
        desc: p.brand ?? p.category,
        price: formatINR(p.retailPriceValue),
        priceValue: p.retailPriceValue,
        imageSearch: p.imageUrl ?? p.categorySlug ?? p.imageSearch,
        unit: p.unit,
      })),
    [related],
  );

  useEffect(() => {
    subtotalScale.value = withSequence(
      withSpring(1.06, { damping: 12, stiffness: 280 }),
      withSpring(1, { damping: 14 }),
    );
  }, [subtotal, subtotalScale]);

  const handleVariantSelect = useCallback((variantId: string) => {
    setSelectedVariantId(variantId);
  }, []);

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
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

    await addToCart(product, localQty, { variantId: selectedVariantId });
  };

  useEffect(() => {
    if (product) setSelectedVariantId(undefined);
  }, [product?.id]);

  useEffect(() => {
    if (product) addRecentlyViewed(productToSearchProduct(product));
  }, [product?.id, addRecentlyViewed, product]);

  const resolvedCategoryId =
    categoryId || product?.categorySlug || product?.categoryType || '';

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <BackHeader title={productName ?? t('loading')} rightElement={<CartIcon />} />
        <ProductDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (error && !product) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <BackHeader title={t('productNotFound')} rightElement={<CartIcon />} />
        <CatalogErrorState onRetry={() => void refresh()} />
      </SafeAreaView>
    );
  }

  if (!product || !pricing) {
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
  const displayCategory = normalizeCategoryDisplayName(
    categoryName ?? product.category ?? '',
  );
  const displayName = productName ?? localizedName;
  const showBrand = isVisibleProductBrand(product.brand);

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
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} />
        }>
        <ProductImageCarousel images={carouselImages} />

        <View className="px-4 pt-4">
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
          {showBrand ? (
            <Text className="mt-1 text-sm font-semibold text-primary">{product.brand}</Text>
          ) : null}
          {(product.productTypeLabel || product.gradeLabel || product.grade) ? (
            <View className="mt-2 flex-row flex-wrap gap-2">
              {product.productTypeLabel ? (
                <View className="rounded-full bg-trust px-3 py-1">
                  <Text className="text-xs font-semibold text-text">
                    {product.productTypeLabel}
                  </Text>
                </View>
              ) : null}
              {(product.gradeLabel || product.grade) ? (
                <View className="rounded-full bg-trust px-3 py-1">
                  <Text className="text-xs font-semibold text-text">
                    {t('grade')}: {product.gradeLabel || product.grade}
                  </Text>
                </View>
              ) : null}
            </View>
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
              <Text className="mt-1 text-sm font-semibold text-text">
                {product.gst != null ? `GST ${product.gst}%` : t('gstInvoiceReady')}
              </Text>
            </View>
            <View className="flex-1 rounded-card bg-trust p-3">
              <Ionicons name="bus-outline" size={18} color="#FEB623" />
              <Text className="mt-2 text-[10px] font-bold tracking-wider text-text-secondary">
                {t('shipping')}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-text">
                {deliveryEta || t('flatbedLogistics')}
              </Text>
            </View>
          </View>
        </View>

        {specs.length > 0 ? (
          <TechSpecsGrid
            specs={specs}
            expanded={specsExpanded}
            onToggle={() => setSpecsExpanded((v) => !v)}
          />
        ) : null}

        <View className="mt-5 px-4 pb-2">
          {selectionReady ? (
            <>
              <ProductPrice pricing={pricing} size="lg" showUnit />
              <View className="mt-2">
                <ProductStockInfo stockLeft={stockLeft} deliveryEta={deliveryEta} />
              </View>
              <ProductBulkPrice pricing={pricing} />

              <View className="mt-4 rounded-card border border-border bg-trust p-4">
                <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Order Quantity
                </Text>
                <Text className="mt-2 text-sm leading-5 text-text">
                  Choose any quantity from 1 {product.unit.toLowerCase()} onwards.
                </Text>
                <Text className="mt-1 text-sm leading-5 text-text-secondary">
                  Bulk pricing automatically applies on eligible quantities.
                  Vehicle is assigned automatically based on order size.
                </Text>
              </View>

              <View className="mt-5 flex-row items-center justify-between">
                <ProductQuantitySelector
                  quantity={localQty}
                  onChange={setLocalQty}
                  min={1}
                  max={product.maxOrder}
                  step={product.incrementStep ?? 1}
                  size="lg"
                />
                <Animated.View style={subtotalAnimStyle} className="ml-4 items-end">
                  <Text className="text-xs text-text-secondary">{t('totalSubtotal')}</Text>
                  <Text className="text-lg font-extrabold text-primary">{formatINR(subtotal)}</Text>
                </Animated.View>
              </View>

              {quote ? (
                <View className="mt-3 flex-row items-center gap-2 rounded-lg bg-trust px-3 py-2">
                  <Text className="text-base">{quote.vehicle.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-text">{quote.modeTitle}</Text>
                    <Text className="text-xs text-text-secondary">{quote.deliveryMessage}</Text>
                  </View>
                  {quote.bulkApplied ? (
                    <Text className="text-xs font-extrabold" style={{ color: '#2E7D32' }}>
                      Bulk Applied
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <ProductSelectionSummary
                productName={localizedName}
                variantLabel={selectedVariant?.label}
                quantity={localQty}
                unit={hasVariants ? skuUnit : product.unit}
                total={subtotal}
                deliveryMode={quote?.deliveryMode}
                unitPrice={unitPrice}
                savings={quote?.bulkDiscountAmount}
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
            <AddToCartButton
              mode={mode}
              onPress={() => void handleAddToCart()}
              loading={buttonState === 'loading'}
              disabled={!canAddToCart}
              fullWidth
              labelOverride={!canAddToCart ? 'Select Variant First' : undefined}
            />
          </Animated.View>
        </View>

        <SiteSelector
          sites={sites}
          selectedSiteId={selectedSiteId ?? ''}
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
          deliveryMessage={deliveryEta || etaLabel || undefined}
        />

        {relatedItems.length > 0 ? <FrequentlyBoughtTogether items={relatedItems} /> : null}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
