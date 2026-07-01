import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { CartItemImage } from '@components/cart/CartItemImage';
import { getCategoryIdForProduct, getProductById } from '@constants/catalogData';
import type { CartItem } from '@store/cartStore';
import { resolveCartProductId } from '@utils/cartHelpers';

interface OrderItemRowProps {
  item: CartItem;
}

export function OrderItemRow({ item }: OrderItemRowProps) {
  const productId = resolveCartProductId(item);
  const product = getProductById(productId);
  const spec = item.description || product?.description;

  const handlePress = async () => {
    await Haptics.selectionAsync();
    router.push({
      pathname: '/products/detail/[productId]',
      params: {
        productId,
        categoryId: getCategoryIdForProduct(productId) ?? '',
        categoryName: product?.category ?? product?.categoryType ?? '',
        productName: product?.detailName ?? product?.name ?? item.productName ?? item.name,
      },
    } as Href);
  };

  return (
    <ScaledPressable
      onPress={handlePress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 14,
      }}>
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 8,
          backgroundColor: '#F5F5F5',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#F0F0F0',
        }}>
        <CartItemImage item={item} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#1A1A1A',
            lineHeight: 19,
          }}
          numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 13, color: '#888', marginTop: 3 }}>
          {item.quantity} {item.unit}
          {spec ? ` • ${spec}` : ''}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#CCC" />
    </ScaledPressable>
  );
}
