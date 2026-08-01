import { memo, useCallback } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';
import { CartItemImage } from '@components/cart/CartItemImage';
import type { OrderProduct } from '@/types/order';
import type { CartItem } from '@store/cartStore';
import { borderRadius, theme } from '@constants/theme';

interface OrderProductPreviewProps {
  products: OrderProduct[];
  maxVisible?: number;
  onProductPress?: (product: OrderProduct) => void;
}

function toCartItem(product: OrderProduct): CartItem {
  return {
    id: product.id,
    productId: product.productId,
    name: product.name,
    productName: product.name,
    brand: product.brand,
    category: product.category,
    description: product.variant ?? '',
    image: product.image ?? product.imageSearch ?? '',
    imageSearch: product.imageSearch ?? product.image,
    unitPrice: product.unitPrice,
    bulkPrice: product.unitPrice,
    bulkThreshold: 9999,
    quantity: product.quantity,
    unit: product.unit,
    variantLabel: product.variant,
  };
}

export const OrderProductPreview = memo(function OrderProductPreview({
  products,
  maxVisible = 2,
  onProductPress,
}: OrderProductPreviewProps) {
  const visible = products.slice(0, maxVisible);
  const remaining = products.length - maxVisible;

  return (
    <View>
      {visible.map((product, index) => (
        <View key={product.id}>
          <ScaledPressable
            onPress={() => onProductPress?.(product)}
            disabled={!onProductPress}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              gap: 12,
            }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: borderRadius.md,
                overflow: 'hidden',
                backgroundColor: theme.ultraLightGray,
                borderWidth: 1,
                borderColor: '#F0F0F0',
              }}>
              <CartItemImage
                item={toCartItem(product)}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={2}
                style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary }}>
                {product.name}
              </Text>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
                {product.quantity} {product.unit}
                {product.variant ? ` • ${product.variant}` : ''}
              </Text>
            </View>
            {onProductPress ? <Ionicons name="chevron-forward" size={18} color="#CCC" /> : null}
          </ScaledPressable>
          {index < visible.length - 1 ? (
            <View style={{ height: 1, backgroundColor: '#F5F5F5', marginLeft: 68 }} />
          ) : null}
        </View>
      ))}
      {remaining > 0 ? (
        <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '600', marginTop: 4 }}>
          +{remaining} more item{remaining > 1 ? 's' : ''}
        </Text>
      ) : null}
    </View>
  );
});

interface OrderProductThumbnailsProps {
  products: OrderProduct[];
  max?: number;
}

export const OrderProductThumbnails = memo(function OrderProductThumbnails({
  products,
  max = 4,
}: OrderProductThumbnailsProps) {
  const visible = products.slice(0, max);

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {visible.map((product) => (
        <View
          key={product.id}
          style={{
            width: 44,
            height: 44,
            borderRadius: borderRadius.md,
            overflow: 'hidden',
            backgroundColor: theme.ultraLightGray,
          }}>
          <CartItemImage
            item={toCartItem(product)}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </View>
      ))}
    </View>
  );
});

export const OrderProducts = memo(function OrderProducts({
  products,
}: {
  products: OrderProduct[];
}) {
  const renderProduct = useCallback(
    (product: OrderProduct) => (
      <View
        key={product.id}
        style={{
          marginBottom: 12,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.white,
          overflow: 'hidden',
        }}>
        <View style={{ flexDirection: 'row', padding: 14, gap: 12 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: borderRadius.md,
              overflow: 'hidden',
              backgroundColor: theme.ultraLightGray,
            }}>
            <CartItemImage
              item={toCartItem(product)}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text
                numberOfLines={2}
                style={{ flex: 1, fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
                {product.name}
              </Text>
              {product.delivered ? (
                <View
                  style={{
                    backgroundColor: '#E8F5E9',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: borderRadius.full,
                    alignSelf: 'flex-start',
                  }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#2E7D32' }}>
                    Delivered
                  </Text>
                </View>
              ) : null}
            </View>
            {product.brand ? (
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                {product.brand}
              </Text>
            ) : null}
            {product.sku ? (
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                SKU: {product.sku}
              </Text>
            ) : null}
            {product.variant ? (
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                {product.variant}
              </Text>
            ) : null}
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 6 }}>
              Qty: {product.quantity} {product.unit}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 8,
              }}>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                Unit: ₹{product.unitPrice.toLocaleString('en-IN')}
                {product.gst != null ? ` · GST ${product.gst}%` : ''}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.primary }}>
                ₹{product.totalPrice.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    ),
    [],
  );

  return <View>{products.map(renderProduct)}</View>;
});

export function RefundBanner({ amount }: { amount: number }) {
  return (
    <View
      style={{
        backgroundColor: '#E8F5E9',
        borderRadius: borderRadius.md,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
      }}>
      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
      <Text style={{ fontSize: 13, color: '#2E7D32', fontWeight: '600', flex: 1 }}>
        Refund credited
      </Text>
      <Text style={{ fontSize: 13, color: '#2E7D32', fontWeight: '700' }}>
        ₹{amount.toLocaleString('en-IN')}
      </Text>
    </View>
  );
}
