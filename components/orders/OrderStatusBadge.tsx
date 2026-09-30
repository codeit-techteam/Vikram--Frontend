import { memo } from 'react';
import { Text } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { ORDER_STATUS_BADGES } from '@constants/orderStatus';
import { theme } from '@constants/theme';
import { getCustomerStatusLabel } from '@utils/customerOrderStatus';
import type { OrderStatus } from '@/types/order';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  /** Ignored — customer labels are always derived from status. */
  label?: string;
  compact?: boolean;
}

export const OrderStatusBadge = memo(function OrderStatusBadge({
  status,
  compact = false,
}: OrderStatusBadgeProps) {
  const config = ORDER_STATUS_BADGES[status] ?? ORDER_STATUS_BADGES.processing;
  const displayLabel = getCustomerStatusLabel(status);

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

const PAYMENT_BADGE_COLORS = {
  pending: { backgroundColor: theme.primaryLight, color: theme.primaryDark },
  failed: { backgroundColor: '#FFEBEE', color: '#C62828' },
} as const;

/** Unpaid online order: not confirmed yet, so no lifecycle badge applies. */
export function PaymentPendingBadge({ failed = false }: { failed?: boolean }) {
  const colors = PAYMENT_BADGE_COLORS[failed ? 'failed' : 'pending'];
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={{
        backgroundColor: colors.backgroundColor,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
      }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.color }}>
        {failed ? 'Payment Failed' : 'Payment Pending'}
      </Text>
    </Animated.View>
  );
}

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
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#E5A01F' }}>En Route</Text>
    </Animated.View>
  );
}
