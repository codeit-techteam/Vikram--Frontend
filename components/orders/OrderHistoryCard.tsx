import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { OrderItemRow } from '@components/orders/OrderItemRow';
import type { Order, OrderStatus } from '@store/orderStore';
import { formatDeliveredDate } from '@utils/orderDateHelpers';

interface OrderHistoryCardProps {
  order: Order;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  processing: { label: 'Processing', color: '#1A73E8', bg: '#E3F2FD' },
  packed: { label: 'Packed', color: '#1A73E8', bg: '#E3F2FD' },
  dispatched: { label: 'Dispatched', color: '#FF9500', bg: '#FFF3E0' },
  in_transit: { label: 'Out for Delivery', color: '#FF9500', bg: '#FFF3E0' },
  delivered: { label: 'Delivered', color: '#34C759', bg: '#E8F5E9' },
  cancelled: { label: 'Cancelled', color: '#FF3B30', bg: '#FFEBEE' },
};

function getDisplayItems(order: Order) {
  if (order.items.length > 0) return order.items;
  return [
    {
      id: order.id,
      name: order.productName,
      description: order.description,
      image: order.imageSearch,
      unitPrice: order.price,
      bulkPrice: order.price,
      bulkThreshold: 9999,
      quantity: 1,
      unit: order.unit,
    },
  ];
}

export function OrderHistoryCard({ order }: OrderHistoryCardProps) {
  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.processing;
  const items = getDisplayItems(order);
  const isEarlyDelivery = order.deliveredEarly;
  const eta = order.eta ?? order.arrivingBy;
  const estimatedDelivery = order.estimatedDelivery ?? order.deliveryETA;

  const handleCardPress = async () => {
    await Haptics.selectionAsync();
    router.push(`/orders/view/${order.id}`);
  };

  return (
    <ScaledPressable
      onPress={handleCardPress}
      style={{
        backgroundColor: '#FFFFFF',
        marginHorizontal: 12,
        marginBottom: 3,
        overflow: 'hidden',
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#F5F5F5',
        }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1A1A' }}>
            {config.label}
          </Text>
          {order.status === 'delivered' && (
            <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
              On {formatDeliveredDate(order.deliveredAt ?? order.createdAt)}
            </Text>
          )}
          {order.status === 'in_transit' && eta ? (
            <Text
              style={{
                fontSize: 13,
                color: '#FEB623',
                marginTop: 2,
                fontWeight: '600',
              }}>
              Arriving by {eta}
            </Text>
          ) : null}
          {order.status === 'processing' && estimatedDelivery ? (
            <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
              Estimated: {estimatedDelivery}
            </Text>
          ) : null}
        </View>

        {isEarlyDelivery ? (
          <View
            style={{
              backgroundColor: '#E8F5E9',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
            }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#34C759' }}>
              Early Delivery
            </Text>
          </View>
        ) : null}
        {!isEarlyDelivery && order.status === 'in_transit' ? (
          <View
            style={{
              backgroundColor: '#FFF4D1',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
            }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FEB623' }}>
              En Route
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {items.map((item, index) => (
          <View key={`${order.id}-${item.id}-${index}`}>
            <OrderItemRow item={item} />
            {index < items.length - 1 ? (
              <View
                style={{
                  height: 1,
                  backgroundColor: '#F5F5F5',
                  marginLeft: 74,
                }}
              />
            ) : null}
          </View>
        ))}
      </View>

      {order.refundAmount ? (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 14,
            marginTop: 4,
            backgroundColor: '#E8F5E9',
            borderRadius: 8,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
          <Ionicons name="checkmark-circle" size={16} color="#34C759" />
          <Text
            style={{
              fontSize: 13,
              color: '#2E7D32',
              fontWeight: '600',
              flex: 1,
            }}>
            Refund credited
          </Text>
          <Text style={{ fontSize: 13, color: '#2E7D32', fontWeight: '700' }}>
            ₹{order.refundAmount.toLocaleString('en-IN')}
          </Text>
        </View>
      ) : null}
    </ScaledPressable>
  );
}
