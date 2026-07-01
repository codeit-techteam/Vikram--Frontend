import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ScaledPressable } from '@components/ScaledPressable';
import { HighlightedText } from '@components/search/HighlightedText';
import { getProductImageSource } from '@constants/catalogData';
import {
  allowsDirectAddToCart,
  getStartingPrice,
  getStartingVariantLabel,
  getVariantAvailabilityText,
  productHasStructuredVariants,
} from '@constants/catalogVariantHelpers';
import type { Product } from '@/types/catalog';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useAddToCart } from '@hooks/useAddToCart';
import { formatINR } from '@utils/formatCurrency';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';

interface ProductCardProps {
  product: Product;
  categoryId?: string;
  categoryName?: string;
  highlightQuery?: string;
}

function getStatusColors(status: Product['status']) {
  if (status === 'LIMITED STOCK') {
    return { bg: '#FFF4D1', text: '#E65100' };
  }
  return { bg: '#E8F5E9', text: '#2E7D32' };
}

function getStatusLabel(status: Product['status'], t: ReturnType<typeof useTranslation>['t']) {
  switch (status) {
    case 'READY FOR DISPATCH':
      return t('readyForDispatch');
    case 'IN STOCK':
      return t('inStock');
    case 'LIMITED STOCK':
      return t('limitedStock');
    default:
      return status;
  }
}

