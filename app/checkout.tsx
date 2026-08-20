import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { Alert, ActivityIndicator, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
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
import { CheckoutDeliveryQuote } from '@components/checkout/CheckoutDeliveryQuote';
import type { CheckoutDeliveryStatus } from '@components/checkout/CheckoutDeliveryQuote';
import { DeliveryDestinationCard } from '@components/checkout/DeliveryDestinationCard';
import { DeliveryPreferenceSection } from '@components/checkout/DeliveryPreferenceSection';
import { PaymentComingSoonSheet } from '@components/checkout/PaymentComingSoonSheet';
import { PaymentMethodCard } from '@components/checkout/PaymentMethodCard';
import { SitesPickerSheet } from '@components/checkout/SitesPickerSheet';
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
import { useLoyaltyStore } from '@store/loyaltyStore';
import { useOrderStore } from '@store/orderStore';
import { buildOrderFromCheckout } from '@utils/orderHelpers';
import { normalizeApiOrder } from '@utils/orderAdapters';
import { ORDERS_QUERY_KEY } from '@hooks/useOrders';
import { useServiceability } from '@hooks/useServiceability';
import { useDeliveryEta } from '@hooks/useDeliveryEta';
import { placeOrder } from '@services/orders.api';
import { syncLocalCartToServer } from '@services/cart.api';
import {
  fetchCheckoutPreview,
  type CheckoutPreview,
} from '@services/checkout.api';
import { formatEtaLabel, holdDeliverySlot, type DeliveryEtaResult } from '@services/delivery.api';
import { safeGoBack } from '@utils/navigation';
import { requireAuth } from '@utils/requireAuth';
import { formatINR } from '@utils/formatCurrency';
import {
  calculateLoyaltyDiscountPreview,
} from '@utils/loyaltyPricing';
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
import { isValidDeliveryCoordinates } from '@utils/geo';
import type { GstValidationResult } from '@/types/gst';
import type {
  DeliveryPreferenceType,
  DeliverySlotOption,
} from '@/types/deliveryPreference';

const QUICK_CHIP_KEYS = ['callOnArrival', 'leaveAtSecurity', 'heavyVehicleAccess'] as const;

type ActiveSheet =
  | { type: 'gst' }
  | { type: 'payment'; title: string; message: string }
  | null;

function getApiErrorMessage(error: unknown): string {
  const axiosData = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data;
  const apiMessage = Array.isArray(axiosData?.message)
    ? axiosData.message.join(', ')
    : axiosData?.message;
  return (
    apiMessage ||
    (error instanceof Error ? error.message : 'Unable to calculate delivery right now.')
  );
}

function isAddressId(value?: string): value is string {
  return !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
}

function previewFromEta(
  eta: DeliveryEtaResult,
  localSubtotal: number,
  loyalty: {
    points: number;
    value: number;
    minOrder: number;
    used: number;
    discount: number;
  },
): CheckoutPreview {
  const deliveryCharge = eta.freeDelivery ? 0 : eta.deliveryCharge ?? 0;
  return {
    subtotal: localSubtotal,
    gstAmount: 0,
    deliveryCharge,
    grandTotal: Math.max(0, localSubtotal + deliveryCharge - loyalty.discount),
    itemCount: 1,
    membershipDiscount: 0,
    loyaltyPoints: loyalty.points,
    redeemablePoints: loyalty.points,
    maxRedeemablePoints: loyalty.used || loyalty.points,
    loyaltyUsed: loyalty.used,
    loyaltyDiscount: loyalty.discount,
    loyaltyAvailableValue: loyalty.value,
    pointValueInr: 0.01,
    minRedeemOrderValue: loyalty.minOrder,
    redemptionEligible: localSubtotal >= loyalty.minOrder && loyalty.points > 0,
    estimatedEarnPoints: 0,
    estimatedEarnValue: 0,
    discount: loyalty.discount,
    loadingCharges: 0,
    unloadingCharges: 0,
    bikeDeliveryFree: Boolean(eta.freeDelivery),
    companyAbsorbedDelivery: 0,
    freeBikeDeliveriesRemaining: 0,
    serviceable: eta.serviceable,
    deliveryETA: eta.deliveryETA,
    deliveryEtaMinMinutes: eta.etaMinMinutes,
    deliveryEtaMaxMinutes: eta.etaMaxMinutes,
    deliveryMessage: formatEtaLabel(eta),
    deliveringBy: eta.deliveringBy,
    deliveryVehicleType: eta.deliveryVehicleType as CheckoutPreview['deliveryVehicleType'],
    deliveryVehicleDisplayName: eta.deliveryVehicleDisplayName,
    deliveryVehicleImageUrl: eta.deliveryVehicleImageUrl,
    deliveryDistanceKm: eta.deliveryDistanceKm,
    deliveryVehicleCount: eta.deliveryVehicleCount,
    freeDeliveryApplied: eta.freeDelivery,
  };
}

function isMissingAddressError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  const message = getApiErrorMessage(error);
  return status === 404 || /no delivery address/i.test(message);
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

  const { isLoading: sitesLoading } = useSites(true);

  const selectedSite = useDeliveryStore((s) => {
    const fromSites = s.sites.find((x) => x.id === s.selectedSiteId) ?? s.sites[0];
    if (fromSites) return fromSites;
    const primary = s.profileSites.find((x) => x.isPrimary) ?? s.profileSites[0];
    return primary
      ? { id: primary.id, name: primary.name, address: primary.address }
      : undefined;
  });

  const destinationSite = useDeliveryStore((s) => {
    return (
      s.profileSites.find((x) => x.id === s.selectedSiteId) ??
      s.profileSites.find((x) => x.isPrimary) ??
      s.profileSites[0]
    );
  });
  const hasDestinationCoords = isValidDeliveryCoordinates(
    destinationSite?.latitude,
    destinationSite?.longitude,
  );
  const addressPickerRef = useRef<BottomSheetModal>(null);
  const quoteRequestSeq = useRef(0);
  const openAddressPicker = useCallback(() => {
    addressPickerRef.current?.present();
  }, []);

  const {
    refresh: refreshServiceability,
  } = useServiceability({
    latitude: destinationSite?.latitude,
    longitude: destinationSite?.longitude,
    autoCheck: false,
  });

  const {
    eta,
    label: etaLabel,
    isLoading: etaLoading,
    refresh: refreshEta,
  } = useDeliveryEta({
    latitude: destinationSite?.latitude,
    longitude: destinationSite?.longitude,
    autoFetch: hasDestinationCoords,
  });

  const availablePoints = useLoyaltyStore((s) => s.totalPoints);
  const availableValue = useLoyaltyStore((s) => s.availableValue);
  const refreshLoyalty = useLoyaltyStore((s) => s.refresh);
  const minRedeemOrderValue =
    useLoyaltyStore((s) => s.summary?.minRedeemOrderValue) ?? 500;
  const pointValueInr = useLoyaltyStore((s) => s.summary?.pointValueInr) ?? 0.01;
  const maxRedeemPercent =
    useLoyaltyStore((s) => s.summary?.maxOrderRedeemPercent) ?? 0.3;

  useEffect(() => {
    void refreshLoyalty();
  }, [refreshLoyalty]);

  useEffect(() => {
    if (hasDestinationCoords) {
      useEtaStore.getState().setLocation(
        destinationSite!.latitude!,
        destinationSite!.longitude!,
      );
    } else {
      useEtaStore.getState().clearEta();
    }
  }, [
    destinationSite?.id,
    destinationSite?.latitude,
    destinationSite?.longitude,
    hasDestinationCoords,
  ]);

  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(DEFAULT_PAYMENT_METHOD);
  const [instructions, setInstructions] = useState('');
  const [useLoyalty, setUseLoyalty] = useState(
    () => useCartStore.getState().pointsApplied,
  );
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreview | null>(null);
  const [previewSourceKey, setPreviewSourceKey] = useState('');
  const [preferenceType, setPreferenceType] = useState<DeliveryPreferenceType>('ASAP');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlotOption | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const savingsOpacity = useSharedValue(1);

  const cartSignature = useMemo(
    () =>
      items
        .map((i) => `${i.id}:${i.quantity}:${i.unitPrice}:${i.bulkPrice}`)
        .join('|'),
    [items],
  );
  const quoteSourceKey = `${selectedSite?.id ?? ''}|${cartSignature}|${hasDestinationCoords ? '1' : '0'}`;

  const localSubtotal = useMemo(
    () => items.reduce((sum, i) => sum + getLineTotal(i), 0),
    [items],
  );

  const refreshCheckoutPreview = useCallback(
    async (applyLoyalty: boolean) => {
      if (items.length === 0) return;

      if (!selectedSite?.id) {
        setDeliveryError(null);
        setQuoteLoading(false);
        setLoyaltyLoading(false);
        setPreviewSourceKey(quoteSourceKey);
        return;
      }

      if (!hasDestinationCoords) {
        setDeliveryError(null);
        setQuoteLoading(false);
        setLoyaltyLoading(false);
        setPreviewSourceKey(quoteSourceKey);
        return;
      }

      setQuoteLoading(true);
      setLoyaltyLoading(true);
      setLoyaltyError(null);
      setDeliveryError(null);
      const requestId = ++quoteRequestSeq.current;
      const addressId = isAddressId(selectedSite.id) ? selectedSite.id : undefined;
      try {
        await syncLocalCartToServer(items);
        if (requestId !== quoteRequestSeq.current) return;
        const base = await fetchCheckoutPreview({
          addressId,
          loyaltyPointsToRedeem: 0,
        });
        if (requestId !== quoteRequestSeq.current) return;

        if (!applyLoyalty || !base.redemptionEligible || base.maxRedeemablePoints <= 0) {
          setCheckoutPreview(base);
          return;
        }

        try {
          const withLoyalty = await fetchCheckoutPreview({
            addressId,
            loyaltyPointsToRedeem: base.maxRedeemablePoints,
          });
          if (requestId !== quoteRequestSeq.current) return;
          setCheckoutPreview(withLoyalty);
          setLoyaltyError(null);
          savingsOpacity.value = withSequence(
            withTiming(0.4, { duration: 100 }),
            withTiming(1, { duration: 200 }),
          );
        } catch {
          if (requestId !== quoteRequestSeq.current) return;
          setCheckoutPreview(base);
          setLoyaltyError('Unable to apply BajriPro Points. Please try again.');
        }
      } catch (e) {
        if (requestId !== quoteRequestSeq.current) return;
        if (isMissingAddressError(e)) {
          setDeliveryError(null);
          return;
        }
        setDeliveryError(getApiErrorMessage(e));
        void refreshEta();
      } finally {
        if (requestId !== quoteRequestSeq.current) return;
        setPreviewSourceKey(quoteSourceKey);
        setQuoteLoading(false);
        setLoyaltyLoading(false);
      }
    },
    [items, selectedSite?.id, hasDestinationCoords, quoteSourceKey, savingsOpacity, refreshEta],
  );

  useEffect(() => {
    void refreshCheckoutPreview(useLoyalty);
    // Recalculate when cart contents, site, or coordinates change
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: useLoyalty handled by toggle
  }, [cartSignature, selectedSite?.id, hasDestinationCoords]);

  useEffect(() => {
    setPreferenceType('ASAP');
    setSelectedSlotId(null);
    setSelectedSlot(null);
    setScheduleDate(null);
  }, [quoteSourceKey]);

  useEffect(() => {
    const options = checkoutPreview?.deliveryOptions;
    if (!options?.serviceable) return;
    const fallback = options.defaultPreference ?? 'ASAP';
    setPreferenceType((current) => {
      if (current === 'ASAP' && options.asap.available) return current;
      if (current === 'TODAY' && options.today.available) return current;
      if (current === 'TOMORROW' && options.tomorrow.available) return current;
      if (current === 'SCHEDULED' && options.scheduled.length > 0) return current;
      return fallback;
    });
    if (!scheduleDate && options.scheduled[0]?.date) {
      setScheduleDate(options.scheduled[0].date);
    }
  }, [checkoutPreview?.deliveryOptions, scheduleDate]);

  const localLoyalty = useMemo(
    () =>
      calculateLoyaltyDiscountPreview({
        pointsApplied: useLoyalty,
        availablePoints,
        orderValueInr: localSubtotal,
        minOrderValue: minRedeemOrderValue,
        maxRedeemPercent,
        pointValueInr,
      }),
    [
      useLoyalty,
      availablePoints,
      localSubtotal,
      minRedeemOrderValue,
      maxRedeemPercent,
      pointValueInr,
    ],
  );

  const etaPreview = useMemo(() => {
    if (!eta || !etaLabel) return null;
    return previewFromEta(eta, localSubtotal, {
      points: availablePoints,
      value: availableValue,
      minOrder: minRedeemOrderValue,
      used: useLoyalty ? localLoyalty.redeemablePoints : 0,
      discount: useLoyalty ? localLoyalty.discountAmount : 0,
    });
  }, [
    eta,
    etaLabel,
    localSubtotal,
    availablePoints,
    availableValue,
    minRedeemOrderValue,
    useLoyalty,
    localLoyalty.redeemablePoints,
    localLoyalty.discountAmount,
  ]);

  const displayPreview = checkoutPreview ?? etaPreview;
  const subtotal = displayPreview?.subtotal ?? localSubtotal;
  const deliveryCharge = displayPreview?.deliveryCharge ?? 0;
  const loadingCharges = displayPreview?.loadingCharges ?? 0;
  const unloadingCharges = displayPreview?.unloadingCharges ?? 0;
  const serverLoyaltyApplied = (checkoutPreview?.loyaltyUsed ?? 0) > 0;
  const loyaltyPoints = serverLoyaltyApplied
    ? checkoutPreview!.loyaltyUsed
    : useLoyalty
      ? localLoyalty.redeemablePoints
      : 0;
  const loyaltyRedemption = serverLoyaltyApplied
    ? checkoutPreview!.loyaltyDiscount
    : useLoyalty
      ? localLoyalty.discountAmount
      : 0;
  const bikeDelivery = displayPreview?.bikeDeliveryFree ?? false;

  const quoteIsStale = previewSourceKey !== quoteSourceKey;
  const deliveryQuoteStatus: CheckoutDeliveryStatus = (() => {
    if (sitesLoading && !selectedSite) return 'loading';
    if (!selectedSite) return 'no_address';
    if (!hasDestinationCoords) return 'invalid_location';
    if ((quoteLoading || etaLoading) && !displayPreview) return 'loading';
    if (quoteIsStale && quoteLoading && !displayPreview) return 'loading';
    if (checkoutPreview?.serviceable) return 'available';
    if (eta?.serviceable && etaLabel) return 'available';
    if (checkoutPreview && checkoutPreview.serviceable === false) return 'unavailable';
    if (eta && eta.serviceable === false) return 'unavailable';
    if (deliveryError && !etaLabel) return 'error';
    if (displayPreview?.serviceable) return 'available';
    return quoteLoading || etaLoading ? 'loading' : 'error';
  })();

  const canPlaceOrder =
    items.length > 0 &&
    Boolean(selectedSite) &&
    hasDestinationCoords &&
    deliveryQuoteStatus === 'available' &&
    checkoutPreview?.serviceable !== false &&
    !quoteLoading &&
    !paying &&
    (preferenceType === 'ASAP' || Boolean(selectedSlotId));

  const loyaltyEligible =
    availablePoints > 0 && localSubtotal >= minRedeemOrderValue;

  const hasGstApplied = useGstStore((s) => s.verified);

  const preDiscountTotal = useMemo(
    () =>
      Math.max(
        0,
        (displayPreview?.grandTotal ?? subtotal + deliveryCharge) +
          (checkoutPreview ? 0 : loadingCharges + unloadingCharges - loyaltyRedemption),
      ),
    [
      displayPreview,
      checkoutPreview,
      subtotal,
      deliveryCharge,
      loadingCharges,
      unloadingCharges,
      loyaltyRedemption,
    ],
  );

  const gstBusinessDiscount = useMemo(
    () => (hasGstApplied ? computeGstBusinessDiscount(subtotal) : 0),
    [hasGstApplied, subtotal],
  );

  const gstDiscountPercent = formatGstDiscountPercent(DEFAULT_GST_DISCOUNT_CONFIG.rate);

  const checkoutTotal = displayPreview
    ? Math.max(0, displayPreview.grandTotal - (hasGstApplied ? gstBusinessDiscount : 0))
    : Math.max(0, preDiscountTotal - gstBusinessDiscount);

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

  const onToggleLoyalty = (enabled: boolean) => {
    setUseLoyalty(enabled);
    useCartStore.setState({ pointsApplied: enabled });
    void refreshCheckoutPreview(enabled);
  };

  const appendChip = (chip: string) => {
    setInstructions((prev) => {
      const next = prev ? `${prev}. ${chip}` : chip;
      return next.slice(0, 250);
    });
  };

  const handleSelectPreference = (type: DeliveryPreferenceType) => {
    setPreferenceType(type);
    if (type === 'ASAP') {
      setSelectedSlotId(null);
      setSelectedSlot(null);
      return;
    }
    const options = checkoutPreview?.deliveryOptions;
    if (type === 'SCHEDULED' && !scheduleDate && options?.scheduled[0]?.date) {
      setScheduleDate(options.scheduled[0].date);
    }
    const firstSlot =
      type === 'TODAY'
        ? options?.today.slots[0]
        : type === 'TOMORROW'
          ? options?.tomorrow.slots[0]
          : options?.scheduled.find((d) => d.date === (scheduleDate ?? options.scheduled[0]?.date))
              ?.slots[0];
    if (firstSlot) {
      void handleSelectSlot(firstSlot);
    } else {
      setSelectedSlotId(null);
      setSelectedSlot(null);
    }
  };

  const handleSelectSlot = async (slot: DeliverySlotOption) => {
    setSelectedSlotId(slot.slotId);
    setSelectedSlot(slot);
    setScheduleDate(slot.date);
    try {
      await holdDeliverySlot(slot.slotId);
    } catch (error) {
      const message = getApiErrorMessage(error);
      Alert.alert(t('slotNoLongerAvailable'), message || t('chooseAnotherSlot'));
      setSelectedSlotId(null);
      setSelectedSlot(null);
      void refreshCheckoutPreview(useLoyalty);
    }
  };

  useEffect(() => {
    if (preferenceType === 'ASAP' || selectedSlotId) return;
    const options = checkoutPreview?.deliveryOptions;
    if (!options?.serviceable) return;
    const firstSlot =
      preferenceType === 'TODAY'
        ? options.today.slots.find((slot) => slot.available)
        : preferenceType === 'TOMORROW'
          ? options.tomorrow.slots.find((slot) => slot.available)
          : options.scheduled
              .find((day) => day.date === (scheduleDate ?? options.scheduled[0]?.date))
              ?.slots.find((slot) => slot.available);
    if (firstSlot) {
      void handleSelectSlot(firstSlot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hold only when preference/options change
  }, [preferenceType, selectedSlotId, checkoutPreview?.deliveryOptions, scheduleDate]);

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
      Alert.alert(t('addDeliveryAddress'), t('addAddressToCalculateDelivery'));
      openAddressPicker();
      return;
    }

    if (!hasDestinationCoords) {
      Alert.alert(t('pleaseSelectValidLocation'), t('invalidLocationHint'));
      openAddressPicker();
      return;
    }

    if (checkoutPreview?.serviceable === false) {
      Alert.alert(t('deliveryUnavailableAtLocation'), t('changeAddressToContinue'));
      return;
    }

    const latest = await refreshServiceability();
    if (!latest) {
      Alert.alert(
        t('deliveryAvailabilityUnconfirmed'),
        t('unableToCalculateDelivery'),
      );
      return;
    }
    if (!latest.serviceable) {
      Alert.alert(t('deliveryUnavailableAtLocation'), t('changeAddressToContinue'));
      return;
    }

    setPaying(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await syncLocalCartToServer(items);

      const remark = instructions.trim().slice(0, 250) || undefined;
      const placed = await placeOrder({
        addressId: selectedSite.id,
        notes: remark,
        paymentMethod: 'CASH',
        loyaltyPointsToRedeem: loyaltyPoints > 0 ? loyaltyPoints : undefined,
        deliveryPreferenceType: preferenceType,
        scheduledSlotId: selectedSlotId ?? undefined,
        deliveryCustomerRemark: remark,
      });

      setPaySuccess(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const apiOrder = normalizeApiOrder(placed as Record<string, unknown>);
      const orderId = apiOrder.id || apiOrder.orderNumber;
      const preference = (
        placed as {
          deliveryPreference?: {
            label?: string;
            scheduledSlotLabel?: string;
            scheduledDateLabel?: string;
          };
        }
      ).deliveryPreference;
      const deliveryEtaLabel =
        preference?.scheduledDateLabel && preference.scheduledSlotLabel
          ? `${preference.scheduledDateLabel}, ${preference.scheduledSlotLabel}`
          : selectedSlot
            ? `${selectedSlot.dateLabel}, ${selectedSlot.label}`
            : checkoutPreview?.deliveryOptions?.asap.etaLabel ||
              apiOrder.expectedDelivery ||
              displayPreview?.deliveryMessage ||
              displayPreview?.deliveringBy ||
              t('updatingDeliveryEstimate');

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
      useCartStore.setState({ pointsApplied: false });
      void useLoyaltyStore.getState().refresh();
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
        <DeliveryDestinationCard site={selectedSite} onChange={openAddressPicker} />

        <DeliveryPreferenceSection
          options={checkoutPreview?.deliveryOptions ?? null}
          loading={quoteLoading || deliveryQuoteStatus === 'loading'}
          selectedType={preferenceType}
          selectedSlotId={selectedSlotId}
          selectedDate={scheduleDate}
          onSelectType={handleSelectPreference}
          onSelectSlot={(slot) => void handleSelectSlot(slot)}
          onSelectScheduleDate={(date) => {
            setScheduleDate(date);
            const next = checkoutPreview?.deliveryOptions?.scheduled.find((d) => d.date === date)
              ?.slots[0];
            if (next) void handleSelectSlot(next);
          }}
        />

        <View className="mb-3 rounded-card border border-border bg-surface p-4">
          <Text className="mb-2 font-bold text-text">{t('deliveryInstructions')}</Text>
          <TextInput
            className="min-h-[72px] rounded-lg border border-border bg-background p-3 text-sm text-text"
            placeholder={t('deliveryInstructionsPlaceholder')}
            placeholderTextColor="#999"
            multiline
            maxLength={250}
            value={instructions}
            onChangeText={(value) => setInstructions(value.slice(0, 250))}
          />
          <Text className="mt-1 text-right text-[10px] text-text-secondary">
            {instructions.length}/250
          </Text>
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

        <CheckoutDeliveryQuote
          status={deliveryQuoteStatus}
          preview={
            deliveryQuoteStatus === 'loading' && !displayPreview
              ? null
              : displayPreview
          }
          errorMessage={deliveryError}
          onRetry={() => {
            void refreshEta();
            void refreshCheckoutPreview(useLoyalty);
          }}
          onChangeAddress={openAddressPicker}
          onAddAddress={openAddressPicker}
          preferenceLabel={
            selectedSlot
              ? `${selectedSlot.dateLabel}, ${selectedSlot.label}`
              : preferenceType === 'ASAP'
                ? checkoutPreview?.deliveryOptions?.asap.etaLabel
                : null
          }
        />

        <View className="mb-3 rounded-card border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-text">BajriPro Points</Text>
            <Switch
              value={useLoyalty && loyaltyEligible}
              onValueChange={onToggleLoyalty}
              disabled={loyaltyLoading || !loyaltyEligible}
              trackColor={{ false: '#E5E5E5', true: '#FEB623' }}
              thumbColor="#FFFFFF"
            />
          </View>
          {loyaltyLoading && availablePoints <= 0 ? (
            <Text className="mt-2 text-xs text-text-secondary">Checking available points…</Text>
          ) : (
            <View className="mt-3 flex-row justify-between">
              <Text className="text-sm font-bold text-text">
                Balance: {availablePoints.toLocaleString('en-IN')} Points
              </Text>
              <Text className="text-sm text-text-secondary">
                Value: {formatINR(availableValue)}
              </Text>
            </View>
          )}
          {loyaltyError ? (
            <Text className="mt-2 text-xs text-error">{loyaltyError}</Text>
          ) : !loyaltyEligible ? (
            <Text className="mt-2 text-xs text-text-secondary">
              {availablePoints <= 0
                ? 'Earn 1% cashback as BajriPro Points on eligible orders'
                : `Add ₹${Math.max(0, minRedeemOrderValue - localSubtotal).toLocaleString('en-IN')} more to use BajriPro Points`}
            </Text>
          ) : (
            <Text className="mt-2 text-xs text-text-secondary">
              Apply BajriPro Points at checkout (orders ₹
              {minRedeemOrderValue}+). 100 points = ₹1.
            </Text>
          )}
          {useLoyalty && loyaltyEligible && loyaltyRedemption > 0 ? (
            <>
              <Text className="mt-2 text-xs text-text-secondary">
                ✓ {loyaltyPoints.toLocaleString('en-IN')} BajriPro Points applied
              </Text>
              <Animated.View
                style={savingsAnimStyle}
                className="mt-3 flex-row items-center gap-2 rounded-lg bg-primary/10 p-3">
                <Text className="text-lg">✓</Text>
                <Text className="text-sm font-medium text-primary">
                  You saved {formatINR(loyaltyRedemption)} using BajriPro Points
                </Text>
              </Animated.View>
            </>
          ) : null}
          {displayPreview && displayPreview.estimatedEarnPoints > 0 ? (
            <Text className="mt-3 text-xs text-text-secondary">
              You will earn {displayPreview.estimatedEarnPoints.toLocaleString('en-IN')}{' '}
              BajriPro Points (
              {formatINR(
                displayPreview.estimatedEarnValue ??
                  displayPreview.estimatedEarnPoints *
                    (displayPreview.pointValueInr ?? 0.01),
              )}
              ) — 1% cashback after successful delivery
            </Text>
          ) : null}
          {displayPreview && displayPreview.freeBikeDeliveriesRemaining > 0 ? (
            <Text className="mt-1 text-xs text-success">
              Free bike deliveries remaining: {displayPreview.freeBikeDeliveriesRemaining}
              {displayPreview.bikeDeliveryFree || displayPreview.freeDeliveryApplied
                ? ' · Delivery FREE'
                : ''}
              {displayPreview.freeBikeDeliveriesAllowed != null &&
              displayPreview.freeBikeDeliveriesUsed != null
                ? ` · ${displayPreview.freeBikeDeliveriesUsed} of ${displayPreview.freeBikeDeliveriesAllowed} used`
                : ''}
            </Text>
          ) : null}
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
          gstAmount={checkoutPreview?.gstAmount ?? 0}
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
          disabled={!canPlaceOrder}
          className={`mt-3 flex-row items-center justify-center rounded-pill py-4 ${
            paySuccess ? 'bg-success' : canPlaceOrder ? 'bg-primary' : 'bg-border'
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

      <SitesPickerSheet
        ref={addressPickerRef}
        returnTo="checkout"
        onClose={() => addressPickerRef.current?.dismiss()}
      />
    </Fragment>
  );
}
