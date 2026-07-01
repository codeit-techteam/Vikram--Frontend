import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { PulseDot } from '@components/orders/PulseDot';
import { ScaledPressable } from '@components/ScaledPressable';
import { buildInvoiceHtml, getInvoiceData } from '@constants/invoiceData';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useOrderStore } from '@store/orderStore';
import { safeGoBack } from '@utils/navigation';
import { CartItemImage } from '@components/cart/CartItemImage';
import { getOrderMaterialImageSource, getOrderPrimaryImageSource } from '@utils/orderHelpers';
import { formatINR } from '@utils/formatCurrency';

const DRIVER_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80';

export default function ViewOrderScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const order = useOrderStore((s) => s.getOrder(orderId ?? ''));
  const [downloading, setDownloading] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    if (!order) return;
    order.timeline.forEach((_, i) => {
      setTimeout(() => setVisibleSteps((v) => Math.max(v, i + 1)), 300 * (i + 1));
    });
  }, [order]);

  if (!order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">{t('productNotFound')}</Text>
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/orders')} className="mt-4">
          <Text className="font-bold text-primary">{t('goBack')}</Text>
        </ScaledPressable>
      </SafeAreaView>
    );
  }

  const invoice = getInvoiceData(order.invoiceId, order);
  const heroImage = getOrderPrimaryImageSource(order);

  const downloadInvoice = async () => {
    setDownloading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { uri } = await Print.printToFileAsync({ html: buildInvoiceHtml(invoice) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      }
    } finally {
      setDownloading(false);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Invoice ${order.invoiceFileName} — Total ${formatINR(order.totalPayable)}`,
    );
    Linking.openURL(`whatsapp://send?text=${text}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader
        title={t('orderDetails')}
        rightElement={
          <TouchableOpacity
            onPress={shareWhatsApp}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="share-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        }
      />
      <ScrollView
        key={language}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-text-secondary">
              {t('orderId')}: {order.id}
            </Text>
            <View className="rounded-full bg-primary/10 px-3 py-1">
              <Text className="text-[10px] font-bold text-primary">{order.statusLabel} 🔵</Text>
            </View>
          </View>
          <Text className="mt-2 text-2xl font-bold text-text">
            {t('arrivingBy')} {order.arrivingBy}
          </Text>
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="star-outline" size={14} color="#666" />
            <Text className="text-sm text-text-secondary">{order.warehouse}</Text>
          </View>
        </View>

        <View className="relative mx-5 mt-4">
          {heroImage ? (
            <Image
              source={heroImage}
              style={{ width: '100%', height: 200, borderRadius: 12 }}
              contentFit="cover"
            />
          ) : order.items[0] ? (
            <CartItemImage
              item={order.items[0]}
              style={{ width: '100%', height: 200, borderRadius: 12 }}
              contentFit="cover"
            />
          ) : (
            <View
              className="items-center justify-center bg-surface"
              style={{ width: '100%', height: 200, borderRadius: 12 }}>
              <Ionicons name="image-outline" size={32} color="#CCC" />
            </View>
          )}
          {order.badge && (
            <View className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1">
              <Text className="text-[10px] font-bold text-onPrimary">{order.badge}</Text>
            </View>
          )}
        </View>

        <View className="mx-5 mt-5 rounded-card border border-border bg-surface p-4">
          <Text className="text-[10px] font-bold tracking-widest text-text-secondary">
            {t('deliveryTimeline')}
          </Text>
          {order.timeline.map((step, i) =>
            i < visibleSteps ? (
              <Animated.View
                key={step.label}
                entering={FadeInLeft.duration(300)}
                className="mt-4 flex-row gap-3">
                <View className="items-center">
                  {step.active ? (
                    <PulseDot size={22} />
                  ) : (
                    <View
                      className={`h-5 w-5 items-center justify-center rounded-full ${
                        step.done ? 'bg-primary' : 'border-2 border-border'
                      }`}>
                      {step.done && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                    </View>
                  )}
                  {i < order.timeline.length - 1 && (
                    <View className={`mt-1 h-8 w-0.5 ${step.done ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className={`text-sm font-bold ${step.active ? 'text-primary' : 'text-text'}`}>
                    {step.label}
                  </Text>
                  <Text className="text-xs text-text-secondary">{step.time}</Text>
                </View>
              </Animated.View>
            ) : null,
          )}
        </View>

        <View className="mx-5 mt-5">
          <View className="mb-3 flex-row items-center gap-2">
            <Ionicons name="cube-outline" size={18} color="#FEB623" />
            <Text className="text-base font-bold text-text">{t('orderedMaterials')}</Text>
          </View>
          {order.materials.map((mat, idx) => {
            const cartItem = order.items[idx];
            const matImage = getOrderMaterialImageSource(mat, cartItem);
            return (
            <View key={mat.id} className="mb-4 overflow-hidden rounded-card border border-border bg-surface">
              {matImage ? (
                <Image
                  source={matImage}
                  style={{ width: '100%', height: 140 }}
                  contentFit="cover"
                />
              ) : cartItem ? (
                <CartItemImage
                  item={cartItem}
                  style={{ width: '100%', height: 140 }}
                  contentFit="cover"
                />
              ) : (
                <View className="h-[140px] items-center justify-center bg-background">
                  <Ionicons name="image-outline" size={28} color="#CCC" />
                </View>
              )}
              <View className="p-4">
                <View className="flex-row justify-between">
                  <Text className="flex-1 text-base font-bold text-text">{mat.name}</Text>
                  <Text className="text-base font-bold text-primary">{formatINR(mat.total, false)}</Text>
                </View>
                <Text className="mt-1 text-xs text-text-secondary">{mat.description}</Text>
                <View className="mt-3 flex-row flex-wrap gap-3">
                  <Text className="text-[10px] font-bold text-text">
                    {t('quantity')}: {mat.quantityLabel}
                  </Text>
                  <Text className="text-[10px] font-bold text-text">
                    {t('unitPrice')}: {mat.unitPriceLabel}
                  </Text>
                </View>
                <View className="mt-2 self-end rounded-full bg-trust px-2 py-1">
                  <Text className="text-[10px] font-semibold text-secondary">
                    GST ({mat.gstRate}%): {formatINR(mat.gstAmount, false)}
                  </Text>
                </View>
              </View>
            </View>
            );
          })}
        </View>

        <View className="mx-5 mt-2 rounded-card border border-border bg-trust p-4">
          <Text className="text-[10px] font-bold text-text-secondary">{t('deliverySite')}</Text>
          <View className="mt-2 flex-row items-start gap-2">
            <Ionicons name="location" size={20} color="#1A73E8" />
            <View>
              <Text className="text-sm font-bold text-text">{order.deliverySite.name}</Text>
              <Text className="text-xs text-text-secondary">{order.deliverySite.address}</Text>
            </View>
          </View>
        </View>

        <View className="mx-5 mt-4 rounded-card border border-border bg-surface p-4">
          <Text className="text-[10px] font-bold text-text-secondary">{t('logisticsLead')}</Text>
          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Image source={{ uri: DRIVER_AVATAR }} style={{ width: 44, height: 44, borderRadius: 22 }} />
              <View>
                <Text className="text-sm font-bold text-text">{order.driverName}</Text>
                <Text className="text-xs text-text-secondary">
                  {t('vehicle')}: {order.vehicleNumber}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <ScaledPressable
                onPress={() => Linking.openURL('tel:+919999999999')}
                className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Ionicons name="call" size={18} color="#FEB623" />
              </ScaledPressable>
              <ScaledPressable
                onPress={() => router.push('/support/chat')}
                className="h-10 w-10 items-center justify-center rounded-full border border-border">
                <Ionicons name="chatbubble-outline" size={18} color="#666" />
              </ScaledPressable>
            </View>
          </View>
        </View>

        <View className="mx-5 mt-4 overflow-hidden rounded-card">
          <View className="bg-primary px-4 py-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold text-onPrimary/80">{t('totalPayable')}</Text>
              <View className="rounded bg-success px-2 py-0.5">
                <Text className="text-[10px] font-bold text-onPrimary">{t('paid')}</Text>
              </View>
            </View>
            <Text className="mt-1 text-3xl font-bold text-onPrimary">
              {formatINR(order.totalPayable, false)}
            </Text>
          </View>
          <View className="bg-surface p-4">
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-text-secondary">{t('subtotal')}</Text>
                <Text className="text-sm font-semibold">{formatINR(order.subtotal, false)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-text-secondary">{t('totalGst')}</Text>
                <Text className="text-sm font-semibold">{formatINR(order.gst, false)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-text-secondary">{t('deliveryFee')}</Text>
                <Text className="text-sm font-bold text-success">{t('free')}</Text>
              </View>
            </View>
            <View className="mt-3 flex-row items-center gap-2 border-t border-border pt-3">
              <Ionicons name="card-outline" size={16} color="#FEB623" />
              <Text className="text-xs text-text-secondary">{order.paymentMethodLabel}</Text>
            </View>
          </View>
        </View>

        <View className="mx-5 mt-4 rounded-card border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-[10px] font-bold text-text-secondary">{t('gstInvoice')}</Text>
            <Ionicons name="settings-outline" size={18} color="#FEB623" />
          </View>
          <View className="mt-3 flex-row items-center gap-3">
            <Ionicons name="document" size={28} color="#D32F2F" />
            <View className="flex-1">
              <Text className="text-sm font-bold text-text">{order.invoiceFileName}</Text>
              <Text className="text-xs text-text-secondary">
                {order.invoiceFileSize} • {t('generated')} 2h ago
              </Text>
            </View>
          </View>
          <View className="mt-4 flex-row gap-3">
            <ScaledPressable
              onPress={downloadInvoice}
              disabled={downloading}
              className="flex-1 flex-row items-center justify-center rounded-lg bg-primary py-3">
              {downloading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color="#FFF" />
                  <Text className="ml-2 font-bold text-onPrimary">{t('download')}</Text>
                </>
              )}
            </ScaledPressable>
            <ScaledPressable
              onPress={shareWhatsApp}
              className="flex-1 flex-row items-center justify-center rounded-lg py-3"
              style={{ backgroundColor: '#25D366' }}>
              <Ionicons name="share-social-outline" size={18} color="#FFF" />
              <Text className="ml-2 font-bold text-onPrimary">{t('whatsapp')}</Text>
            </ScaledPressable>
          </View>
        </View>

        <View className="mx-5 mt-4 flex-row items-center gap-3 rounded-card border border-dashed border-primary/40 bg-primary/5 p-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <Ionicons name="star" size={20} color="#FEB623" />
          </View>
          <View>
            <Text className="text-[10px] font-bold text-text-secondary">{t('loyaltyPointsEarned')}</Text>
            <Text className="text-base font-bold text-primary">
              {order.loyaltyPointsEarned.toLocaleString('en-IN')} BJW Points
            </Text>
          </View>
        </View>

        <View className="mx-5 mt-5 px-1">
          <ScaledPressable
            onPress={() => router.push('/support')}
            className="items-center rounded-pill border-2 border-primary py-4">
            <Text className="font-bold text-primary">⚠ {t('raiseLogisticsIssue')}</Text>
          </ScaledPressable>
          <Text className="mt-4 text-center text-sm text-text-secondary">
            {t('needImmediateHelp')}{' '}
            <Text className="font-bold text-primary" onPress={() => router.push('/support')}>
              {t('contactSupport')}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