export function ProductCard({ product, categoryId, categoryName, highlightQuery }: ProductCardProps) {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const hasVariants = productHasStructuredVariants(product);
  const directAdd = allowsDirectAddToCart(product);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const { addToCart, buttonState } = useAddToCart();
  const btnScale = useSharedValue(1);
  const flashOpacity = useSharedValue(0);

  const displayName =
    language === 'hi' && product.nameHi ? product.nameHi : product.name;
  const detailName =
    language === 'hi' && product.nameHi
      ? product.nameHi
      : (product.detailName ?? product.name);

  const statusColors = getStatusColors(product.status);
  const minOrder = product.minOrder ?? 1;
  const step = product.incrementStep ?? 1;
  const maxOrder = product.maxOrder;

  const startingPrice = getStartingPrice(product);
  const startingLabel = getStartingVariantLabel(product);
  const availabilityText = getVariantAvailabilityText(product);

  const isBulk =
    directAdd && product.bulkThreshold > 0 && quantity >= product.bulkThreshold;
  const effectivePrice = isBulk ? product.bulkPriceValue : product.retailPriceValue;
  const totalPrice = quantity * effectivePrice;

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  useEffect(() => {
    setQuantity(1);
  }, [product.id]);

  const openDetail = () => {
    router.push({
      pathname: '/products/detail/[productId]',
      params: {
        productId: product.id,
        categoryId: categoryId ?? '',
        categoryName: categoryName ?? product.category,
        productName: detailName,
      },
    } as Href);
  };

  const increment = () => {
    setQuantity((q) => {
      const next = q + step;
      return maxOrder !== undefined ? Math.min(maxOrder, next) : next;
    });
    Haptics.selectionAsync();
  };

  const decrement = () => {
    setQuantity((q) => Math.max(minOrder, q - step));
    Haptics.selectionAsync();
  };

  const handleQuantityBlur = () => {
    setIsEditingQty(false);
    if (quantity < minOrder) setQuantity(minOrder);
    if (maxOrder !== undefined && quantity > maxOrder) setQuantity(maxOrder);
  };

  const handleAddToCart = async () => {
    btnScale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 12 }),
    );
    flashOpacity.value = withSequence(withTiming(1, { duration: 100 }), withTiming(0, { duration: 400 }));
    await addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const ctaLabel = hasVariants
    ? 'Select Variant'
    : product.variantsPlaceholder
      ? 'View Product'
      : t('addToCart');

  const cardBody = (
    <>
      <View className="relative" style={{ height: 180 }}>
        <Image
          source={getProductImageSource(product)}
          style={{ width: '100%', height: 180 }}
          contentFit="cover"
        />
        <View
          className="absolute left-3 top-3 rounded-full px-3 py-1"
          style={{ backgroundColor: product.badgeColor ?? GOLD }}>
          <Text className="text-[10px] font-bold text-onPrimary">{product.badge}</Text>
        </View>
        <View className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full bg-surface/90">
          <Ionicons name="heart-outline" size={18} color="#666666" />
        </View>
      </View>

      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-[10px] font-semibold tracking-wider text-text-secondary">
              {product.category}
            </Text>
            {product.brand ? (
              <Text className="mt-0.5 text-[10px] font-bold text-primary">{product.brand}</Text>
            ) : null}
          </View>
          <View className="rounded-md bg-secondary/10 px-2 py-0.5">
            <Text className="text-xs font-bold text-secondary">
              {t('grade')} {product.grade}
            </Text>
          </View>
        </View>

        {highlightQuery ? (
          <HighlightedText
            text={displayName}
            query={highlightQuery}
            style={{ marginTop: 4, fontSize: 18, fontWeight: '700' }}
          />
        ) : (
          <Text className="mt-1 text-lg font-bold text-text">{displayName}</Text>
        )}

        <View className="mt-2 flex-row items-center gap-2">
          <View className="rounded px-2 py-0.5" style={{ backgroundColor: statusColors.bg }}>
            <Text className="text-[10px] font-bold" style={{ color: statusColors.text }}>
              {getStatusLabel(product.status, t)}
            </Text>
          </View>
        </View>

        {hasVariants ? (
          <View
            style={{
              backgroundColor: '#F8F8F8',
              borderRadius: 10,
              padding: 12,
              marginTop: 10,
              marginBottom: 12,
            }}>
            <Text style={{ fontSize: 11, color: '#888', fontWeight: '600', letterSpacing: 0.5 }}>
              STARTING FROM
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: DARK, marginTop: 4 }}>
              {startingLabel}
            </Text>
            {availabilityText ? (
              <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{availabilityText}</Text>
            ) : null}
            <Text style={{ fontSize: 20, fontWeight: '800', color: GOLD, marginTop: 8 }}>
              {formatINR(startingPrice, false)}
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#F8F8F8',
              borderRadius: 10,
              padding: 10,
              marginTop: 10,
              marginBottom: 12,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: '#888' }}>{t('retailPrice')}</Text>
              <Text style={{ fontSize: 13, color: DARK, fontWeight: '600' }}>
                {formatINR(product.retailPriceValue)} / {product.unit}
              </Text>
            </View>
            {product.bulkThreshold > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: GOLD, fontWeight: '700' }}>
                  {product.bulkLabel}
                </Text>
                <Text style={{ fontSize: 13, color: GOLD, fontWeight: '700' }}>
                  {formatINR(product.bulkPriceValue)}
                </Text>
              </View>
            )}
          </View>
        )}

        {directAdd && (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: step > 1 ? 4 : 12,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: '#E0E0E0',
                  borderRadius: 10,
                  overflow: 'hidden',
                  height: 42,
                }}>
                <TouchableOpacity
                  onPress={decrement}
                  style={{ paddingHorizontal: 12, height: '100%', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, color: DARK, fontWeight: '300' }}>−</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsEditingQty(true)}
                  style={{
                    paddingHorizontal: 8,
                    minWidth: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}>
                  {isEditingQty ? (
                    <TextInput
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: DARK,
                        textAlign: 'center',
                        minWidth: 44,
                      }}
                      keyboardType="number-pad"
                      value={String(quantity)}
                      onChangeText={(val) => {
                        const num = parseInt(val, 10);
                        if (!Number.isNaN(num) && num >= minOrder) {
                          setQuantity(maxOrder !== undefined ? Math.min(maxOrder, num) : num);
                        }
                        if (val === '') setQuantity(minOrder);
                      }}
                      onBlur={handleQuantityBlur}
                      autoFocus
                      selectTextOnFocus
                    />
                  ) : (
                    <Text style={{ fontSize: 15, fontWeight: '700', color: DARK }}>
                      {quantity.toLocaleString('en-IN')}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={increment}
                  style={{ paddingHorizontal: 12, height: '100%', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, color: DARK, fontWeight: '300' }}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#888', fontWeight: '500' }}>Total</Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: isBulk ? GOLD : DARK,
                  }}>
                  {formatINR(totalPrice, false)}
                </Text>
              </View>
            </View>

            {step > 1 && (
              <Text
                style={{
                  fontSize: 11,
                  color: '#888',
                  marginTop: -4,
                  marginBottom: 8,
                  textAlign: 'center',
                }}>
                Tap number to type quantity directly
              </Text>
            )}
          </>
        )}

        <Animated.View style={btnAnimStyle}>
          {directAdd ? (
            <TouchableOpacity onPress={handleAddToCart}
              style={{
                backgroundColor: added ? '#34C759' : GOLD,
                borderRadius: 12,
                paddingVertical: 13,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}>
              <Animated.View className="absolute inset-0 rounded-lg bg-success" style={flashStyle} />
              <Ionicons name={added ? 'checkmark' : 'cart-outline'} size={18} color={DARK} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: added ? '#fff' : DARK }}>
                {added ? 'Added to Cart ✓' : t('addToCart')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                backgroundColor: GOLD,
                borderRadius: 12,
                paddingVertical: 13,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: DARK }}>{ctaLabel}</Text>
              <Ionicons name="arrow-forward" size={16} color={DARK} />
            </View>
          )}
        </Animated.View>
      </View>
    </>
  );

  if (hasVariants || product.variantsPlaceholder) {
    return (
      <ScaledPressable
        onPress={openDetail}
        className="mb-4 overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        {cardBody}
      </ScaledPressable>
    );
  }

  return (
    <View className="mb-4 overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      <ScaledPressable onPress={openDetail} className="relative" style={{ height: 180 }}>
        <Image
          source={getProductImageSource(product)}
          style={{ width: '100%', height: 180 }}
          contentFit="cover"
        />
        <View
          className="absolute left-3 top-3 rounded-full px-3 py-1"
          style={{ backgroundColor: product.badgeColor ?? GOLD }}>
          <Text className="text-[10px] font-bold text-onPrimary">{product.badge}</Text>
        </View>
        <View className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full bg-surface/90">
          <Ionicons name="heart-outline" size={18} color="#666666" />
        </View>
      </ScaledPressable>

      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-[10px] font-semibold tracking-wider text-text-secondary">
              {product.category}
            </Text>
            {product.brand ? (
              <Text className="mt-0.5 text-[10px] font-bold text-primary">{product.brand}</Text>
            ) : null}
          </View>
          <View className="rounded-md bg-secondary/10 px-2 py-0.5">
            <Text className="text-xs font-bold text-secondary">
              {t('grade')} {product.grade}
            </Text>
          </View>
        </View>

        <ScaledPressable onPress={openDetail}>
          {highlightQuery ? (
            <HighlightedText
              text={displayName}
              query={highlightQuery}
              style={{ marginTop: 4, fontSize: 18, fontWeight: '700' }}
            />
          ) : (
            <Text className="mt-1 text-lg font-bold text-text">{displayName}</Text>
          )}
        </ScaledPressable>

        <View className="mt-2 flex-row items-center gap-2">
          <View className="rounded px-2 py-0.5" style={{ backgroundColor: statusColors.bg }}>
            <Text className="text-[10px] font-bold" style={{ color: statusColors.text }}>
              {getStatusLabel(product.status, t)}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: '#F8F8F8',
            borderRadius: 10,
            padding: 10,
            marginTop: 10,
            marginBottom: 12,
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 13, color: '#888' }}>{t('retailPrice')}</Text>
            <Text style={{ fontSize: 13, color: DARK, fontWeight: '600' }}>
              {formatINR(product.retailPriceValue)} / {product.unit}
            </Text>
          </View>
          {product.bulkThreshold > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: GOLD, fontWeight: '700' }}>
                {product.bulkLabel}
              </Text>
              <Text style={{ fontSize: 13, color: GOLD, fontWeight: '700' }}>
                {formatINR(product.bulkPriceValue)}
              </Text>
            </View>
          )}
        </View>

        {directAdd && (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: step > 1 ? 4 : 12,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: '#E0E0E0',
                  borderRadius: 10,
                  overflow: 'hidden',
                  height: 42,
                }}>
                <TouchableOpacity
                  onPress={decrement}
                  style={{ paddingHorizontal: 12, height: '100%', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, color: DARK, fontWeight: '300' }}>−</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsEditingQty(true)}
                  style={{
                    paddingHorizontal: 8,
                    minWidth: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}>
                  {isEditingQty ? (
                    <TextInput
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: DARK,
                        textAlign: 'center',
                        minWidth: 44,
                      }}
                      keyboardType="number-pad"
                      value={String(quantity)}
                      onChangeText={(val) => {
                        const num = parseInt(val, 10);
                        if (!Number.isNaN(num) && num >= minOrder) {
                          setQuantity(maxOrder !== undefined ? Math.min(maxOrder, num) : num);
                        }
                        if (val === '') setQuantity(minOrder);
                      }}
                      onBlur={handleQuantityBlur}
                      autoFocus
                      selectTextOnFocus
                    />
                  ) : (
                    <Text style={{ fontSize: 15, fontWeight: '700', color: DARK }}>
                      {quantity.toLocaleString('en-IN')}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={increment}
                  style={{ paddingHorizontal: 12, height: '100%', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, color: DARK, fontWeight: '300' }}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#888', fontWeight: '500' }}>Total</Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: isBulk ? GOLD : DARK,
                  }}>
                  {formatINR(totalPrice, false)}
                </Text>
              </View>
            </View>

            {step > 1 && (
              <Text
                style={{
                  fontSize: 11,
                  color: '#888',
                  marginTop: -4,
                  marginBottom: 8,
                  textAlign: 'center',
                }}>
                Tap number to type quantity directly
              </Text>
            )}
          </>
        )}

        <Animated.View style={btnAnimStyle}>
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={buttonState === 'loading'}
            style={{
              backgroundColor:
                buttonState === 'success' || added ? '#34C759' : GOLD,
              borderRadius: 12,
              paddingVertical: 13,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
            <Animated.View className="absolute inset-0 rounded-lg bg-success" style={flashStyle} />
            {buttonState === 'loading' ? (
              <ActivityIndicator size="small" color={DARK} />
            ) : (
              <Ionicons
                name={buttonState === 'success' || added ? 'checkmark' : 'cart-outline'}
                size={18}
                color={buttonState === 'success' || added ? '#fff' : DARK}
              />
            )}
            <Text
              style={{
                fontSize: 14,
                fontWeight: '800',
                color: buttonState === 'success' || added ? '#fff' : DARK,
              }}>
              {buttonState === 'loading'
                ? 'Adding...'
                : buttonState === 'success' || added
                  ? 'Added to Cart ✓'
                  : t('addToCart')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
