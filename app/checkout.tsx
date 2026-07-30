import { useEffect, useMemo, useState, Fragment } from 'react';
import { Alert, ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { BillSummary } from '@components/gst/BillSummary';
import { BusinessBenefits } from '@components/gst/BusinessBenefits';
import { DeliveryDestinationCard } from '@components/checkout/DeliveryDestinationCard';
import { PaymentComingSoonSheet } from '@components/checkout/PaymentComingSoonSheet';
import { PaymentMethodCard } from '@components/checkout/PaymentMethodCard';
import { useSites } from '@hooks/useSites';
import { GstBottomSheet } from '@components/gst/GstBottomSheet';
import { GstInvoiceCard } from '@components/gst/GstInvoiceCard';
import { GstSuccessBanner } from '@components/gst/GstSuccessBanner';
import { GstVerifiedCard } from '@components/gst/GstVerifiedCard';
import { ScaledPressable } from '@components/ScaledPressable';
import { getLineTotal, useCartStore } from '@store/cartStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { useEtaStore } from '@store/etaStore';
import { useGstStore } from '@store/gstStore';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useOrderStore } from '@store/orderStore';
import { buildOrderFromCheckout } from '@utils/orderHelpers';
import { normalizeApiOrder } from '@utils/orderAdapters';
import { ORDERS_QUERY_KEY } from '@hooks/useOrders';
import { useDeliveryEta } from '@hooks/useDeliveryEta';
import { useServiceability } from '@hooks/useServiceability';
import { placeOrder } from '@services/orders.api';
import { syncLocalCartToServer } from '@services/cart.api';
import { safeGoBack } from '@utils/navigation';
import { requireAuth } from '@utils/requireAuth';
import { formatINR } from '@utils/formatCurrency';
import {
  computeGstBusinessDiscount,
  formatGstDiscountPercent,
  DEFAULT_GST_DISCOUNT_CONFIG,
} from '@utils/gstPricing';
import {
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_METHODS,
  type PaymentMethodId,
} from '@constants/paymentMethods';
import type { GstValidationResult } from '@/types/gst';

const QUICK_CHIP_KEYS = ['callOnArrival', 'leaveAtSecurity', 'heavyVehicleAccess'] as const;

type ActiveSheet =
  | { type: 'gst' }
  | { type: 'payment'; title: string; message: string }
  | null;

function CheckoutEtaInline() {
  const { deliveringBy, deliveryMessage, estimatedMinutes, isLoading } = useDeliveryEta({
    autoFetch: true,
  });
  const text = deliveringBy
    ? deliveringBy
    : estimatedMinutes
      ? `${estimatedMinutes} mins`
      : deliveryMessage || (isLoading ? '…' : '—');
  return <Text className="font-bold text-primary">{text}</Text>;
}

function CheckoutEtaCard() {
  const { t } = useTranslation();
  const {
    deliveryMessage,
    deliveringBy,
    estimatedMinutes,
    isLoading,
  } = useDeliveryEta({ autoFetch: true });
  const { serviceable } = useServiceability({ autoCheck: false });

  const headline = deliveringBy
    ? `Estimated Delivery · Today, ${deliveringBy}`
    : deliveryMessage || t('scheduledDelivery');

  return (
    <View className="mb-3 rounded-card border border-border bg-surface p-4">
      <View className="flex-row items-center gap-2">
        <Ionicons name="time-outline" size={18} color="#FEB623" />
        <Text className="flex-1 text-sm font-bold text-text">
          {isLoading ? 'Calculating delivery…' : headline}
        </Text>
      </View>
      {estimatedMinutes ? (
        <Text className="mt-1 text-xs text-text-secondary">
          {deliveryMessage || `Delivery in ${estimatedMinutes} mins`}
        </Text>
      ) : null}
      {!serviceable && !isLoading ? (
        <Text className="mt-1 text-xs text-error">Delivery may be unavailable at this location</Text>
      ) : null}
    </View>
  );
}

