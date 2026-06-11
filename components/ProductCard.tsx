import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
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
import type { Product } from '@/types/catalog';
import { useCartStore } from '@store/cartStore';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { formatINR } from '@utils/formatCurrency';
import { productToCartItem } from '@utils/cartHelpers';

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
  const [quantity, setQuantity] = useState(0);
  const [added, setAdded] = useState(false);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const btnScale = useSharedValue(1);
  const flashOpacity = useSharedValue(0);

  const displayName =
    language === 'hi' && product.nameHi ? product.nameHi : product.name;
  const detailName =
    language === 'hi' && product.nameHi
      ? product.nameHi
      : (product.detailName ?? product.name);

  const statusColors = getStatusColors(product.status);
  const isBulk = quantity >= product.bulkThreshold;
  const unitPrice = isBulk ? product.bulkPriceValue : product.retailPriceValue;
  const totalPrice = quantity * unitPrice;
  const minOrder = product.minOrder ?? 1;
  const step = product.incrementStep ?? 1;
  const canAddToCart = quantity >= minOrder;

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

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
    setQuantity((q) => (q === 0 ? minOrder : q + step));
    Haptics.selectionAsync();
  };

  const decrement = () => {
    setQuantity((q) => (q <= minOrder ? 0 : q - step));
    Haptics.selectionAsync();
  };

  const handleQuantityBlur = () => {
    setIsEditingQty(false);
  };

  const handleAddToCart = async () => {
    if (!canAddToCart) return;

    btnScale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 12 }),
    );
    flashOpacity.value = withSequence(withTiming(1, { duration: 100 }), withTiming(0, { duration: 400 }));

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    addItem(productToCartItem(product, quantity));

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

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
        <ScaledPressable className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full bg-surface/90">
          <Ionicons name="heart-outline" size={18} color="#666666" />
        </ScaledPressable>
      </ScaledPressable>

      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <Text className="text-[10px] font-semibold tracking-wider text-text-secondary">
            {product.category}
          </Text>
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
          <Text className="text-xs text-text-secondary">• {product.spec}</Text>
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
                    if (!Number.isNaN(num) && num >= 0) setQuantity(num);
                    if (val === '') setQuantity(0);
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
            {isBulk && quantity > 0 && (
              <Text style={{ fontSize: 10, color: GOLD, fontWeight: '600' }}>
                Bulk price applied ✓
              </Text>
            )}
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

        <Animated.View style={btnAnimStyle}>
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={!canAddToCart}
            style={{
              backgroundColor: added ? '#34C759' : canAddToCart ? GOLD : '#E0E0E0',
              borderRadius: 12,
              paddingVertical: 13,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
            <Animated.View
              className="absolute inset-0 rounded-lg bg-success"
              style={flashStyle}
            />
            <Ionicons
              name={added ? 'checkmark' : 'cart-outline'}
              size={18}
              color={added ? '#fff' : canAddToCart ? DARK : '#AAA'}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '800',
                color: added ? '#fff' : canAddToCart ? DARK : '#AAA',
              }}>
              {added ? 'Added to Cart ✓' : t('addToCart')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
