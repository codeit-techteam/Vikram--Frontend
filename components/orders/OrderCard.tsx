import { memo, useCallback, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { OrderCardActions } from '@components/orders/OrderCardActions';
import { ActiveOrderProgress } from '@components/orders/OrderTimeline';
import { EnRouteBadge, OrderStatusBadge } from '@components/orders/OrderStatusBadge';
import { OrderProductPreview } from '@components/orders/OrderProducts';
import { ScaledPressable } from '@components/ScaledPressable';
import { STATUS_PROGRESS_INDEX } from '@constants/orderStatus';
import type { Order } from '@/types/order';
import { formatINR } from '@utils/formatCurrency';
import { formatDateKey } from '@utils/orderDateHelpers';
import { borderRadius, theme } from '@constants/theme';

interface OrderCardBaseProps {
  order: Order;
  index?: number;
  onPress?: (order: Order) => void;
  onReorder?: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
  isReordering?: boolean;
  isCancelling?: boolean;
}

function OrderCardShell({
  order,
  index = 0,
  onPress,
  children,
  footer,
}: OrderCardBaseProps & { children: ReactNode; footer?: ReactNode }) {
  const handlePress = useCallback(async () => {
    await Haptics.selectionAsync();
    onPress?.(order);
    router.push(`/orders/view/${order.id}`);
  }, [onPress, order]);

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(350).springify()}>
      <ScaledPressable
        onPress={handlePress}
        style={{
          marginHorizontal: 12,
          marginBottom: 12,
          borderRadius: borderRadius.xl,
          backgroundColor: theme.white,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 8,
          }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted }}>
            Order ID: {order.orderNumber}{' '}
            <Text style={{ color: '#BBB' }}>{formatDateKey(order.createdAt)}</Text>
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </View>
        {children}
        {footer}
      </ScaledPressable>
    </Animated.View>
  );
}

export const ActiveOrderCard = memo(function ActiveOrderCard(props: OrderCardBaseProps) {
  const { order } = props;
  const eta =
    order.tracking?.estimatedMinutes != null
      ? `Delivering in ${order.tracking.estimatedMinutes} mins`
      : order.tracking?.estimatedArrival
        ? `Arriving by ${order.tracking.estimatedArrival}`
        : order.expectedDelivery
          ? `Arriving by ${order.expectedDelivery}`
          : null;

  const progressIndex = STATUS_PROGRESS_INDEX[order.status] ?? 0;

  return (
    <OrderCardShell
      {...props}
      footer={
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <ScaledPressable
            onPress={async () => {
              await Haptics.selectionAsync();
              router.push(`/orders/details/${order.id}`);
            }}
            style={{
              backgroundColor: theme.primary,
              borderRadius: borderRadius.md,
              paddingVertical: 12,
              alignItems: 'center',
              marginTop: 8,
            }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textPrimary }}>
              Track Order
            </Text>
          </ScaledPressable>
        </View>
      }>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            {eta ? (
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textPrimary }}>{eta}</Text>
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
                Order in progress
              </Text>
            )}
          </View>
          {order.status === 'out_for_delivery' ? <EnRouteBadge /> : <OrderStatusBadge status={order.status} compact />}
        </View>
        <ActiveOrderProgress currentIndex={progressIndex} />
        <View style={{ marginTop: 12 }}>
          <OrderProductPreview products={order.products} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#F5F5F5',
          }}>
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>
            {order.products.length} item{order.products.length > 1 ? 's' : ''}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
            {formatINR(order.grandTotal, false)}
          </Text>
        </View>
      </View>
    </OrderCardShell>
  );
});

