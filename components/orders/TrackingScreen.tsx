import { memo, useCallback } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { OrderDetailSkeleton } from '@components/orders/OrderSkeleton';
import { buildTimelineFromStatus, OrderTimeline } from '@components/orders/OrderTimeline';
import { OrderStatusBadge } from '@components/orders/OrderStatusBadge';
import { ScaledPressable } from '@components/ScaledPressable';
import { ORDER_STATUS_BADGES } from '@constants/orderStatus';
import { useOrder } from '@hooks/useOrder';
import { safeGoBack } from '@utils/navigation';
import { formatDateKey } from '@utils/orderDateHelpers';
import { formatINR } from '@utils/formatCurrency';
import { getPaymentMethodLabel } from '@utils/paymentMethodLabels';
import { theme, borderRadius } from '@constants/theme';

const DRIVER_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80';
const SUPPORT_PHONE = '+919999999999';

function parseEstimatedArrival(expected?: string) {
  if (!expected) return { day: null, time: null };
  const todayMatch = expected.match(/today[,\s]*(.*)/i);
  if (todayMatch) {
    return { day: 'Arriving Today', time: todayMatch[1]?.trim() || expected };
  }
  const parts = expected.split(',');
  if (parts.length >= 2) {
    return { day: parts[0].trim(), time: parts.slice(1).join(',').trim() };
  }
  return { day: 'Expected Delivery', time: expected };
}

export const TrackingScreen = memo(function TrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { order, isLoading: orderLoading } = useOrder(orderId);

  const handleCallDriver = useCallback(() => {
    const phone = order?.driver?.phone ?? order?.tracking?.driver?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  }, [order?.driver?.phone, order?.tracking?.driver?.phone]);

  const handleCallSupport = useCallback(() => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`);
  }, []);

  const handleViewInvoice = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push(`/orders/view/${orderId}`);
  }, [orderId]);

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

  const driver = order.driver ?? order.tracking?.driver;
  const statusConfig = ORDER_STATUS_BADGES[order.status];
  const statusLabel = order.statusLabel?.trim() || statusConfig.label;
  const etaSource =
    order.expectedDelivery ??
    order.tracking?.estimatedArrival ??
    (order.tracking?.estimatedMinutes != null
      ? `Delivery in ${order.tracking.estimatedMinutes} mins`
      : undefined);
  const { day: etaDay, time: etaTime } = parseEstimatedArrival(etaSource);
  const timelineSteps =
    order.timeline?.length > 0 ? order.timeline : buildTimelineFromStatus(order.status);
  const canCallDriver = Boolean(driver?.phone);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }} edges={['top']}>
      <BackHeader title="Track Order" onBack={() => safeGoBack('/(tabs)/orders')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <View
          style={{
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.white,
            padding: 16,
          }}>
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: '#E8F5E9',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: borderRadius.full,
              marginBottom: 12,
            }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#2E7D32' }}>ACTIVE DELIVERY</Text>
          </View>
          <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>Order Number</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.textPrimary, marginBottom: 12 }}>
            {order.orderNumber}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>Current Status</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
                {statusLabel}
              </Text>
            </View>
            <OrderStatusBadge status={order.status} label={order.statusLabel} compact />
          </View>
          {etaDay || etaTime ? (
            <View
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: '#F0F0F0',
              }}>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>
                Estimated Arrival
              </Text>
              {etaDay ? (
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>{etaDay}</Text>
              ) : null}
              {etaTime ? (
                <Text style={{ fontSize: 22, fontWeight: '800', color: theme.primary, marginTop: 4 }}>
                  {etaTime}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {driver ? (
          <View
            style={{
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.white,
              padding: 16,
            }}>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1, color: theme.textMuted }}>
              DRIVER
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <Image
                source={{ uri: driver.image ?? DRIVER_AVATAR }}
                style={{ width: 52, height: 52, borderRadius: 26 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
                  {driver.name || 'Assigned driver'}
                </Text>
                {driver.vehicleNumber ? (
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                    Vehicle: {driver.vehicleNumber}
                  </Text>
                ) : null}
                {driver.phone ? (
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                    {driver.phone}
                  </Text>
                ) : null}
              </View>
            </View>
            {canCallDriver ? (
              <ScaledPressable
                onPress={handleCallDriver}
                style={{
                  marginTop: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.primary,
                  borderRadius: borderRadius.md,
                  paddingVertical: 12,
                  gap: 8,
                }}>
                <Ionicons name="call" size={18} color={theme.textPrimary} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>
                  Call Driver
                </Text>
              </ScaledPressable>
            ) : null}
          </View>
        ) : null}

        <OrderTimeline steps={timelineSteps} animated={false} />

        <View
          style={{
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.white,
            padding: 16,
          }}>
          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1, color: theme.textMuted }}>
            ORDER SUMMARY
          </Text>
          <InfoRow label="Order ID" value={order.orderNumber} />
          <InfoRow label="Order Date" value={formatDateKey(order.createdAt)} />
          <InfoRow
            label="Delivery Address"
            value={`${order.shippingAddress.name}\n${order.shippingAddress.address}\nPIN: ${order.shippingAddress.pin}`}
          />
          <InfoRow
            label="Payment Method"
            value={getPaymentMethodLabel(order.paymentMethod, order.paymentMethodLabel)}
          />
          <InfoRow label="Total Amount" value={formatINR(order.grandTotal, false)} highlight />
          {order.expectedDelivery ? (
            <InfoRow label="Expected Delivery" value={order.expectedDelivery} />
          ) : null}
        </View>

        <View style={{ gap: 10 }}>
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
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.primary }}>Need Help</Text>
          </ScaledPressable>
          <ScaledPressable
            onPress={handleCallSupport}
            style={{
              borderRadius: borderRadius.md,
              paddingVertical: 14,
              alignItems: 'center',
              backgroundColor: theme.ultraLightGray,
              borderWidth: 1,
              borderColor: theme.border,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>Call Support</Text>
          </ScaledPressable>
          <ScaledPressable
            onPress={handleViewInvoice}
            style={{
              borderRadius: borderRadius.md,
              paddingVertical: 14,
              alignItems: 'center',
              backgroundColor: theme.primary,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>View Invoice</Text>
          </ScaledPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View
      style={{
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
      }}>
      <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>{label}</Text>
      <Text
        style={{
          fontSize: highlight ? 16 : 14,
          fontWeight: highlight ? '800' : '600',
          color: highlight ? theme.primary : theme.textPrimary,
          lineHeight: 20,
        }}>
        {value}
      </Text>
    </View>
  );
}

export default TrackingScreen;
