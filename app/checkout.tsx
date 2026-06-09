import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
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

import { AppHeader } from '@components/AppHeader';
import { ScaledPressable } from '@components/ScaledPressable';
import { useAuthStore } from '@store/useAuthStore';
import { getLineTotal, useCartStore } from '@store/cartStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { generateOrderId, useOrderStore } from '@store/orderStore';
import { buildOrderFromCheckout } from '@utils/orderHelpers';
import { getCartItemImageSource } from '@utils/cartHelpers';
import { formatINR } from '@utils/formatCurrency';

type PaymentMethod = 'google_pay' | 'phonepe' | 'paytm' | 'netbanking' | 'card' | 'cod';

const UPI_OPTIONS: { id: PaymentMethod; label: string }[] = [
  { id: 'google_pay', label: 'Google Pay' },
  { id: 'phonepe', label: 'PhonePe' },
  { id: 'paytm', label: 'Paytm' },
];

const OTHER_OPTIONS: { id: PaymentMethod; labelKey: 'netBanking' | 'creditDebitCard' | 'payOnDelivery'; icon: string }[] = [
  { id: 'netbanking', labelKey: 'netBanking', icon: 'business-outline' },
  { id: 'card', labelKey: 'creditDebitCard', icon: 'card-outline' },
  { id: 'cod', labelKey: 'payOnDelivery', icon: 'cube-outline' },
];

const QUICK_CHIP_KEYS = ['callOnArrival', 'leaveAtSecurity', 'heavyVehicleAccess'] as const;