export default function CheckoutScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const addOrder = useOrderStore((s) => s.addOrder);
  const queryClient = useQueryClient();

  const gstDetails = useGstStore((s) => s.details);
  const gstUiState = useGstStore((s) => s.uiState);
  const showSuccessBanner = useGstStore((s) => s.showSuccessBanner);
  const saveGstDetails = useGstStore((s) => s.saveGstDetails);
  const triggerSuccessBanner = useGstStore((s) => s.triggerSuccessBanner);
  const dismissSuccessBanner = useGstStore((s) => s.dismissSuccessBanner);

  const selectedSite = useDeliveryStore((s) => {
    const fromSites = s.sites.find((x) => x.id === s.selectedSiteId) ?? s.sites[0];
    if (fromSites) return fromSites;
    const primary = s.profileSites.find((x) => x.isPrimary) ?? s.profileSites[0];
    return primary
      ? { id: primary.id, name: primary.name, address: primary.address }
      : undefined;
  });
  useSites(true);

  const profileSite = useDeliveryStore((s) => {
    return s.profileSites.find((x) => x.isPrimary) ?? s.profileSites[0];
  });

  const {
    deliveryMessage: etaLabel,
    estimatedMinutes,
    deliveringBy,
    refresh: refreshEta,
  } = useDeliveryEta({ autoFetch: true });
  const {
    serviceable,
    refresh: refreshServiceability,
  } = useServiceability({
    latitude: profileSite?.latitude,
    longitude: profileSite?.longitude,
    autoCheck: true,
  });

  // Seed ETA location from primary site coords when available
  useEffect(() => {
    if (profileSite?.latitude != null && profileSite?.longitude != null) {
      useEtaStore.getState().setLocation(
        profileSite.latitude,
        profileSite.longitude,
      );
      void refreshEta();
      void refreshServiceability();
    }
  }, [profileSite?.latitude, profileSite?.longitude, refreshEta, refreshServiceability]);

  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(DEFAULT_PAYMENT_METHOD);
  const [instructions, setInstructions] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [bikeDelivery, setBikeDelivery] = useState(false);

  const savingsOpacity = useSharedValue(1);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + getLineTotal(i), 0),
    [items],
  );
  const deliveryCharge = bikeDelivery
    ? 0
    : (useEtaStore.getState().eta?.deliveryCharge ?? 150);
  const loadingCharges = 200;
  const unloadingCharges = 150;
  const loyaltyRedemption = loyaltyPoints / 10;

  const hasGstApplied = useGstStore((s) => s.verified);

  const preDiscountTotal = useMemo(
    () =>
      Math.max(
        0,
        subtotal + deliveryCharge + loadingCharges + unloadingCharges - loyaltyRedemption,
      ),
    [subtotal, deliveryCharge, loadingCharges, unloadingCharges, loyaltyRedemption],
  );

  const gstBusinessDiscount = useMemo(
    () => (hasGstApplied ? computeGstBusinessDiscount(subtotal) : 0),
    [hasGstApplied, subtotal],
  );

  const gstDiscountPercent = formatGstDiscountPercent(DEFAULT_GST_DISCOUNT_CONFIG.rate);

  const checkoutTotal = Math.max(0, preDiscountTotal - gstBusinessDiscount);
  const corporateSavings = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (item.quantity >= item.bulkThreshold) {
          return sum + item.quantity * (item.unitPrice - item.bulkPrice);
        }
        return sum;
      }, 0),
    [items],
  );

  const savingsAnimStyle = useAnimatedStyle(() => ({ opacity: savingsOpacity.value }));

  const selectLoyalty = (pts: number) => {
    setLoyaltyPoints(pts);
    savingsOpacity.value = withSequence(withTiming(0.4, { duration: 100 }), withTiming(1, { duration: 200 }));
  };

  const appendChip = (chip: string) => {
    setInstructions((prev) => (prev ? `${prev}. ${chip}` : chip));
  };

  const handlePaymentMethodPress = (method: (typeof PAYMENT_METHODS)[number]) => {
    if (method.comingSoon) {
      setActiveSheet({
        type: 'payment',
        title: t(method.comingSoonTitleKey),
        message: t(method.comingSoonMessageKey),
      });
      return;
    }

    if (method.enabled) {
      setPaymentMethod(method.id);
    }
  };

  const handleGstSave = async (result: GstValidationResult) => {
    const payload = {
      gstNumber: result.gstNumber,
      businessName: result.businessName,
      registeredAddress: result.registeredAddress,
      state: result.state,
      pan: result.pan,
    };
    await saveGstDetails(payload);
    triggerSuccessBanner();
    setActiveSheet(null);
  };

  const handlePay = async () => {
    if (!requireAuth('Please log in to place an order.')) return;
    if (!paymentMethod || items.length === 0) return;
    if (!selectedSite) {
      Alert.alert('Delivery site required', 'Please select a delivery site before placing your order.');
      return;
    }

    if (profileSite?.latitude != null && profileSite?.longitude != null) {
      const latest = await refreshServiceability();
      if (latest && !latest.serviceable) {
        Alert.alert(
          'Not serviceable',
          'No active hub covers your delivery location. Please choose a different site or notify us when we expand coverage.',
        );
        return;
      }
    } else if (!serviceable) {
      Alert.alert(
        'Location required',
        'We could not verify delivery coverage for your site. Please update your delivery location.',
      );
      return;
    }

    setPaying(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await syncLocalCartToServer(items);

      const placed = await placeOrder({
        addressId: selectedSite.id,
        notes: instructions || undefined,
        paymentMethod: 'CASH',
        loyaltyPointsToRedeem: loyaltyPoints > 0 ? loyaltyPoints : undefined,
      });

      setPaySuccess(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const apiOrder = normalizeApiOrder(placed as Record<string, unknown>);
      const orderId = apiOrder.id || apiOrder.orderNumber;
      const deliveryEtaLabel =
        apiOrder.expectedDelivery ||
        etaLabel ||
        (estimatedMinutes ? `Delivery in ${estimatedMinutes} mins` : '') ||
        deliveringBy ||
        'Calculating…';

      // Seed React Query so Track/Details bind to API order immediately.
      if (orderId) {
        queryClient.setQueryData(['order', orderId], apiOrder);
      }
      await queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      if (orderId) {
        void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      }

      // Brief local success toast only — Track screens fetch by id from API.
      addOrder(
        buildOrderFromCheckout({
          id: orderId || String((placed as { orderNumber?: string }).orderNumber),
          items: [...items],
          total: checkoutTotal,
          site: selectedSite,
          paymentMethod,
          deliveryETA: deliveryEtaLabel,
        }),
      );

      clearCart();
      setPaying(false);
      router.replace({
        pathname: '/order-success',
        params: { orderId },
      });
    } catch (error) {
      setPaying(false);
      setPaySuccess(false);
      const axiosData = (error as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data;
      const apiMessage = Array.isArray(axiosData?.message)
        ? axiosData.message.join(', ')
        : axiosData?.message;
      const message =
        apiMessage ||
        (error instanceof Error ? error.message : 'Unable to place order');
      Alert.alert('Order failed', message);
    }
  };

  return (
    <Fragment>
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader
        title={t('checkout')}
        onBack={() => {
          Alert.alert('Leave Checkout?', 'Your cart items will be saved.', [
            { text: 'Stay', style: 'cancel' },
            { text: 'Leave', onPress: () => safeGoBack() },
          ]);
        }}
        rightElement={
          <ScaledPressable hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="qr-code-outline" size={20} color="#1A1A1A" />
          </ScaledPressable>
        }
      />

      <ScrollView
        key={language}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}>
        <View className="mb-3 rounded-card border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-text">⭐ {t('redeemLoyaltyPoints')}</Text>
            <View className="rounded-full bg-primary/10 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-primary">{t('platinumContractor')}</Text>
            </View>
          </View>
          <View className="mt-3 flex-row justify-between">
            <Text className="text-sm font-bold text-text">{t('available')}: 2,450 {t('points').toLowerCase()}</Text>
            <Text className="text-sm text-text-secondary">{t('value')}: ★★★★</Text>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-border">
            <View className="h-full w-3/4 rounded-full bg-warning" />
          </View>
          <View className="mt-1 flex-row justify-between">
            <Text className="text-[10px] text-text-secondary">{t('pointsAvailable')}</Text>
            <Text className="text-[10px] font-bold text-success">{t('eligible')}</Text>
          </View>
          <View className="mt-3 flex-row items-center rounded-lg border border-border px-3 py-2">
            <TextInput
              className="flex-1 text-base font-bold text-text"
              keyboardType="numeric"
              value={String(loyaltyPoints)}
              onChangeText={(val) => selectLoyalty(Number(val.replace(/\D/g, '')) || 0)}
            />
            <Text className="text-xs font-bold text-text-secondary">{t('points')}</Text>
          </View>
          <View className="mt-2 flex-row gap-2">
            {[500, 1000].map((pts) => (
              <ScaledPressable
                key={pts}
                onPress={() => selectLoyalty(pts)}
                className={`rounded-lg px-4 py-2 ${
                  loyaltyPoints === pts ? 'bg-primary' : 'border border-border'
                }`}>
                <Text
                  className={`text-xs font-bold ${
                    loyaltyPoints === pts ? 'text-onPrimary' : 'text-text-secondary'
                  }`}>
                  {pts} pts
                </Text>
              </ScaledPressable>
            ))}
            <ScaledPressable
              onPress={() => selectLoyalty(2450)}
              className="rounded-lg border border-border px-4 py-2">
              <Text className="text-xs font-bold text-text-secondary">{t('maxLabel')}</Text>
            </ScaledPressable>
          </View>
          <Text className="mt-2 text-xs text-text-secondary">
            {loyaltyPoints} Points = {formatINR(loyaltyRedemption)} Discount
          </Text>
          <Animated.View
            style={savingsAnimStyle}
            className="mt-3 flex-row items-center gap-2 rounded-lg bg-primary/10 p-3">
            <Text className="text-lg">🎁</Text>
            <Text className="text-sm font-medium text-primary">
              {t('youAreSaving')} {formatINR(loyaltyRedemption)} {t('withLoyaltyRewards')}
            </Text>
          </Animated.View>
        </View>

        <BillSummary
          items={items}
          subtotal={subtotal}
          deliveryCharge={deliveryCharge}
          loadingCharges={loadingCharges}
          unloadingCharges={unloadingCharges}
          loyaltyRedemption={loyaltyRedemption}
          checkoutTotal={checkoutTotal}
          corporateSavings={corporateSavings}
          bikeDelivery={bikeDelivery}
          gstUiState={hasGstApplied ? 'VERIFIED' : gstUiState}
          gstBusinessDiscount={gstBusinessDiscount}
          gstDiscountPercent={gstDiscountPercent}
          preDiscountTotal={preDiscountTotal}
        />

        <GstSuccessBanner
          visible={showSuccessBanner}
          onDismiss={dismissSuccessBanner}
          discountPercent={gstDiscountPercent}
          discountAmount={gstBusinessDiscount}
        />

        {hasGstApplied && gstDetails ? (
          <>
            <GstVerifiedCard
              details={gstDetails}
              appliedTitle={t('gstInvoiceApplied')}
              editLabel={t('editGst')}
              discountPercent={gstDiscountPercent}
              discountAmount={gstBusinessDiscount}
              onPress={() => setActiveSheet({ type: 'gst' })}
            />
            <BusinessBenefits />
          </>
        ) : (
          <GstInvoiceCard
            title={t('gstInvoiceCardTitle')}
            subtitle={t('gstInvoiceCardSubtitle')}
            onPress={() => setActiveSheet({ type: 'gst' })}
          />
        )}

        <DeliveryDestinationCard site={selectedSite} />

        <CheckoutEtaCard />

        <View className="mb-3 rounded-card border border-border bg-surface p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="bus-outline" size={18} color="#FEB623" />
            <Text className="text-sm text-text">
              {t('scheduledDelivery')}:{' '}
              <CheckoutEtaInline />
            </Text>
          </View>
          <View className="mt-3 flex-row items-center justify-between px-2">
            {[
              { labelKey: 'orderedStep' as const, done: true },
              { labelKey: 'processingStep' as const, active: true },
              { labelKey: 'shippingStep' as const, done: false },
              { labelKey: 'deliveryStep' as const, done: false },
            ].map((step, i, arr) => (
              <View key={step.labelKey} className="flex-1 items-center">
                <View className="flex-row items-center">
                  {i > 0 && (
                    <View
                      className={`h-0.5 w-6 ${step.done || step.active ? 'bg-primary' : 'bg-border'}`}
                    />
                  )}
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-full ${
                      step.done
                        ? 'bg-primary'
                        : step.active
                          ? 'border-2 border-primary bg-primary/20'
                          : 'border-2 border-border'
                    }`}>
                    {step.done ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : step.active ? (
                      <View className="h-2 w-2 rounded-full bg-primary" />
                    ) : null}
                  </View>
                  {i < arr.length - 1 && (
                    <View
                      className={`h-0.5 w-6 ${arr[i + 1].done || arr[i + 1].active ? 'bg-primary' : 'bg-border'}`}
                    />
                  )}
                </View>
                <Text className="mt-1 text-[9px] text-text-secondary">{t(step.labelKey)}</Text>
              </View>
            ))}
          </View>
        </View>

        <ScaledPressable
          onPress={() => setBikeDelivery((v) => !v)}
          className={`mb-3 flex-row items-center justify-between rounded-card border p-4 ${
            bikeDelivery ? 'border-primary bg-primary/5' : 'border-border bg-surface'
          }`}>
          <View className="flex-row items-center gap-3">
            <Ionicons name="bicycle-outline" size={22} color="#FEB623" />
            <Text className="text-sm font-bold text-text">{t('bikeDelivery')}</Text>
          </View>
          <View className="rounded-md bg-success/15 px-2.5 py-1">
            <Text className="text-[11px] font-800 font-bold text-success">
              {t('bikeDeliveryFree')}
            </Text>
          </View>
        </ScaledPressable>

        <View className="mb-3 rounded-card border border-border bg-surface p-4">
          <Text className="mb-2 font-bold text-text">{t('deliveryInstructions')}</Text>
          <TextInput
            className="min-h-[72px] rounded-lg border border-border bg-background p-3 text-sm text-text"
            placeholder={t('deliveryInstructionsPlaceholder')}
            placeholderTextColor="#999"
            multiline
            value={instructions}
            onChangeText={setInstructions}
          />
          <View className="mt-2 flex-row flex-wrap gap-2">
            {QUICK_CHIP_KEYS.map((chipKey) => (
              <ScaledPressable
                key={chipKey}
                onPress={() => appendChip(t(chipKey))}
                className="rounded-full border border-border px-3 py-1.5">
                <Text className="text-xs text-text-secondary">{t(chipKey)}</Text>
              </ScaledPressable>
            ))}
          </View>
        </View>

        <Text className="mb-2 text-[10px] font-bold tracking-widest text-text-secondary">
          {t('paymentMethod').toUpperCase()}
        </Text>
        {PAYMENT_METHODS.map((method) => (
          <PaymentMethodCard
            key={method.id}
            icon={method.icon}
            title={t(method.titleKey)}
            subtitle={t(method.subtitleKey)}
            description={t(method.descriptionKey)}
            badge={method.comingSoon ? t('paymentComingSoon') : t('paymentAvailable')}
            selected={paymentMethod === method.id}
            onPress={() => handlePaymentMethodPress(method)}
          />
        ))}

        <View className="mt-2 flex-row justify-between">
          <View className="flex-1 items-center">
            <Ionicons name="shield-checkmark-outline" size={18} color="#666" />
            <Text className="mt-1 text-center text-[9px] text-text-secondary">
              {t('pciCompliant')}
            </Text>
          </View>
          <View className="flex-1 items-center">
            <Ionicons name="checkmark-done-outline" size={18} color="#666" />
            <Text className="mt-1 text-center text-[9px] text-text-secondary">
              {t('qualityGuarantee')}
            </Text>
          </View>
        </View>

        <ScaledPressable
          onPress={handlePay}
          disabled={paying || items.length === 0 || !serviceable}
          className={`mt-3 flex-row items-center justify-center rounded-pill py-4 ${
            paySuccess ? 'bg-success' : serviceable ? 'bg-primary' : 'bg-border'
          }`}>
          {paying ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : paySuccess ? (
            <>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text className="ml-2 text-base font-bold text-onPrimary">{t('confirmed')}!</Text>
            </>
          ) : (
            <Text className="text-base font-bold text-onPrimary">{t('payConfirmOrder')} →</Text>
          )}
        </ScaledPressable>
      </ScrollView>
      </SafeAreaView>

      <PaymentComingSoonSheet
        visible={activeSheet?.type === 'payment'}
        title={activeSheet?.type === 'payment' ? activeSheet.title : ''}
        message={activeSheet?.type === 'payment' ? activeSheet.message : ''}
        onClose={() => setActiveSheet(null)}
      />

      <GstBottomSheet
        visible={activeSheet?.type === 'gst'}
        initialGstNumber={gstDetails?.gstNumber ?? ''}
        isEditMode={hasGstApplied}
        onClose={() => {
          setActiveSheet(null);
          const { uiState, verified, setUiState } = useGstStore.getState();
          if (uiState === 'FAILED' || uiState === 'VERIFYING') {
            setUiState(verified ? 'VERIFIED' : 'NOT_ADDED');
          }
        }}
        onSave={handleGstSave}
      />
    </Fragment>
  );
}
