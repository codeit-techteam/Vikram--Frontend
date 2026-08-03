import { memo, useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BackHeader } from '@components/BackHeader';
import { CurrentStatusCard } from '@components/orders/CurrentStatusCard';
import { DeliveryOtpSheet } from '@components/orders/DeliveryOtpSheet';
import { OrderDetailSkeleton } from '@components/orders/OrderSkeleton';
import { OrderTimeline } from '@components/orders/OrderTimeline';
import { OrderStatusBadge } from '@components/orders/OrderStatusBadge';
import { PriceSummary } from '@components/orders/PriceSummary';
import { OrderProducts } from '@components/orders/OrderProducts';
import { ScaledPressable } from '@components/ScaledPressable';
import { useOrder } from '@hooks/useOrder';
import { safeGoBack } from '@utils/navigation';
import { formatDateKey } from '@utils/orderDateHelpers';
import {
  buildCustomerTimeline,
  getCustomerStatusLabel,
  shouldShowDeliveryOtp,
} from '@utils/customerOrderStatus';
import { theme, borderRadius } from '@constants/theme';

function formatDeliveredLabel(deliveredAt?: string) {
  if (!deliveredAt) return null;
  const date = new Date(deliveredAt);
  if (Number.isNaN(date.getTime())) return formatDateKey(deliveredAt);
  const day = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${day}  ·  ${time}`;
}

export const TrackingScreen = memo(function TrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { order, isLoading: orderLoading } = useOrder(orderId);
  const [otpDismissed, setOtpDismissed] = useState(false);

  const handleViewDetails = useCallback(async () => {
    await Haptics.selectionAsync();
    if (!orderId) return;
    router.push(`/orders/view/${orderId}`);
  }, [orderId]);

  const showOtp =
    order != null &&
    !otpDismissed &&
    shouldShowDeliveryOtp(order) &&
    order.status === 'out_for_delivery';

  useEffect(() => {
    // Re-open sheet if a new OTP cycle starts after dismiss.
    if (order?.deliveryOtpVerified) {
      setOtpDismissed(true);
    }
  }, [order?.deliveryOtpVerified]);

  if (orderLoading && !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }} edges={['top']}>
        <BackHeader title="Track Order" onBack={() => safeGoBack('/(tabs)/orders')} />
        <OrderDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bgMain }}
        edges={['top']}>
        <Text style={{ color: theme.textSecondary }}>Order not found</Text>
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/orders')} style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '700', color: theme.primary }}>Go Back</Text>
        </ScaledPressable>
      </SafeAreaView>
    );
  }

  const isDelivered = order.status === 'delivered' || order.status === 'refunded';
  const isCancelled = order.status === 'cancelled' || order.status === 'payment_failed';
  const statusLabel = getCustomerStatusLabel(order.status);
  const etaSource =
    order.expectedDelivery ??
    order.tracking?.estimatedArrival ??
    (order.tracking?.estimatedMinutes != null
      ? `in ${order.tracking.estimatedMinutes} mins`
      : undefined);
  const partnerAssigned = Boolean(order.driver?.name || order.tracking?.driver?.name);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }} edges={['top']}>
      <BackHeader
        title={isDelivered ? 'Order Delivered' : 'Track Order'}
        onBack={() => safeGoBack('/(tabs)/orders')}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.white,
            padding: 16,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
            }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>
                Order #{order.orderNumber}
              </Text>
              {!isDelivered && !isCancelled && etaSource ? (
                <>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }}>
                    Estimated Delivery
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '800',
                      color: theme.textPrimary,
                      marginTop: 2,
                    }}>
                    {etaSource}
                  </Text>
                </>
              ) : (
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '800',
                    color: theme.textPrimary,
                    marginTop: 4,
                  }}>
                  {statusLabel}
                </Text>
              )}
            </View>
            <OrderStatusBadge status={order.status} compact />
          </View>
        </Animated.View>

        <CurrentStatusCard
          status={order.status}
          estimatedMinutes={order.tracking?.estimatedMinutes}
          estimatedArrival={order.expectedDelivery ?? order.tracking?.estimatedArrival}
          partnerAssigned={partnerAssigned}
          isDelivered={isDelivered}
          deliveredAtLabel={formatDeliveredLabel(order.deliveredAt)}
        />

        <OrderTimeline
          steps={buildCustomerTimeline(order.status, {
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt,
          })}
        />

        <View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '800',
              color: theme.textPrimary,
              marginBottom: 12,
            }}>
            Products ({order.products.length})
          </Text>
          <OrderProducts products={order.products} />
        </View>

        <PriceSummary
          subtotal={order.subtotal}
          gst={order.gst}
          discount={order.discount}
          couponDiscount={order.couponDiscount}
          deliveryCharge={order.deliveryCharge}
          platformFee={0}
          grandTotal={order.grandTotal}
          savings={order.savings}
        />

        <View style={{ gap: 10 }}>
          <ScaledPressable
            onPress={handleViewDetails}
            style={{
              borderRadius: borderRadius.md,
              paddingVertical: 14,
              alignItems: 'center',
              backgroundColor: theme.primary,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
              View Order Details
            </Text>
          </ScaledPressable>
          <ScaledPressable
            onPress={() => router.push('/support')}
            style={{
              borderRadius: borderRadius.md,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: theme.primary,
              backgroundColor: theme.white,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.primary }}>
              Need Help
            </Text>
          </ScaledPressable>
        </View>
      </ScrollView>

      <DeliveryOtpSheet
        visible={showOtp}
        otp={order.deliveryOtp}
        onClose={() => setOtpDismissed(true)}
      />
    </SafeAreaView>
  );
});

export default TrackingScreen;
