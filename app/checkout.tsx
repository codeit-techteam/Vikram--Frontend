import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { Alert, ActivityIndicator, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
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
import { DeliveryTermsSection } from '@components/checkout/DeliveryTermsSection';
import { PaymentMethodCard } from '@components/checkout/PaymentMethodCard';
import { RazorpayWebCheckout } from '@components/checkout/RazorpayWebCheckout';
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
import { useAuthStore } from '@store/useAuthStore';
import { useOrderStore } from '@store/orderStore';
import { buildOrderFromCheckout } from '@utils/orderHelpers';
import { normalizeApiOrder } from '@utils/orderAdapters';
import { ORDERS_QUERY_KEY } from '@hooks/useOrders';
import { useServiceability } from '@hooks/useServiceability';
import { useDeliveryEta } from '@hooks/useDeliveryEta';
import { useCheckoutDeliveryOptions } from '@hooks/useCheckoutDeliveryOptions';
import {
  getApiErrorMessage as readApiErrorMessage,
  getApiErrorStatus,
  isCancelledApiError,
} from '@services/api';
import { placeOrder } from '@services/orders.api';
import {
  cancelRazorpayPayment,
  createRazorpayOrder,
  readPaymentApiError,
  verifyRazorpayPayment,
} from '@services/payments.api';
import { syncLocalCartToServer } from '@services/cart.api';
import {
  fetchCheckoutPreview,
  type CheckoutPreview,
} from '@services/checkout.api';
import { formatEtaLabel, holdDeliverySlot, type DeliveryEtaResult } from '@services/delivery.api';
import { safeGoBack } from '@utils/navigation';
import { logCheckoutEvent } from '@utils/checkoutLogger';
import { describeClosedDays } from '@utils/deliverySchedule';
import { childAbortController, withDeadline } from '@utils/withDeadline';
import {
  isRetryableQuoteError,
  QUOTE_MAX_ATTEMPTS,
  QUOTE_RETRY_DELAY_MS,
  quoteMatchesCart,
} from '@utils/checkoutQuote';
import { DELIVERY_TERMS_VERSION } from '@constants/terms';
import { requireAuth } from '@utils/requireAuth';
import { formatINR } from '@utils/formatCurrency';
import {
  calculateLoyaltyDiscountPreview,
} from '@utils/loyaltyPricing';
import {
  formatGstDiscountPercent,
  DEFAULT_GST_DISCOUNT_CONFIG,
} from '@utils/gstPricing';
import {
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_METHODS,
  type PaymentMethodId,
} from '@constants/paymentMethods';
import { isValidDeliveryCoordinates } from '@utils/geo';
import {
  buildRazorpayOptions,
  INCOMPLETE_RESPONSE_CODE,
  isNativeRazorpayAvailable,
  openNativeRazorpayCheckout,
  RazorpayCheckoutError,
  type NativeRazorpayOptions,
  type RazorpayCheckoutSuccess,
} from '@lib/openRazorpayCheckout';
import { clearPendingPayment, savePendingPayment } from '@lib/pendingPayment';
import type { GstValidationResult } from '@/types/gst';
import type {
  DeliveryPreferenceType,
  DeliverySlotOption,
} from '@/types/deliveryPreference';
import { HEAVY_VEHICLE_TYPES } from '@/types/deliveryPreference';

const QUICK_CHIP_KEYS = ['callOnArrival', 'leaveAtSecurity', 'heavyVehicleAccess'] as const;
type QuickChipKey = (typeof QUICK_CHIP_KEYS)[number];

function createIdempotencyKey(): string {
  return `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

type ActiveSheet =
  | { type: 'gst' }
  | null;

/** Whole quote chain (cart sync + preview + optional loyalty preview) must settle within this. */
const QUOTE_DEADLINE_MS = 25000;
const CART_SYNC_DEADLINE_MS = 8000;

function getApiErrorMessage(error: unknown): string {
  return readApiErrorMessage(error, 'Unable to calculate delivery right now.');
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
  return (
    getApiErrorStatus(error) === 404 || /no delivery address/i.test(getApiErrorMessage(error))
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
  const quoteAbortRef = useRef<AbortController | null>(null);
  const failedSlotIdsRef = useRef<Set<string>>(new Set());
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

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const customer = useAuthStore((s) => s.customer);
  const { retryOrderId } = useLocalSearchParams<{ retryOrderId?: string }>();
  const availablePoints = useLoyaltyStore((s) => s.totalPoints);
  const availableValue = useLoyaltyStore((s) => s.availableValue);
  const refreshLoyalty = useLoyaltyStore((s) => s.refresh);
  const minRedeemOrderValue =
    useLoyaltyStore((s) => s.summary?.minRedeemOrderValue) ?? 500;
  const pointValueInr = useLoyaltyStore((s) => s.summary?.pointValueInr) ?? 0.01;
  const maxRedeemPercent =
    useLoyaltyStore((s) => s.summary?.maxOrderRedeemPercent) ?? 0.3;

  useEffect(() => {
    if (!isLoggedIn) return;
    void refreshLoyalty();
  }, [isLoggedIn, refreshLoyalty]);

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
  const [instructionFlags, setInstructionFlags] = useState<Record<QuickChipKey, boolean>>({
    callOnArrival: false,
    leaveAtSecurity: false,
    heavyVehicleAccess: false,
  });
  const [openAreaConfirmed, setOpenAreaConfirmed] = useState<boolean | null>(null);
  const placeIdempotencyKeyRef = useRef<string | null>(null);
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
  const [deliveryTermsAccepted, setDeliveryTermsAccepted] = useState(false);
  const [showTermsHint, setShowTermsHint] = useState(false);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [webCheckoutOptions, setWebCheckoutOptions] =
    useState<NativeRazorpayOptions | null>(null);
  const onlineSessionRef = useRef<{
    internalOrderId: string;
    orderNumber: string;
    razorpayOrderId: string | null;
  } | null>(null);

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
      quoteAbortRef.current?.abort();
      const controller = new AbortController();
      quoteAbortRef.current = controller;
      const addressId = isAddressId(selectedSite.id) ? selectedSite.id : undefined;
      const startedAt = Date.now();
      logCheckoutEvent('quote_started', { requestId, items: items.length, applyLoyalty });

      const runQuote = async (attempt: number, attemptController: AbortController) => {
        const syncController = childAbortController(attemptController);
        const syncStartedAt = Date.now();
        try {
          await withDeadline(
            syncLocalCartToServer(items, { signal: syncController.signal }),
            CART_SYNC_DEADLINE_MS,
            t('deliveryEstimateSlow'),
            syncController,
          );
          logCheckoutEvent('quote_cart_synced', { requestId, attempt, ms: Date.now() - syncStartedAt });
        } catch (syncError) {
          if (attemptController.signal.aborted || !isRetryableQuoteError(syncError)) throw syncError;
          // The server cart may already match; the line check below decides.
          logCheckoutEvent('quote_cart_sync_slow', {
            requestId,
            attempt,
            ms: Date.now() - syncStartedAt,
            code: (syncError as { code?: string })?.code ?? null,
          });
        }
        if (requestId !== quoteRequestSeq.current) return;

        const previewStartedAt = Date.now();
        const base = await fetchCheckoutPreview({
          addressId,
          loyaltyPointsToRedeem: 0,
          signal: attemptController.signal,
        });
        logCheckoutEvent('quote_priced', { requestId, attempt, ms: Date.now() - previewStartedAt });
        if (requestId !== quoteRequestSeq.current) return;
        if (!quoteMatchesCart(base.items, items)) {
          throw {
            code: 'CART_OUT_OF_SYNC',
            statusCode: 409,
            message: 'Your cart is still updating. Please retry in a moment.',
          };
        }

        if (!applyLoyalty || !base.redemptionEligible || base.maxRedeemablePoints <= 0) {
          setCheckoutPreview(base);
          return;
        }

        try {
          const withLoyalty = await fetchCheckoutPreview({
            addressId,
            loyaltyPointsToRedeem: base.maxRedeemablePoints,
            signal: attemptController.signal,
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
      };

      try {
        for (let attempt = 1; ; attempt += 1) {
          const attemptController = childAbortController(controller);
          try {
            await withDeadline(
              runQuote(attempt, attemptController),
              QUOTE_DEADLINE_MS,
              t('deliveryEstimateSlow'),
              attemptController,
            );
            break;
          } catch (attemptError) {
            if (requestId !== quoteRequestSeq.current || controller.signal.aborted) throw attemptError;
            if (attempt >= QUOTE_MAX_ATTEMPTS || !isRetryableQuoteError(attemptError)) {
              throw attemptError;
            }
            logCheckoutEvent('quote_retry', {
              requestId,
              attempt,
              code: (attemptError as { code?: string })?.code ?? null,
            });
            await new Promise((resolve) => setTimeout(resolve, QUOTE_RETRY_DELAY_MS * attempt));
            if (requestId !== quoteRequestSeq.current) return;
          }
        }
        if (requestId === quoteRequestSeq.current) {
          logCheckoutEvent('quote_loaded', { requestId, ms: Date.now() - startedAt });
        }
      } catch (e) {
        if (requestId !== quoteRequestSeq.current) return;
        logCheckoutEvent('quote_failed', {
          requestId,
          ms: Date.now() - startedAt,
          status: getApiErrorStatus(e) ?? null,
          code: (e as { code?: string })?.code ?? null,
        });
        if (isCancelledApiError(e)) return;
        if (isMissingAddressError(e)) {
          setDeliveryError(null);
          return;
        }
        setDeliveryError(getApiErrorMessage(e));
      } finally {
        if (requestId === quoteRequestSeq.current) {
          setPreviewSourceKey(quoteSourceKey);
          setQuoteLoading(false);
          setLoyaltyLoading(false);
        }
      }
    },
    [items, selectedSite?.id, hasDestinationCoords, quoteSourceKey, savingsOpacity, t],
  );

  useEffect(() => () => quoteAbortRef.current?.abort(), []);

  useEffect(() => {
    void refreshCheckoutPreview(useLoyalty);
    // Recalculate when cart contents, site, or coordinates change
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: useLoyalty handled by toggle
  }, [cartSignature, selectedSite?.id, hasDestinationCoords]);

  const quoteIsStale = previewSourceKey !== quoteSourceKey;
  const deliveryOptionsQuery = useCheckoutDeliveryOptions({
    addressId: selectedSite?.id && isAddressId(selectedSite.id) ? selectedSite.id : undefined,
    cartSignature,
    enabled: items.length > 0 && hasDestinationCoords,
  });
  const deliveryOptions =
    (!quoteIsStale ? checkoutPreview?.deliveryOptions : undefined) ??
    deliveryOptionsQuery.data ??
    checkoutPreview?.deliveryOptions ??
    null;
  const deliveryOptionsLoading =
    !deliveryOptions && (deliveryOptionsQuery.fetchStatus === 'fetching' || quoteLoading);
  const deliveryOptionsError = deliveryOptionsQuery.error
    ? getApiErrorMessage(deliveryOptionsQuery.error)
    : null;
  const closedDaysLabel = describeClosedDays(deliveryOptions?.calendar);

  useEffect(() => {
    setPreferenceType('ASAP');
    setSelectedSlotId(null);
    setSelectedSlot(null);
    setScheduleDate(null);
    failedSlotIdsRef.current.clear();
  }, [quoteSourceKey]);

  useEffect(() => {
    const options = deliveryOptions;
    if (!options?.serviceable) return;
    const fallback = options.defaultPreference ?? 'ASAP';
    setPreferenceType((current) => {
      if (current === 'ASAP' && options.asap.available) return current;
      if (current === 'TODAY' && options.today.available) return current;
      if (current === 'TOMORROW' && options.tomorrow.available) return current;
      if (current === 'SCHEDULED' && options.scheduled.length > 0) return current;
      return fallback;
    });
    const firstBookableDate =
      options.scheduled.find(
        (day) => !day.isHoliday && day.slots.some((slot) => slot.available),
      )?.date ?? options.scheduled[0]?.date;
    if (!scheduleDate && firstBookableDate) {
      setScheduleDate(firstBookableDate);
    }
  }, [deliveryOptions, scheduleDate]);

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
  const requiresOpenArea = HEAVY_VEHICLE_TYPES.has(
    String(displayPreview?.deliveryVehicleType ?? ''),
  );

  // ETA is advisory: only the checkout quote (bounded by QUOTE_DEADLINE_MS) may show 'loading'.
  const deliveryQuoteStatus: CheckoutDeliveryStatus = (() => {
    if (sitesLoading && !selectedSite) return 'loading';
    if (!selectedSite) return 'no_address';
    if (!hasDestinationCoords) return 'invalid_location';
    if (checkoutPreview && !quoteIsStale) {
      return checkoutPreview.serviceable ? 'available' : 'unavailable';
    }
    if (quoteLoading) return displayPreview?.serviceable ? 'available' : 'loading';
    if (deliveryError) return 'error';
    if (checkoutPreview) return checkoutPreview.serviceable ? 'available' : 'unavailable';
    if (eta) return eta.serviceable && etaLabel ? 'available' : 'unavailable';
    return 'error';
  })();

  const slotRequirementMet = preferenceType === 'ASAP' || Boolean(selectedSlotId);
  const hasServerQuote = Boolean(checkoutPreview) && !quoteIsStale;
  const canPlaceOrder =
    items.length > 0 &&
    hasServerQuote &&
    Boolean(selectedSite) &&
    hasDestinationCoords &&
    deliveryQuoteStatus === 'available' &&
    checkoutPreview?.serviceable !== false &&
    !quoteLoading &&
    !paying &&
    slotRequirementMet &&
    deliveryTermsAccepted &&
    (!requiresOpenArea || openAreaConfirmed === true);

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

  // The backend applies no GST business discount; showing one would make the
  // on-screen total differ from the amount Razorpay charges.
  const gstBusinessDiscount = 0;

  const gstDiscountPercent = formatGstDiscountPercent(DEFAULT_GST_DISCOUNT_CONFIG.rate);

  const checkoutTotal = displayPreview
    ? Math.max(0, displayPreview.grandTotal)
    : Math.max(0, preDiscountTotal);

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

  const toggleInstructionFlag = (key: QuickChipKey) => {
    setInstructionFlags((prev) => {
      const next = !prev[key];
      if (next) {
        appendChip(t(key));
      }
      return { ...prev, [key]: next };
    });
  };

  const handleSelectPreference = (type: DeliveryPreferenceType) => {
    setPreferenceType(type);
    if (type === 'ASAP') {
      setSelectedSlotId(null);
      setSelectedSlot(null);
      return;
    }
    const options = deliveryOptions;
    if (type === 'SCHEDULED' && !scheduleDate && options?.scheduled[0]?.date) {
      setScheduleDate(options.scheduled[0].date);
    }
    const firstSlot = findBookableSlot(type, scheduleDate);
    if (firstSlot) {
      void handleSelectSlot(firstSlot);
    } else {
      setSelectedSlotId(null);
      setSelectedSlot(null);
    }
  };

  const findBookableSlot = (
    type: DeliveryPreferenceType,
    date: string | null,
  ): DeliverySlotOption | undefined => {
    const options = deliveryOptions;
    if (!options?.serviceable) return undefined;
    const bookable = (slot: DeliverySlotOption) =>
      slot.available && !failedSlotIdsRef.current.has(slot.slotId);
    if (type === 'TODAY') return options.today.slots.find(bookable);
    if (type === 'TOMORROW') return options.tomorrow.slots.find(bookable);
    if (type === 'SCHEDULED') {
      const day = options.scheduled.find((d) => d.date === (date ?? options.scheduled[0]?.date));
      return day && !day.isHoliday ? day.slots.find(bookable) : undefined;
    }
    return undefined;
  };

  const handleSelectSlot = async (slot: DeliverySlotOption) => {
    setSelectedSlotId(slot.slotId);
    setSelectedSlot(slot);
    setScheduleDate(slot.date);
    try {
      await holdDeliverySlot(slot.slotId);
      logCheckoutEvent('slot_held', { slotId: slot.slotId, date: slot.date });
    } catch (error) {
      failedSlotIdsRef.current.add(slot.slotId);
      logCheckoutEvent('slot_hold_failed', {
        slotId: slot.slotId,
        status: getApiErrorStatus(error) ?? null,
        code: (error as { code?: string })?.code ?? null,
      });
      setSelectedSlotId((current) => (current === slot.slotId ? null : current));
      setSelectedSlot((current) => (current?.slotId === slot.slotId ? null : current));
      Alert.alert(
        t('slotNoLongerAvailable'),
        readApiErrorMessage(error, t('chooseAnotherSlot')),
      );
      void deliveryOptionsQuery.refetch();
    }
  };

  useEffect(() => {
    if (preferenceType === 'ASAP' || selectedSlotId) return;
    const firstSlot = findBookableSlot(preferenceType, scheduleDate);
    if (firstSlot) {
      void handleSelectSlot(firstSlot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hold only when preference/options change
  }, [preferenceType, selectedSlotId, deliveryOptions, scheduleDate]);

  const handlePaymentMethodPress = (method: (typeof PAYMENT_METHODS)[number]) => {
    // UPI / Cards both open Razorpay Standard Checkout after Place Order.
    // Do not show the legacy "Coming Soon" sheet.
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

  const finishPlacedOrder = async (input: {
    orderId: string;
    orderNumber?: string;
    paymentId?: string;
    paidOnline?: boolean;
    placed?: Record<string, unknown>;
  }) => {
    setPaySuccess(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const placed = input.placed ?? {};
    const apiOrder = normalizeApiOrder({
      ...placed,
      id: input.orderId,
      orderNumber: input.orderNumber ?? placed.orderNumber,
    });
    const orderId = apiOrder.id || input.orderId;
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
          : deliveryOptions?.asap.etaLabel ||
            apiOrder.expectedDelivery ||
            displayPreview?.deliveryMessage ||
            displayPreview?.deliveringBy ||
            t('updatingDeliveryEstimate');

    if (orderId) {
      queryClient.setQueryData(['order', orderId], apiOrder);
    }
    await queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
    if (orderId) {
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    }

    addOrder(
      buildOrderFromCheckout({
        id: orderId,
        items: [...items],
        total: checkoutTotal,
        site: selectedSite!,
        paymentMethod,
        deliveryETA: deliveryEtaLabel,
      }),
    );

    await clearPendingPayment();
    clearCart();
    useCartStore.setState({ pointsApplied: false });
    void useLoyaltyStore.getState().refresh();
    setPaying(false);
    router.replace({
      pathname: '/order-success',
      params: {
        orderId,
        orderNumber: input.orderNumber ?? '',
        paymentId: input.paymentId ?? '',
        amount: String(checkoutTotal),
        paidOnline: input.paidOnline ? '1' : '0',
      },
    });
  };

  const verifyOnlinePayment = async (
    session: {
      internalOrderId: string;
      orderNumber: string;
      razorpayOrderId: string | null;
    },
    checkoutResult: RazorpayCheckoutSuccess,
  ) => {
    try {
      const verified = await verifyRazorpayPayment({
        internalOrderId: session.internalOrderId,
        razorpay_payment_id: checkoutResult.razorpay_payment_id,
        razorpay_order_id: checkoutResult.razorpay_order_id,
        razorpay_signature: checkoutResult.razorpay_signature,
      });
      if (verified.state === 'PAID') {
        await finishPlacedOrder({
          orderId: verified.internalOrderId,
          orderNumber: verified.orderNumber,
          paymentId: verified.providerPaymentId ?? undefined,
          paidOnline: true,
          placed: verified as unknown as Record<string, unknown>,
        });
        return;
      }
      setPaying(false);
      router.replace({
        pathname: '/payment-result',
        params: {
          status: verified.state === 'FAILED' ? 'failed' : 'checking',
          orderId: session.internalOrderId,
          fromCallback: '1',
        },
      });
    } catch (error) {
      setPaying(false);
      const apiError = readPaymentApiError(error);
      // Retryable/network errors mean "unknown yet"; the status screen reconciles with Razorpay.
      const definitelyFailed = !apiError.retryable && !apiError.network && !apiError.sessionExpired;
      logCheckoutEvent('payment_verify_error', {
        code: apiError.code ?? 'UNKNOWN',
        status: apiError.status ?? 0,
      });
      router.replace({
        pathname: '/payment-result',
        params: {
          status: definitelyFailed ? 'failed' : 'checking',
          orderId: session.internalOrderId,
          fromCallback: '1',
          message: definitelyFailed ? (apiError.message ?? undefined) : undefined,
        },
      });
    }
  };

  const startOnlineCheckout = async (session: {
    keyId: string;
    razorpayOrderId: string | null;
    amount: number;
    currency: string;
    internalOrderId: string;
    orderNumber: string;
    alreadyPaid?: boolean;
    name: string;
    description: string;
    customer: { name: string; email: string; phone: string };
  }) => {
    if (session.alreadyPaid) {
      await finishPlacedOrder({
        orderId: session.internalOrderId,
        orderNumber: session.orderNumber,
        paidOnline: true,
      });
      return;
    }

    if (!session.razorpayOrderId || !session.keyId) {
      setPaying(false);
      Alert.alert(
        t('paymentFailedTitle'),
        'Unable to start secure checkout. Please try again.',
      );
      return;
    }

    await savePendingPayment({
      internalOrderId: session.internalOrderId,
      orderNumber: session.orderNumber,
      razorpayOrderId: session.razorpayOrderId,
      amountPaise: session.amount,
      currency: session.currency,
      createdAt: new Date().toISOString(),
    });
    onlineSessionRef.current = {
      internalOrderId: session.internalOrderId,
      orderNumber: session.orderNumber,
      razorpayOrderId: session.razorpayOrderId,
    };

    const options = buildRazorpayOptions({
      keyId: session.keyId,
      amountPaise: session.amount,
      currency: session.currency,
      razorpayOrderId: session.razorpayOrderId,
      name: session.name,
      description: session.description,
      customer: {
        name: session.customer.name || customer?.name || '',
        email: session.customer.email || customer?.email || '',
        phone: session.customer.phone || customer?.phone || '',
      },
      checkoutMethod: paymentMethod === 'upi' ? 'upi' : 'cards',
    });

    let checkoutResult: RazorpayCheckoutSuccess;
    try {
      logCheckoutEvent('payment_checkout_open', {
        mode: isNativeRazorpayAvailable() ? 'native' : 'web',
        razorpayOrderId: session.razorpayOrderId,
        internalOrderId: session.internalOrderId,
      });
      checkoutResult = await openNativeRazorpayCheckout(options);
    } catch (error) {
      if (error instanceof RazorpayCheckoutError && error.nativeUnavailable) {
        setWebCheckoutOptions(options);
        return;
      }
      logCheckoutEvent('payment_checkout_closed', {
        cancelled: error instanceof RazorpayCheckoutError && error.cancelled,
        code: error instanceof RazorpayCheckoutError ? String(error.code ?? '') : 'UNKNOWN',
      });
      if (error instanceof RazorpayCheckoutError && error.cancelled) {
        try {
          await cancelRazorpayPayment(session.internalOrderId);
        } catch {
          // Status will reconcile on retry.
        }
        setPaying(false);
        router.replace({
          pathname: '/payment-result',
          params: {
            status: 'cancelled',
            orderId: session.internalOrderId,
          },
        });
        return;
      }
      setPaying(false);
      const unknownOutcome =
        error instanceof RazorpayCheckoutError && error.code === INCOMPLETE_RESPONSE_CODE;
      router.replace({
        pathname: '/payment-result',
        params: {
          status: unknownOutcome ? 'checking' : 'failed',
          orderId: session.internalOrderId,
          fromCallback: unknownOutcome ? '1' : undefined,
          message: !unknownOutcome && error instanceof Error ? error.message : undefined,
        },
      });
      return;
    }
    await verifyOnlinePayment(session, checkoutResult);
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

    if (!deliveryTermsAccepted) {
      setShowTermsHint(true);
      Alert.alert(t('deliveryTermsTitle'), t('deliveryTermsRequired'));
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

    const isOnline = paymentMethod === 'upi' || paymentMethod === 'cards';

    setPaying(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await syncLocalCartToServer(items);
      const remark = instructions.trim().slice(0, 250) || undefined;
      if (!placeIdempotencyKeyRef.current) {
        placeIdempotencyKeyRef.current = createIdempotencyKey();
      }
      const idempotencyKey = placeIdempotencyKeyRef.current;
      const deliveryPayload = {
        deliveryCallOnArrival: instructionFlags.callOnArrival,
        deliveryLeaveAtSecurity: instructionFlags.leaveAtSecurity,
        deliveryHeavyVehicleAccess: instructionFlags.heavyVehicleAccess,
        openAreaConfirmed:
          openAreaConfirmed === null ? undefined : openAreaConfirmed,
        deliveryTermsAccepted: true,
        deliveryTermsVersion: DELIVERY_TERMS_VERSION,
      };
      logCheckoutEvent('order_submit', {
        paymentMethod,
        preferenceType,
        hasSlot: Boolean(selectedSlotId),
      });

      if (isOnline) {
        const onlinePayload = {
          addressId: selectedSite.id,
          notes: remark,
          loyaltyPointsToRedeem: loyaltyPoints > 0 ? loyaltyPoints : undefined,
          deliveryPreferenceType: preferenceType,
          scheduledSlotId: selectedSlotId ?? undefined,
          deliveryCustomerRemark: remark,
          ...deliveryPayload,
          checkoutMethod: paymentMethod === 'upi' ? ('upi' as const) : ('card' as const),
          idempotencyKey,
        };
        let session;
        try {
          session = await createRazorpayOrder({
            ...onlinePayload,
            internalOrderId: retryOrderId,
          });
        } catch (error) {
          // The earlier order expired or was closed; pay for the current cart instead.
          if (!retryOrderId || readPaymentApiError(error).code !== 'ORDER_CANCELLED') {
            throw error;
          }
          logCheckoutEvent('payment_retry_order_closed', {});
          router.setParams({ retryOrderId: undefined });
          session = await createRazorpayOrder(onlinePayload);
        }
        await startOnlineCheckout(session);
        placeIdempotencyKeyRef.current = null;
        return;
      }

      const placed = await placeOrder({
        addressId: selectedSite.id,
        notes: remark,
        paymentMethod: 'CASH',
        loyaltyPointsToRedeem: loyaltyPoints > 0 ? loyaltyPoints : undefined,
        deliveryPreferenceType: preferenceType,
        scheduledSlotId: selectedSlotId ?? undefined,
        deliveryCustomerRemark: remark,
        ...deliveryPayload,
        idempotencyKey,
      });
      placeIdempotencyKeyRef.current = null;

      const apiOrder = normalizeApiOrder(placed as Record<string, unknown>);
      await finishPlacedOrder({
        orderId: apiOrder.id || apiOrder.orderNumber,
        orderNumber: String((placed as { orderNumber?: string }).orderNumber ?? ''),
        placed: placed as Record<string, unknown>,
      });
    } catch (error) {
      setPaying(false);
      setPaySuccess(false);
      const message = getApiErrorMessage(error) || 'Unable to place order';
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

        {selectedSite && hasDestinationCoords ? (
          <DeliveryPreferenceSection
            options={deliveryOptions}
            loading={deliveryOptionsLoading}
            errorMessage={deliveryOptionsError}
            selectedType={preferenceType}
            selectedSlotId={selectedSlotId}
            selectedDate={scheduleDate}
            onSelectType={handleSelectPreference}
            onSelectSlot={(slot) => void handleSelectSlot(slot)}
            onSelectScheduleDate={(date) => {
              setScheduleDate(date);
              setSelectedSlotId(null);
              setSelectedSlot(null);
              const next = findBookableSlot('SCHEDULED', date);
              if (next) void handleSelectSlot(next);
            }}
            onRetry={() => {
              failedSlotIdsRef.current.clear();
              void deliveryOptionsQuery.refetch();
            }}
            onChangeAddress={openAddressPicker}
          />
        ) : null}

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
            {QUICK_CHIP_KEYS.map((chipKey) => {
              const active = instructionFlags[chipKey];
              return (
                <ScaledPressable
                  key={chipKey}
                  onPress={() => toggleInstructionFlag(chipKey)}
                  className={`rounded-full border px-3 py-1.5 ${
                    active ? 'border-primary bg-primary/15' : 'border-border'
                  }`}>
                  <Text
                    className={`text-xs ${active ? 'font-bold text-text' : 'text-text-secondary'}`}>
                    {t(chipKey)}
                  </Text>
                </ScaledPressable>
              );
            })}
          </View>
        </View>

        {requiresOpenArea ? (
          <View className="mb-3 rounded-card border border-border bg-surface p-4">
            <Text className="mb-1 font-bold text-text">Site Access</Text>
            <Text className="mb-3 text-xs text-text-secondary">
              This order requires vehicle access to the delivery site. Is there an
              open/accessible area for delivery?
            </Text>
            <View className="flex-row gap-2">
              <ScaledPressable
                onPress={() => setOpenAreaConfirmed(true)}
                className={`flex-1 rounded-xl border px-3 py-3 ${
                  openAreaConfirmed === true
                    ? 'border-primary bg-primary/15'
                    : 'border-border bg-background'
                }`}>
                <Text className="text-center text-sm font-bold text-text">
                  Yes — vehicle can access
                </Text>
              </ScaledPressable>
              <ScaledPressable
                onPress={() => setOpenAreaConfirmed(false)}
                className={`flex-1 rounded-xl border px-3 py-3 ${
                  openAreaConfirmed === false
                    ? 'border-primary bg-primary/15'
                    : 'border-border bg-background'
                }`}>
                <Text className="text-center text-sm font-bold text-text">
                  No — limited access
                </Text>
              </ScaledPressable>
            </View>
          </View>
        ) : null}

        <View className="mb-3 rounded-card border border-primary/40 bg-primary/10 p-4">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
            Delivery Summary
          </Text>
          <Text className="mt-2 text-base font-bold text-text">
            {selectedSlot
              ? `${selectedSlot.dateLabel} · ${selectedSlot.label}`
              : preferenceType === 'ASAP'
                ? deliveryOptions?.asap.etaLabel || 'Deliver as soon as possible'
                : 'Choose a delivery time'}
          </Text>
          {displayPreview?.deliveryVehicleDisplayName || deliveryOptions?.hubName ? (
            <Text className="mt-1 text-xs text-text-secondary">
              {[
                displayPreview?.deliveryVehicleDisplayName,
                (checkoutPreview?.fulfillmentHubName ?? deliveryOptions?.hubName)
                  ? `${t('deliveringFrom')} ${checkoutPreview?.fulfillmentHubName ?? deliveryOptions?.hubName}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          ) : null}
          {deliveryOptions?.operatingWindow ? (
            <Text className="mt-1 text-xs text-text-secondary">
              {t('deliveryHoursLabel')}: {deliveryOptions.operatingWindow.start} –{' '}
              {deliveryOptions.operatingWindow.end}
              {closedDaysLabel ? ` · ${t('noDeliveryOn')} ${closedDaysLabel}` : ''}
            </Text>
          ) : null}
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
          onRetryEta={() => {
            void refreshEta();
            void refreshCheckoutPreview(useLoyalty);
          }}
          etaRefreshing={etaLoading || quoteLoading}
          onChangeAddress={openAddressPicker}
          onAddAddress={openAddressPicker}
          onClearCart={() => {
            clearCart();
            router.replace('/(tabs)/catalog');
          }}
          preferenceLabel={
            selectedSlot
              ? `${selectedSlot.dateLabel}, ${selectedSlot.label}`
              : preferenceType === 'ASAP'
                ? deliveryOptions?.asap.etaLabel
                : null
          }
        />

        <DeliveryTermsSection
          accepted={deliveryTermsAccepted}
          onToggle={(accepted) => {
            setDeliveryTermsAccepted(accepted);
            if (accepted) setShowTermsHint(false);
          }}
          operatingWindow={deliveryOptions?.operatingWindow}
          closedDaysLabel={closedDaysLabel}
          showRequiredHint={showTermsHint}
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
            badge={t('paymentAvailable')}
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

        {!hasServerQuote && !quoteLoading && selectedSite && !paying && !paySuccess ? (
          <Text className="mt-3 text-center text-xs text-text-secondary">
            {t('confirmPricingToPay')}
          </Text>
        ) : !deliveryTermsAccepted && !paying && !paySuccess ? (
          <Text className="mt-3 text-center text-xs text-text-secondary">
            {t('deliveryTermsRequired')}
          </Text>
        ) : !slotRequirementMet && !paying && !paySuccess ? (
          <Text className="mt-3 text-center text-xs text-text-secondary">
            {t('chooseAnotherSlot')}
          </Text>
        ) : null}
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
            <Text className="text-base font-bold text-onPrimary">
              {paymentMethod === 'cash_on_delhivery'
                ? `${t('payConfirmOrder')} →`
                : `${t('paySecurely')} →`}
            </Text>
          )}
        </ScaledPressable>
      </ScrollView>
      </SafeAreaView>

      <RazorpayWebCheckout
        visible={Boolean(webCheckoutOptions)}
        options={webCheckoutOptions}
        onSuccess={(result) => {
          const session = onlineSessionRef.current;
          setWebCheckoutOptions(null);
          if (!session) {
            setPaying(false);
            return;
          }
          void verifyOnlinePayment(session, result);
        }}
        onCancel={() => {
          const session = onlineSessionRef.current;
          setWebCheckoutOptions(null);
          setPaying(false);
          if (session) {
            void cancelRazorpayPayment(session.internalOrderId).catch(() => undefined);
            router.replace({
              pathname: '/payment-result',
              params: { status: 'cancelled', orderId: session.internalOrderId },
            });
          }
        }}
        onFailure={(message) => {
          const session = onlineSessionRef.current;
          setWebCheckoutOptions(null);
          setPaying(false);
          router.replace({
            pathname: '/payment-result',
            params: {
              status: 'failed',
              orderId: session?.internalOrderId || '',
              message,
            },
          });
        }}
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