export const DeliveredOrderCard = memo(function DeliveredOrderCard(props: OrderCardBaseProps) {
  const { order } = props;
  const deliveredDate = order.deliveredAt
    ? formatDateKey(order.deliveredAt)
    : order.expectedDelivery;

  return (
    <OrderCardShell
      {...props}
      footer={
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {order.refund?.status === 'credited' ? (
            <View
              style={{
                backgroundColor: '#E8F5E9',
                borderRadius: borderRadius.md,
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={{ fontSize: 13, color: '#2E7D32', fontWeight: '600', flex: 1 }}>
                Refund credited
              </Text>
              <Text style={{ fontSize: 13, color: '#2E7D32', fontWeight: '700' }}>
                ₹{order.refund.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          ) : null}
          <OrderCardActions {...props} />
        </View>
      }>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>Delivered</Text>
            {deliveredDate ? (
              <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
                On {deliveredDate}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {order.deliveredEarly ? (
              <View
                style={{
                  backgroundColor: '#E8F5E9',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: borderRadius.full,
                }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#34C759' }}>Early</Text>
              </View>
            ) : null}
            <OrderStatusBadge status="delivered" compact />
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <OrderProductPreview products={order.products} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#F5F5F5',
          }}>
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>
            {order.products.length} item{order.products.length > 1 ? 's' : ''}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
            {formatINR(order.grandTotal, false)}
          </Text>
        </View>
      </View>
    </OrderCardShell>
  );
});

export const CancelledOrderCard = memo(function CancelledOrderCard(props: OrderCardBaseProps) {
  const { order } = props;

  return (
    <OrderCardShell
      {...props}
      footer={
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <OrderCardActions {...props} />
        </View>
      }>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
              {order.status === 'payment_failed' ? 'Payment Failed' : 'Cancelled'}
            </Text>
            {order.cancellationReason ? (
              <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }} numberOfLines={2}>
                {order.cancellationReason}
              </Text>
            ) : null}
          </View>
          <OrderStatusBadge status={order.status} compact />
        </View>
        {order.refund ? (
          <View
            style={{
              marginTop: 10,
              backgroundColor: theme.ultraLightGray,
              borderRadius: borderRadius.md,
              padding: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <Text style={{ fontSize: 13, color: theme.textSecondary }}>
              Refund: {order.refund.status}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>
              ₹{order.refund.amount.toLocaleString('en-IN')}
            </Text>
          </View>
        ) : null}
        <View style={{ marginTop: 12 }}>
          <OrderProductPreview products={order.products} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#F5F5F5',
          }}>
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>
            {order.products.length} item{order.products.length > 1 ? 's' : ''}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
            {formatINR(order.grandTotal, false)}
          </Text>
        </View>
      </View>
    </OrderCardShell>
  );
});

export const DefaultOrderCard = memo(function DefaultOrderCard(props: OrderCardBaseProps) {
  const { order } = props;

  return (
    <OrderCardShell
      {...props}
      footer={
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <OrderCardActions {...props} />
        </View>
      }>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
              {order.expectedDelivery ? `Expected: ${order.expectedDelivery}` : 'Processing'}
            </Text>
          </View>
          <OrderStatusBadge status={order.status} compact />
        </View>
        <View style={{ marginTop: 12 }}>
          <OrderProductPreview products={order.products} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#F5F5F5',
          }}>
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>
            {order.products.length} item{order.products.length > 1 ? 's' : ''}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
            {formatINR(order.grandTotal, false)}
          </Text>
        </View>
      </View>
    </OrderCardShell>
  );
});

export const OrderCard = memo(function OrderCard(props: OrderCardBaseProps) {
  const { order } = props;

  if (
    order.status === 'out_for_delivery' ||
    order.status === 'ready_for_dispatch' ||
    (order.status === 'processing' && order.tracking)
  ) {
    return <ActiveOrderCard {...props} />;
  }

  if (order.status === 'delivered' || order.status === 'refunded') {
    return <DeliveredOrderCard {...props} />;
  }

  if (order.status === 'cancelled' || order.status === 'payment_failed') {
    return <CancelledOrderCard {...props} />;
  }

  return <DefaultOrderCard {...props} />;
});
