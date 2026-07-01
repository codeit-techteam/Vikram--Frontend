import type { ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { getCartItemImageSource } from '@utils/cartHelpers';
import type { CartItem } from '@store/cartStore';

interface CartItemImageProps {
  item: CartItem;
  style?: object;
  contentFit?: 'cover' | 'contain';
}

export function CartItemImage({
  item,
  style,
  contentFit = 'cover',
}: CartItemImageProps) {
  const source = getCartItemImageSource(item);

  if (!source) {
    return (
      <View style={[styles.placeholder, style]}>
        <Ionicons name="image-outline" size={28} color="#AAA" />
        <Text style={styles.placeholderText}>No Product Image</Text>
      </View>
    );
  }

  return <Image source={source as ImageSourcePropType} style={style} contentFit={contentFit} />;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeholderText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
});
