import type { StyleProp, ViewStyle } from 'react-native';

import { ProductImage } from '@components/product/ProductImage';
import { getCartItemImageSource } from '@utils/cartHelpers';
import type { CartItem } from '@store/cartStore';

interface CartItemImageProps {
  item: CartItem;
  style?: StyleProp<ViewStyle>;
  /** @deprecated Always contain — kept for call-site compatibility. */
  contentFit?: 'cover' | 'contain';
  size?: number;
  padding?: number;
  borderRadius?: number;
  showSkeleton?: boolean;
}

export function CartItemImage({
  item,
  style,
  size,
  padding = 10,
  borderRadius = 12,
  showSkeleton = true,
}: CartItemImageProps) {
  const source = getCartItemImageSource(item);

  return (
    <ProductImage
      source={source}
      size={size ?? 'fill'}
      padding={padding}
      borderRadius={borderRadius}
      backgroundColor="#FFFFFF"
      showSkeleton={showSkeleton}
      recyclingKey={item.productId ?? item.id}
      style={style}
      accessibilityLabel={item.productName ?? item.name}
    />
  );
}
