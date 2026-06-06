import { useRef } from 'react';
import { Dimensions, FlatList, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { getProductImageUrl } from '@constants/catalogData';
import type { FrequentlyBoughtItem } from '@/types/catalog';
import { useCartStore } from '@store/cartStore';
import { useTranslation } from '@store/languageStore';
import { frequentItemToCartItem } from '@utils/cartHelpers';

const CARD_WIDTH = Dimensions.get('window').width * 0.55;

interface FrequentlyBoughtTogetherProps {
  items: FrequentlyBoughtItem[];
}

export function FrequentlyBoughtTogether({ items }: FrequentlyBoughtTogetherProps) {
  const { t } = useTranslation();
  const listRef = useRef<FlatList>(null);
  const addItem = useCartStore((s) => s.addItem);

  const scroll = (direction: 'left' | 'right') => {
    listRef.current?.scrollToOffset({
      offset: direction === 'left' ? 0 : CARD_WIDTH * 2,
      animated: true,
    });
  };

  const handleAdd = async (item: FrequentlyBoughtItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem(frequentItemToCartItem(item));
  };

  return (
    <View className="mt-8">
      <View className="mb-3 flex-row items-center justify-between px-5">
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
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{ width: CARD_WIDTH }}
            className="rounded-card border border-border bg-surface p-3">
            <Image
              source={{ uri: getProductImageUrl(item.imageSearch, '240x240') }}
              style={{ width: '100%', height: 120, borderRadius: 8 }}
              contentFit="cover"
            />
            <Text className="mt-2 text-sm font-bold text-text" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="mt-0.5 text-xs text-text-secondary" numberOfLines={2}>
              {item.desc}
            </Text>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm font-bold text-primary">{item.price}</Text>
              <ScaledPressable
                onPress={() => handleAdd(item)}
                className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
              </ScaledPressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}
