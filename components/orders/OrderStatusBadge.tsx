import { memo } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { ORDER_STATUS_BADGES } from '@constants/orderStatus';
import type { OrderStatus } from '@/types/order';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  /** Prefer backend statusLabel when present */
  label?: string;
  compact?: boolean;
}

export const OrderStatusBadge = memo(function OrderStatusBadge({
  status,
  label,
  compact = false,
}: OrderStatusBadgeProps) {
  const config = ORDER_STATUS_BADGES[status] ?? ORDER_STATUS_BADGES.processing;
  const displayLabel = label?.trim() || config.label;

  return (
    <Animated.View
      entering={ZoomIn.duration(250).springify()}
      style={{
        backgroundColor: config.backgroundColor,
        paddingHorizontal: compact ? 8 : 10,
        paddingVertical: compact ? 3 : 4,
        borderRadius: 20,
      }}>
      <Text
        style={{
          fontSize: compact ? 10 : 12,
          fontWeight: '700',
          color: config.color,
        }}>
        {displayLabel}
      </Text>
    </Animated.View>
  );
});

export function EarlyDeliveryBadge() {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={{
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
      }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#34C759' }}>Early Delivery</Text>
    </Animated.View>
  );
}

export function EnRouteBadge() {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={{
        backgroundColor: '#FFF4D1',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
      }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#FEB623' }}>En Route</Text>
    </Animated.View>
  );
}