export default function CheckoutScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const addOrder = useOrderStore((s) => s.addOrder);

  const selectedSite = useDeliveryStore((s) => {
    const site = s.sites.find((x) => x.id === s.selectedSiteId);
    return site ?? s.sites[0];
  });

  const companyName = useAuthStore((s) => s.companyName) || 'Prime Construction Ltd.';
  const gstFromAuth = useAuthStore((s) => s.gstNumber) || '27AAACR1234F1Z5';

  const [gstInput, setGstInput] = useState(gstFromAuth);
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstVerified, setGstVerified] = useState(true);
  const [billingEnabled, setBillingEnabled] = useState(true);
  const [invoiceNeeded, setInvoiceNeeded] = useState(true);
  const [saveGst, setSaveGst] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('google_pay');
  const [instructions, setInstructions] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(1000);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const savingsOpacity = useSharedValue(1);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + getLineTotal(i), 0),
    [items],
  );
  const gst = subtotal * 0.18;
  const loyaltyRedemption = loyaltyPoints / 10;
  const checkoutTotal = subtotal + gst - loyaltyRedemption;
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

  const verifyGst = async () => {
    setGstVerifying(true);
    await new Promise((r) => setTimeout(r, 1000));
    setGstVerifying(false);
    setGstVerified(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const selectLoyalty = (pts: number) => {
    setLoyaltyPoints(pts);
    savingsOpacity.value = withSequence(withTiming(0.4, { duration: 100 }), withTiming(1, { duration: 200 }));
  };

  const appendChip = (chip: string) => {
    setInstructions((prev) => (prev ? `${prev}. ${chip}` : chip));
  };

  const handlePay = async () => {
    if (!paymentMethod || items.length === 0) return;
    setPaying(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 2000));
    setPaySuccess(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const orderId = generateOrderId();

    addOrder(
      buildOrderFromCheckout({
        id: orderId,
        items: [...items],
        total: checkoutTotal,
        site: selectedSite,
        paymentMethod,
        deliveryETA: 'Today, 5:00 PM',
      }),
    );

    clearCart();
    setPaying(false);
    router.replace({
      pathname: '/order-success',
      params: { orderId },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader showBack title={t('checkout')} />

      <ScrollView
        key={language}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-row gap-2">
              <Ionicons name="location" size={20} color="#FEB623" />
              <View className="flex-1">
                <Text className="text-[10px] font-bold tracking-wider text-text-secondary">
                  {t('deliveryDestination')}
                </Text>
                <Text className="mt-1 text-sm font-bold text-text">
                  Site A – Mumbai North Industrial Estate
                </Text>
                <Text className="mt-1 text-xs text-text-secondary">
                  Plot 42, Sector 12, Kandivali West, Mumbai, 400067
                </Text>
              </View>
            </View>
            <ScaledPressable onPress={() => router.push('/delivery-location')}>
              <Text className="text-sm font-semibold text-primary">{t('change')}</Text>
            </ScaledPressable>
          </View>
        </View>

        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="bus-outline" size={18} color="#FEB623" />
            <Text className="text-sm text-text">
              {t('scheduledDelivery')}:{' '}
              <Text className="font-bold text-primary">Today, 5:00 PM</Text>
            </Text>
          </View>
          <View className="mt-4 flex-row items-center justify-between px-2">
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

        <View className="mb-4 flex-row items-center rounded-card border border-border bg-surface px-4 py-3">
          <Ionicons name="shield-checkmark-outline" size={18} color="#666666" />
          <TextInput
            className="ml-2 flex-1 text-sm text-text"
            placeholder={`${t('gstNumber')} (${t('optional')})`}
            placeholderTextColor="#999"
            value={gstInput}
            onChangeText={(t) => {
              setGstInput(t);
              setGstVerified(false);
            }}
          />
          <ScaledPressable onPress={verifyGst} disabled={gstVerifying}>
            {gstVerifying ? (
              <ActivityIndicator size="small" color="#FEB623" />
            ) : (
              <Text className="font-semibold text-primary">{t('verify')}</Text>
            )}
          </ScaledPressable>
        </View>
        {gstVerified && (
          <View className="mb-4 flex-row items-center gap-1">
            <Text className="text-xs font-bold text-success">✓ {t('verified').toUpperCase()}</Text>
          </View>
        )}

        <View className="mb-4 overflow-hidden rounded-card border border-border bg-surface">
          <View className="flex-row items-center justify-between bg-trust px-4 py-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="document-text-outline" size={18} color="#1A73E8" />
              <Text className="font-bold text-text">{t('gstBilling')}</Text>
            </View>
            <Switch
              value={billingEnabled}
              onValueChange={setBillingEnabled}
              trackColor={{ true: '#1A73E8', false: '#E0E0E0' }}
              thumbColor="#FFFFFF"
            />
          </View>
          {billingEnabled && (
            <View className="p-4">
              <Text className="text-[10px] text-text-secondary">{t('gstinNumber')}</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-bold text-text">{gstInput || gstFromAuth}</Text>
                {gstVerified && (
                  <Text className="text-[10px] font-bold text-success">✓ {t('verified').toUpperCase()}</Text>
                )}
              </View>
              <Text className="mt-3 text-[10px] text-text-secondary">{t('businessLegalName')}</Text>
              <Text className="text-sm font-bold text-text">{companyName}</Text>
              <Text className="mt-3 text-[10px] text-text-secondary">{t('billingCompanyName')}</Text>
              <Text className="text-sm font-bold text-text">
                {companyName.replace(' Ltd.', '')} (Mumbai Unit)
              </Text>
              <ScaledPressable className="mt-4 items-center rounded-lg border border-primary py-2.5">
                <Text className="font-semibold text-primary">{t('editDetails')}</Text>
              </ScaledPressable>
              <View className="mt-3 flex-row items-start gap-2 rounded-lg bg-trust p-3">
                <Ionicons name="information-circle-outline" size={16} color="#1A73E8" />
                <Text className="flex-1 text-xs text-text-secondary">
                  {t('gstHelp')}
                </Text>
              </View>
              <ScaledPressable
                onPress={() => setSaveGst((v) => !v)}
                className="mt-3 flex-row items-center gap-2">
                <Ionicons
                  name={saveGst ? 'checkbox' : 'square-outline'}
                  size={18}
                  color="#1A73E8"
                />
                <Text className="text-sm text-text">{t('saveGstDetails')}</Text>
              </ScaledPressable>
            </View>
          )}
        </View>

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-sm text-text">{t('needGstInvoice')}</Text>
          <Switch
            value={invoiceNeeded}
            onValueChange={setInvoiceNeeded}
            trackColor={{ true: '#FEB623', false: '#E0E0E0' }}
            thumbColor="#FFFFFF"
          />
        </View>
        {invoiceNeeded && (
          <View className="mb-4 rounded-card border border-border bg-trust p-3">
            <Text className="text-sm font-bold text-text">{companyName}</Text>
            <Text className="text-xs text-text-secondary">GSTIN: {gstInput || gstFromAuth}</Text>
          </View>
        )}

        <Text className="mb-2 text-[10px] font-bold tracking-widest text-text-secondary">
          {t('paymentMethod').toUpperCase()}
        </Text>
        <Text className="mb-3 text-xs font-semibold text-text-secondary">
          {t('upiPayments')}
        </Text>
        {UPI_OPTIONS.map((opt) => {
          const selected = paymentMethod === opt.id;
          return (
            <ScaledPressable
              key={opt.id}
              onPress={() => setPaymentMethod(opt.id)}
              className={`mb-2 flex-row items-center rounded-card border-2 p-4 ${
                selected ? 'border-primary bg-primary/5' : 'border-border bg-surface'
              }`}>
              <View
                className={`mr-3 h-5 w-5 rounded-full border-2 ${
                  selected ? 'border-primary bg-primary' : 'border-border'
                }`}
              />
              <Text className={`font-semibold ${selected ? 'text-primary' : 'text-text'}`}>
                {opt.label}
              </Text>
            </ScaledPressable>
          );
        })}

        <Text className="mb-3 mt-2 text-xs font-semibold text-text-secondary">{t('otherOptions')}</Text>
        {OTHER_OPTIONS.map((opt) => (
          <ScaledPressable
            key={opt.id}
            onPress={() => setPaymentMethod(opt.id)}
            className="mb-2 flex-row items-center justify-between rounded-card border border-border bg-surface p-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={20} color="#666" />
              <Text className="text-sm font-medium text-text">{t(opt.labelKey)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </ScaledPressable>
        ))}

        <View className="mb-4 mt-4 rounded-card border border-border bg-surface p-4">
          <Text className="mb-3 font-bold text-text">{t('deliveryInstructions')}</Text>
          <TextInput
            className="min-h-[80px] rounded-lg border border-border bg-background p-3 text-sm text-text"
            placeholder={t('deliveryInstructionsPlaceholder')}
            placeholderTextColor="#999"
            multiline
            value={instructions}
            onChangeText={setInstructions}
          />
          <View className="mt-3 flex-row flex-wrap gap-2">
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

        <View className="mb-4 rounded-card border border-border bg-surface p-4">
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
              onChangeText={(t) => selectLoyalty(Number(t.replace(/\D/g, '')) || 0)}
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
          <View className="mt-3 flex-row gap-2">
            {(['priorityDispatch', 'bulkDiscounts'] as const).map((badgeKey) => (
              <View key={badgeKey} className="rounded-md bg-trust px-2 py-1">
                <Text className="text-[9px] font-bold text-secondary">{t(badgeKey)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-text">{t('orderSummary')}</Text>
            <View className="rounded-full bg-primary/10 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-primary">
                {items.length} {t('activeItems').toUpperCase()}
              </Text>
            </View>
          </View>
          {items.map((item) => (
            <View key={item.id} className="mt-3 flex-row items-center gap-3">
              <Image
                source={getCartItemImageSource(item)}
                style={{ width: 48, height: 48, borderRadius: 8 }}
                contentFit="cover"
              />
              <View className="flex-1">
                <Text className="text-sm font-bold text-text" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-xs text-text-secondary">
                  {item.unit} × {item.quantity}
                </Text>
              </View>
              <Text className="text-sm font-bold text-text">{formatINR(getLineTotal(item))}</Text>
            </View>
          ))}
          <View className="mt-4 gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-text-secondary">{t('subtotal')}</Text>
              <Text className="text-sm font-semibold">{formatINR(subtotal)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-text-secondary">{t('shippingLogistics')}</Text>
              <Text className="text-sm font-bold text-success">{t('free')}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-text-secondary">{t('taxes')}</Text>
              <Text className="text-sm font-semibold">{formatINR(gst)}</Text>
            </View>
            {loyaltyRedemption > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-primary">{t('loyaltyRedemption')}</Text>
                <Text className="text-sm font-semibold text-primary">
                  -{formatINR(loyaltyRedemption)}
                </Text>
              </View>
            )}
          </View>
          <View className="my-3 h-px bg-border" />
          <View className="flex-row justify-between">
            <Text className="font-bold text-text">{t('totalAmount')}</Text>
            <Text className="text-xl font-bold text-primary">{formatINR(checkoutTotal)}</Text>
          </View>
          {corporateSavings > 0 && (
            <View className="mt-3 flex-row items-center gap-2 rounded-lg bg-success/10 p-3">
              <Ionicons name="checkmark-circle" size={16} color="#388E3C" />
              <Text className="text-xs font-medium text-success">
                {t('youAreSaving')} {formatINR(corporateSavings)}
              </Text>
            </View>
          )}
          <View className="mt-4 flex-row justify-between">
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
        </View>

        <ScaledPressable
          onPress={handlePay}
          disabled={paying || items.length === 0}
          className={`flex-row items-center justify-center rounded-pill py-4 ${
            paySuccess ? 'bg-success' : 'bg-primary'
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
  );
}
