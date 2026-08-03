import { useCallback, useRef } from 'react';
import { Dimensions, FlatList, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { QuantityControls } from '@components/QuantityControls';
import { ScaledPressable } from '@components/ScaledPressable';
import { getProductById } from '@constants/catalogData';
import type { FrequentlyBoughtItem } from '@/types/catalog';
import { useCartFeedbackStore } from '@store/cartFeedbackStore';
import { useCartStore } from '@store/cartStore';
import { useTranslation } from '@store/languageStore';
import { useVariantStore } from '@store/variantStore';
import { frequentItemToCartItem } from '@utils/cartHelpers';
import { resolveProductImageSource } from '@utils/catalogPlaceholders';

const CARD_WIDTH = Dimensions.get('window').width * 0.55;

interface FrequentlyBoughtTogetherProps {
  items: FrequentlyBoughtItem[];
}

function FbtCard({ item }: { item: FrequentlyBoughtItem }) {
  const openSheet = useVariantStore((s) => s.open);
  const upsertItem = useCartStore((s) => s.upsertItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const showFeedback = useCartFeedbackStore((s) => s.showFeedback);
  const catalogProduct = getProductById(item.id);

  const cartQty = useCartStore(
    (s) => s.items.find((i) => i.id === item.id || i.productId === item.id)?.quantity ?? 0,
  );

  const handleAdd = useCallback(() => {
    if (catalogProduct) {
      openSheet(catalogProduct);
      return;
    }
    void (async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const outcome = upsertItem({ ...frequentItemToCartItem(item), quantity: 1 });
      showFeedback({ outcome });
    })();
  }, [catalogProduct, item, openSheet, showFeedback, upsertItem]);

  const handleIncrement = useCallback(() => {
    if (catalogProduct) {
      openSheet(catalogProduct);
      return;
    }
    updateQuantity(item.id, cartQty + 1);
  }, [cartQty, catalogProduct, item.id, openSheet, updateQuantity]);

  const handleDecrement = useCallback(() => {
    const next = cartQty - 1;
    updateQuantity(item.id, next < 1 ? 0 : next);
  }, [cartQty, item.id, updateQuantity]);

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
      <View className="mt-2 items-end">
        <QuantityControls
          quantity={cartQty}
          onAdd={handleAdd}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          addLabel="ADD"
          size="sm"
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
