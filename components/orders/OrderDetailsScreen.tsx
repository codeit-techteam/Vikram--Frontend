import { memo, useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BackHeader } from '@components/BackHeader';
import { DownloadInvoiceCard } from '@components/gst/DownloadInvoiceCard';
import { CurrentStatusCard } from '@components/orders/CurrentStatusCard';
import { DeliveryAddress } from '@components/orders/DeliveryAddress';
import { DeliveryOtpSheet } from '@components/orders/DeliveryOtpSheet';
import { OrderDetailSkeleton } from '@components/orders/OrderSkeleton';
import { OrderProducts } from '@components/orders/OrderProducts';
import { OrderStatusBadge } from '@components/orders/OrderStatusBadge';
import { OrderTimeline } from '@components/orders/OrderTimeline';
import { PaymentSection } from '@components/orders/PaymentSection';
import { PriceSummary } from '@components/orders/PriceSummary';
import { ScaledPressable } from '@components/ScaledPressable';
import { CANCELLABLE_STATUSES, isActiveStatus } from '@constants/orderStatus';
import { useOrder } from '@hooks/useOrder';
import { useReorder } from '@hooks/useReorder';
import { useGstStore } from '@store/gstStore';
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

export const OrderDetailsScreen = memo(function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const gstDetails = useGstStore((s) => s.details);
  const hasGst = useGstStore((s) => s.verified);
  const {
    order,
    isLoading,
    cancelOrder,
    isCancelling,
    downloadInvoicePdf,
  } = useOrder(orderId);
  const { reorder, isReordering } = useReorder();
  const [downloading, setDownloading] = useState(false);
  const [otpDismissed, setOtpDismissed] = useState(false);

  const handleDownloadInvoice = useCallback(async () => {
    if (!orderId) return;
    setDownloading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { uri, filename } = await downloadInvoicePdf();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: filename,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Invoice ready', `Saved as ${filename}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to download invoice';
      Alert.alert('Invoice download failed', message);
    } finally {
      setDownloading(false);
    }
  }, [orderId, downloadInvoicePdf]);

  const handleViewInvoice = useCallback(async () => {
    if (!orderId) return;
    await Haptics.selectionAsync();
    router.push({
      pathname: '/invoice/[invoiceId]',
      params: {
        invoiceId: order?.invoiceId || order?.invoiceNumber || orderId,
        orderId,
      },
    });
  }, [orderId, order?.invoiceId, order?.invoiceNumber]);

  const handleReorder = useCallback(async () => {
    if (!orderId) return;
    await reorder(orderId);
  }, [orderId, reorder]);

  const handleCancel = useCallback(() => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await cancelOrder({ reason: 'Cancelled by customer' });
        },
      },
    ]);
  }, [cancelOrder]);

  const handleTrack = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push(`/orders/details/${orderId}`);
  }, [orderId]);

  useEffect(() => {
    if (order?.deliveryOtpVerified) {
      setOtpDismissed(true);
    }
  }, [order?.deliveryOtpVerified]);

  if (isLoading && !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }} edges={['top']}>
        <BackHeader title="Order Details" onBack={() => safeGoBack('/(tabs)/orders')} />
        <OrderDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bgMain }} edges={['top']}>
        <Text style={{ color: theme.textSecondary }}>Order not found</Text>
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/orders')} style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '700', color: theme.primary }}>Go Back</Text>
        </ScaledPressable>
      </SafeAreaView>
    );
  }

  const showTrack = isActiveStatus(order.status);
  const isDelivered = order.status === 'delivered' || order.status === 'refunded';
  const canCancel =
    typeof order.canCancel === 'boolean'
      ? order.canCancel
      : CANCELLABLE_STATUSES.includes(order.status);
  const invoiceStatusLabel = order.invoiceStatus
    ? String(order.invoiceStatus).replace(/_/g, ' ')
    : order.invoiceNumber
      ? `Invoice ${order.invoiceNumber}`
      : 'Available after delivery';
  const timeline = buildCustomerTimeline(order.status, {
    createdAt: order.createdAt,
    deliveredAt: order.deliveredAt,
  });
  const showOtp =
    !otpDismissed &&
    shouldShowDeliveryOtp(order) &&
    order.status === 'out_for_delivery';
  const partnerAssigned = Boolean(order.driver?.name || order.tracking?.driver?.name);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }} edges={['top']}>
      <BackHeader
        title="Order Details"
        onBack={() => safeGoBack('/(tabs)/orders')}
        rightElement={
          <TouchableOpacity
            onPress={() => {
              const text = encodeURIComponent(`Order ${order.orderNumber}`);
              Linking.openURL(`whatsapp://send?text=${text}`);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="share-outline" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            borderRadius: borderRadius.lg,
            backgroundColor: theme.white,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: theme.textMuted }}>
              Order #{order.orderNumber}
            </Text>
            <OrderStatusBadge status={order.status} compact />
          </View>
          <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
            Placed on {formatDateKey(order.createdAt)}
          </Text>
          {isDelivered ? (
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.success, marginTop: 8 }}>
              Delivered
              {order.deliveredAt ? ` on ${formatDateKey(order.deliveredAt)}` : ''}
            </Text>
          ) : order.expectedDelivery ? (
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.primaryDark, marginTop: 8 }}>
              Estimated Delivery: {order.expectedDelivery}
            </Text>
          ) : (
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary, marginTop: 8 }}>
              {getCustomerStatusLabel(order.status)}
            </Text>
          )}
        </Animated.View>

        <CurrentStatusCard
          status={order.status}
          estimatedMinutes={order.tracking?.estimatedMinutes}
          estimatedArrival={order.expectedDelivery ?? order.tracking?.estimatedArrival}
          partnerAssigned={partnerAssigned}
          driverName={order.driver?.name ?? order.tracking?.driver?.name}
          vehicleNumber={
            order.driver?.vehicleNumber ?? order.tracking?.driver?.vehicleNumber
          }
          driverReached={Boolean(order.driverReachedAt)}
          isDelivered={isDelivered}
          deliveredAtLabel={formatDeliveredLabel(order.deliveredAt)}
        />

        <OrderTimeline steps={timeline} />

        <View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginBottom: 12 }}>
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

        <DeliveryAddress address={order.shippingAddress} />

        {hasGst && gstDetails ? (
          <DownloadInvoiceCard
            details={gstDetails}
            title="Business Invoice"
            invoiceStatus={invoiceStatusLabel}
            onDownload={handleDownloadInvoice}
            isDownloading={downloading}
            downloadLabel="Download GST Invoice"
          />
        ) : null}

        {(isDelivered || order.invoiceNumber) ? (
          <ScaledPressable
            onPress={handleViewInvoice}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: theme.white,
              borderRadius: borderRadius.md,
              paddingVertical: 14,
              borderWidth: 1,
              borderColor: theme.primary,
            }}>
            <Ionicons name="document-text-outline" size={18} color={theme.primary} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.primary }}>
              View Invoice
            </Text>
          </ScaledPressable>
        ) : null}

        <PaymentSection
          paymentMethod={order.paymentMethod}
          paymentMethodLabel={order.paymentMethodLabel}
          paymentStatus={order.paymentStatus}
          transactionId={order.transactionId}
          onDownloadInvoice={handleDownloadInvoice}
          isDownloading={downloading}
        />

        <View style={{ gap: 10 }}>
          {showTrack ? (
            <ScaledPressable
              onPress={handleTrack}
              style={{
                backgroundColor: theme.primary,
                borderRadius: borderRadius.md,
                paddingVertical: 14,
                alignItems: 'center',
              }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
                Track Order
              </Text>
            </ScaledPressable>
          ) : null}

          <ScaledPressable
            onPress={handleReorder}
            disabled={isReordering}
            style={{
              backgroundColor: theme.white,
              borderRadius: borderRadius.md,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.border,
              opacity: isReordering ? 0.6 : 1,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
              {isReordering ? 'Adding to cart…' : 'Reorder'}
            </Text>
          </ScaledPressable>

          {canCancel ? (
            <ScaledPressable
              onPress={handleCancel}
              disabled={isCancelling}
              style={{
                backgroundColor: '#FFEBEE',
                borderRadius: borderRadius.md,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: isCancelling ? 0.6 : 1,
              }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.error }}>
                {isCancelling ? 'Cancelling…' : 'Cancel Order'}
              </Text>
            </ScaledPressable>
          ) : null}

          <ScaledPressable
            onPress={() => router.push('/support')}
            style={{
              borderRadius: borderRadius.md,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: theme.primary,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.primary }}>
              Need Help?
            </Text>
          </ScaledPressable>
        </View>

        {order.loyaltyPointsEarned ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: `${theme.primary}66`,
              backgroundColor: theme.primaryUltraLight,
              padding: 16,
            }}>
            <Ionicons name="star" size={22} color={theme.primary} />
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted }}>
                LOYALTY POINTS EARNED
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.primary }}>
                {order.loyaltyPointsEarned.toLocaleString('en-IN')} BJW Points
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <DeliveryOtpSheet
        visible={showOtp}
        otp={order.deliveryOtp}
        onClose={() => setOtpDismissed(true)}
      />
    </SafeAreaView>
  );
});

export default OrderDetailsScreen;
