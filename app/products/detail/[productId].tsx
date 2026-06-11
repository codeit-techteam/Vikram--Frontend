import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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

import { AppHeader } from '@components/AppHeader';
import { safeGoBack } from '@utils/navigation';
import { DeliveryOptions, type DeliveryType } from '@components/DeliveryOptions';
import { FrequentlyBoughtTogether } from '@components/FrequentlyBoughtTogether';
import { PricingSummary } from '@components/PricingSummary';
import { ProductImageCarousel } from '@components/ProductImageCarousel';
import { ScaledPressable } from '@components/ScaledPressable';
import { SiteSelector } from '@components/SiteSelector';
import { TechSpecsGrid } from '@components/TechSpecsGrid';
import {
  getCarouselImages,
  getCategoryIdForProduct,
  getProductById,
} from '@constants/catalogData';
import { getSearchProductById, searchProductToProduct } from '@constants/searchData';
import { useSearchStore } from '@store/searchStore';
import { FREQUENTLY_BOUGHT, SPECS_BY_TYPE } from '@constants/productSpecs';
import { useCartStore } from '@store/cartStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { formatINR } from '@utils/formatCurrency';
import { productToCartItem } from '@utils/cartHelpers';

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
  const resolvedCategoryId = categoryId ?? getCategoryIdForProduct(productId ?? '') ?? '1';
  const addRecentlyViewed = useSearchStore((s) => s.addRecentlyViewed);

  const [quantity, setQuantity] = useState(product?.defaultQuantity ?? 1);
  const [specsExpanded, setSpecsExpanded] = useState(true);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('priority');
  const [cartFlash, setCartFlash] = useState(false);

  const sites = useDeliveryStore((s) => s.sites);
  const selectedSiteId = useDeliveryStore((s) => s.selectedSiteId);
  const setSelectedSite = useDeliveryStore((s) => s.setSelectedSite);
  const addItem = useCartStore((s) => s.addItem);

  const btnScale = useSharedValue(1);
  const qtyOpacity = useSharedValue(1);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) ?? sites[0];

  const isBulkPrice = quantity >= (product?.bulkThreshold ?? 50);
  const unitPrice = isBulkPrice
    ? (product?.bulkPriceValue ?? 0)
    : (product?.retailPriceValue ?? 0);
  const subtotal = quantity * unitPrice;
  const gst = subtotal * 0.18;
  const logistics = deliveryType === 'priority' ? 250 : 0;
  const estimatedTotal = subtotal + gst + logistics;

  const carouselImages = useMemo(
    () => (product ? getCarouselImages(product) : []),
    [product],
  );

  const specs = product ? SPECS_BY_TYPE[product.categoryType] : [];

  const animateQtyChange = useCallback(() => {
    qtyOpacity.value = withSequence(withTiming(0, { duration: 80 }), withTiming(1, { duration: 150 }));
  }, [qtyOpacity]);

  const changeQuantity = useCallback(
    async (delta: number) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setQuantity((q) => Math.max(1, q + delta));
      animateQtyChange();
    },
    [animateQtyChange],
  );

  const qtyAnimStyle = useAnimatedStyle(() => ({
    opacity: qtyOpacity.value,
  }));

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleAddToCart = async () => {
    if (!product) return;

    btnScale.value = withSequence(
      withSpring(0.97, { damping: 15 }),
      withSpring(1, { damping: 12 }),
    );
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    addItem(productToCartItem(product, quantity));

    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 300);
  };

  useEffect(() => {
    if (product) setQuantity(product.defaultQuantity);
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
      <AppHeader showBack title={displayName} />
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
        <Text className="mt-2 text-sm leading-5 text-text-secondary">{localizedDescription}</Text>

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
        <Text className="text-2xl font-bold text-text">
          {formatINR(product.retailPriceValue)} / {product.unit}
        </Text>

        <View
          className={`mt-3 self-start rounded-full border-2 px-4 py-2 ${
            isBulkPrice ? 'border-primary bg-primary/10' : 'border-primary/40 bg-surface'
          }`}>
          <Text className={`text-sm font-semibold ${isBulkPrice ? 'text-primary' : 'text-text'}`}>
            🏷 {product.bulkLabel}: {product.bulkPrice}
            {isBulkPrice ? ` ✓ ${t('applied')}` : ''}
          </Text>
        </View>

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

          <View className="ml-4 items-end">
            <Text className="text-xs text-text-secondary">{t('totalSubtotal')}</Text>
            <Text className="text-lg font-bold text-primary">{formatINR(subtotal)}</Text>
          </View>
        </View>

        <Animated.View style={btnAnimStyle} className="mt-4">
          <ScaledPressable
            onPress={handleAddToCart}
            className={`flex-row items-center justify-center rounded-pill py-4 ${
              cartFlash ? 'bg-success' : 'bg-primary'
            }`}>
            <Ionicons
              name="cart-outline"
              size={20}
              color={cartFlash ? '#FFFFFF' : DARK}
            />
            <Text
              className="ml-2 text-base font-bold"
              style={{ color: cartFlash ? '#FFFFFF' : DARK }}
              numberOfLines={1}>
              {t('addToCart')}
            </Text>
          </ScaledPressable>
        </Animated.View>
      </View>

      <SiteSelector
        sites={sites}
        selectedSiteId={selectedSiteId}
        onSelect={setSelectedSite}
      />

      <PricingSummary
        unitLabel={product.unit}
        baseRate={unitPrice}
        subtotal={subtotal}
        gst={gst}
        estimatedTotal={estimatedTotal}
      />

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
