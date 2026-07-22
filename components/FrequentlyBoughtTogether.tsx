import { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AddToCartButton, getAddToCartMode } from '@components/product/AddToCartButton';
import { ProductQuantitySelector } from '@components/product/ProductQuantitySelector';
import { ScaledPressable } from '@components/ScaledPressable';
import { getProductById } from '@constants/catalogData';
import type { FrequentlyBoughtItem } from '@/types/catalog';
import { useCartFeedbackStore } from '@store/cartFeedbackStore';
import { useCartStore } from '@store/cartStore';
import { useTranslation } from '@store/languageStore';
import { frequentItemToCartItem } from '@utils/cartHelpers';
import { resolveProductImageSource } from '@utils/catalogPlaceholders';

const CARD_WIDTH = Dimensions.get('window').width * 0.55;

interface FrequentlyBoughtTogetherProps {
  items: FrequentlyBoughtItem[];
}

function FbtCard({ item }: { item: FrequentlyBoughtItem }) {
  const upsertItem = useCartStore((s) => s.upsertItem);
  const showFeedback = useCartFeedbackStore((s) => s.showFeedback);
  const cartQty = useCartStore(
    (s) => s.items.find((i) => i.id === item.id || i.productId === item.id)?.quantity ?? 0,
  );
  const [localQty, setLocalQty] = useState(Math.max(1, cartQty || 1));
  const [loading, setLoading] = useState(false);
  const catalogProduct = getProductById(item.id);
  const mode = getAddToCartMode(localQty, cartQty);

  useEffect(() => {
    if (cartQty > 0) setLocalQty(cartQty);
  }, [cartQty]);

  const handleAdd = async () => {
    setLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const outcome = upsertItem({ ...frequentItemToCartItem(item), quantity: localQty });
    showFeedback({ outcome });
    setLoading(false);
  };

  return (
    <View style={{ width: CARD_WIDTH }} className="rounded-card border border-border bg-surface p-3">
      <Image
        source={resolveProductImageSource({
          imageUrl: item.imageSearch,
          productSlug: item.id,
        })}
        style={{ width: '100%', height: 120, borderRadius: 8 }}
        contentFit="cover"
        recyclingKey={item.id}
      />
      <Text className="mt-2 text-sm font-bold text-text" numberOfLines={1}>
        {catalogProduct?.name ?? item.name}
      </Text>
      <Text className="mt-0.5 text-xs text-text-secondary" numberOfLines={2}>
        {item.desc}
      </Text>
      <Text className="mt-2 text-sm font-bold text-primary">{item.price}</Text>
      <View className="mt-2 gap-2">
        <ProductQuantitySelector quantity={localQty} onChange={setLocalQty} size="sm" />
        <AddToCartButton
          mode={mode}
          onPress={() => void handleAdd()}
          loading={loading}
          compact
          fullWidth
        />
      </View>
    </View>
  );
}

export function FrequentlyBoughtTogether({ items }: FrequentlyBoughtTogetherProps) {
  const { t } = useTranslation();
  const listRef = useRef<FlatList>(null);

  const scroll = (direction: 'left' | 'right') => {
    listRef.current?.scrollToOffset({
      offset: direction === 'left' ? 0 : CARD_WIDTH * 2,
      animated: true,
    });
  };

  return (
    <View className="mt-8">
      <View className="mb-3 flex-row items-center justify-between px-4">
        <Text className="text-base font-bold text-text">{t('frequentlyBought')}</Text>
        <View className="flex-row gap-2">
          <ScaledPressable
            onPress={() => scroll('left')}
            className="h-8 w-8 items-center justify-center rounded-full border border-border">
            <Ionicons name="chevron-back" size={16} color="#666666" />
          </ScaledPressable>
          <ScaledPressable
            onPress={() => scroll('right')}
            className="h-8 w-8 items-center justify-center rounded-full border border-border">
            <Ionicons name="chevron-forward" size={16} color="#666666" />
          </ScaledPressable>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={items}
        horizontal
        pagingEnabled
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FbtCard item={item} />}
      />
    </View>
  );
}
