import { useState } from 'react';
import { Text, View } from 'react-native';
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
import { productToCartItem } from '@utils/cartHelpers';

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
  const [quantity, setQuantity] = useState(product.defaultQuantity);
  const [addedFlash, setAddedFlash] = useState(false);
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

  const handleAddToCart = async () => {
    btnScale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 12 }),
    );
    flashOpacity.value = withSequence(withTiming(1, { duration: 100 }), withTiming(0, { duration: 400 }));

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    addItem(productToCartItem(product, quantity));

    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 500);
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
          style={{ backgroundColor: product.badgeColor ?? '#FEB623' }}>
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

        <View className="mt-4 border-t border-border pt-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-text-secondary">{t('retailPrice')}</Text>
            <Text className="text-sm font-semibold text-text">{product.retailPrice}</Text>
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-primary">{product.bulkLabel}</Text>
            <Text className="text-base font-bold text-primary">{product.bulkPrice}</Text>
          </View>
        </View>

        <View className="mt-4 flex-row items-center gap-3">
          <View className="flex-row items-center rounded-lg bg-timer px-1 py-1">
            <ScaledPressable
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-8 w-8 items-center justify-center">
              <Text className="text-lg font-bold text-primary">−</Text>
            </ScaledPressable>
            <Text className="min-w-[40px] text-center text-base font-bold text-text">
              {quantity}
            </Text>
            <ScaledPressable
              onPress={() => setQuantity((q) => q + 1)}
              className="h-8 w-8 items-center justify-center">
              <Text className="text-lg font-bold text-primary">+</Text>
            </ScaledPressable>
          </View>

          <Animated.View style={[{ flex: 1 }, btnAnimStyle]}>
            <ScaledPressable
              onPress={handleAddToCart}
              className={`relative flex-row items-center justify-center rounded-lg py-3 ${
                addedFlash ? 'bg-success' : 'bg-primary'
              }`}>
              <Animated.View
                className="absolute inset-0 rounded-lg bg-success"
                style={flashStyle}
              />
              <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
              <Text className="ml-2 text-xs font-bold text-onPrimary">{t('addToCart')}</Text>
            </ScaledPressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
