import { memo, useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { DeliveryAddress } from '@components/orders/DeliveryAddress';
import { OrderDetailSkeleton } from '@components/orders/OrderSkeleton';
import { OrderProducts } from '@components/orders/OrderProducts';
import { OrderStatusBadge } from '@components/orders/OrderStatusBadge';
import { OrderTimeline } from '@components/orders/OrderTimeline';
import { PaymentSection } from '@components/orders/PaymentSection';
import { PriceSummary } from '@components/orders/PriceSummary';
import { ScaledPressable } from '@components/ScaledPressable';
import { buildInvoiceHtml, getInvoiceData } from '@constants/invoiceData';
import { isActiveStatus } from '@constants/orderStatus';
import { useOrder } from '@hooks/useOrder';
import { useReorder } from '@hooks/useReorder';
import { adaptLegacyOrder } from '@utils/orderAdapters';
import { useOrderStore } from '@store/orderStore';
import { safeGoBack } from '@utils/navigation';
import { formatDateKey } from '@utils/orderDateHelpers';
import { theme, borderRadius } from '@constants/theme';

export const OrderDetailsScreen = memo(function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const legacyOrder = useOrderStore((s) => s.getOrder(orderId ?? ''));
  const { order: apiOrder, isLoading, cancelOrder, isCancelling } = useOrder(orderId);
  const { reorder, isReordering } = useReorder();
  const [downloading, setDownloading] = useState(false);

  const order = apiOrder ?? (legacyOrder ? adaptLegacyOrder(legacyOrder) : undefined);

  const handleDownloadInvoice = useCallback(async () => {
    if (!order) return;
    setDownloading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const invoice = getInvoiceData(order.invoiceId ?? order.id, legacyOrder);
      const { uri } = await Print.printToFileAsync({ html: buildInvoiceHtml(invoice) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      }
    } finally {
      setDownloading(false);
    }
  }, [order, legacyOrder]);

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
        <View
          style={{
            borderRadius: borderRadius.lg,
            backgroundColor: theme.white,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: theme.textMuted }}>
              Order ID: {order.orderNumber}
            </Text>
            <OrderStatusBadge status={order.status} compact />
          </View>
          <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
            Placed on {formatDateKey(order.createdAt)}
          </Text>
          {order.expectedDelivery && order.status !== 'delivered' ? (
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.primary, marginTop: 8 }}>
              Expected delivery: {order.expectedDelivery}
            </Text>
          ) : null}
        </View>

        <OrderTimeline steps={order.timeline} />

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
          platformFee={order.platformFee}
          grandTotal={order.grandTotal}
          savings={order.savings}
        />

        <DeliveryAddress address={order.shippingAddress} />

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

          {order.status === 'processing' || order.status === 'confirmed' || order.status === 'pending' ? (
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
    </SafeAreaView>
  );
});

export default OrderDetailsScreen;
