import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { ScaledPressable } from '@components/ScaledPressable';
import { ORDERS_QUERY_KEY } from '@hooks/useOrders';
import {
  getRazorpayStatus,
  readPaymentApiError,
  type RazorpayPaymentStatus,
} from '@services/payments.api';
import { clearPendingPayment } from '@lib/pendingPayment';
import { useCartStore } from '@store/cartStore';
import { useLoyaltyStore } from '@store/loyaltyStore';
import { useTranslation } from '@store/languageStore';

type ViewState =
  | 'checking'
  | 'timeout'
  | 'network'
  | 'awaiting'
  | 'failed'
  | 'cancelled'
  | 'order_closed'
  | 'refund_pending'
  | 'session_expired';

/** Gaps between status checks: requests at 0s, 2s, 4s, 7s, 10s, 15s, then every 5s. */
const POLL_GAPS_MS = [2000, 2000, 3000, 3000, 5000];
const POLL_TAIL_GAP_MS = 5000;
const POLL_TIMEOUT_MS =
  Number(process.env.EXPO_PUBLIC_PAYMENT_STATUS_POLL_TIMEOUT_MS) > 0
    ? Number(process.env.EXPO_PUBLIC_PAYMENT_STATUS_POLL_TIMEOUT_MS)
    : 30000;
/** Right after a checkout callback, Razorpay can lag a moment before listing the payment. */
const CALLBACK_GRACE_ATTEMPTS = 3;

type CheckOutcome = { done: boolean; networkError?: boolean };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function PaymentResultScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    status?: string;
    orderId?: string;
    message?: string;
    fromCallback?: string;
  }>();
  const orderId = params.orderId;
  const initialView: ViewState =
    params.status === 'failed'
      ? 'failed'
      : params.status === 'cancelled'
        ? 'cancelled'
        : 'checking';

  const [view, setView] = useState<ViewState>(orderId ? initialView : 'network');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | undefined>(params.message || undefined);
  const mountedRef = useRef(true);
  const runRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runRef.current += 1;
    };
  }, []);

  const handlePaid = useCallback(
    async (result: RazorpayPaymentStatus) => {
      await clearPendingPayment();
      useCartStore.getState().clearCart();
      useCartStore.setState({ pointsApplied: false });
      void useLoyaltyStore.getState().refresh();
      await queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: ['order', result.internalOrderId] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: '/order-success',
        params: {
          orderId: result.internalOrderId,
          orderNumber: result.orderNumber,
          paymentId: result.providerPaymentId ?? '',
          amount: String(result.amount),
          paymentMethod: result.method ?? '',
          paidOnline: '1',
        },
      });
    },
    [queryClient],
  );

  /** One authoritative status read; decides whether polling should continue. */
  const checkOnce = useCallback(
    async (attempt: number, mode: 'poll' | 'single'): Promise<CheckOutcome> => {
      if (!orderId) return { done: true };
      try {
        const result = await getRazorpayStatus(orderId);
        if (!mountedRef.current) return { done: true };
        switch (result.state) {
          case 'PAID':
            await handlePaid(result);
            return { done: true };
          case 'PROCESSING':
            if (mode === 'single') setView('timeout');
            return { done: mode === 'single' };
          case 'AWAITING_PAYMENT':
            if (
              mode === 'poll' &&
              params.fromCallback === '1' &&
              attempt < CALLBACK_GRACE_ATTEMPTS
            ) {
              return { done: false };
            }
            if (initialView === 'checking' || mode === 'poll') setView('awaiting');
            return { done: true };
          case 'FAILED':
            setMessage(result.failureReason || params.message || undefined);
            setView('failed');
            return { done: true };
          case 'CANCELLED':
            setView(initialView === 'failed' ? 'failed' : 'cancelled');
            return { done: true };
          case 'ORDER_CANCELLED':
            setView('order_closed');
            return { done: true };
          case 'REFUND_PENDING':
            setView('refund_pending');
            return { done: true };
          default:
            return { done: mode === 'single' };
        }
      } catch (error) {
        if (!mountedRef.current) return { done: true };
        const apiError = readPaymentApiError(error);
        if (apiError.sessionExpired) {
          setView('session_expired');
          return { done: true };
        }
        if (apiError.network || apiError.retryable) {
          if (mode === 'single') setView('network');
          return { done: mode === 'single', networkError: true };
        }
        setMessage(apiError.message ?? undefined);
        setView('failed');
        return { done: true };
      }
    },
    [handlePaid, initialView, orderId, params.fromCallback, params.message],
  );

  const pollUntilSettled = useCallback(async () => {
    const run = ++runRef.current;
    const startedAt = Date.now();
    setView('checking');
    setBusy(true);
    try {
      for (let attempt = 0; ; attempt += 1) {
        const outcome = await checkOnce(attempt, 'poll');
        if (outcome.done || run !== runRef.current) return;
        const gap = POLL_GAPS_MS[attempt] ?? POLL_TAIL_GAP_MS;
        if (Date.now() - startedAt + gap > POLL_TIMEOUT_MS) {
          setView(outcome.networkError ? 'network' : 'timeout');
          return;
        }
        await sleep(gap);
        if (run !== runRef.current) return;
      }
    } finally {
      if (run === runRef.current && mountedRef.current) setBusy(false);
    }
  }, [checkOnce]);

  const refreshOnce = useCallback(async () => {
    if (busy) return;
    const run = ++runRef.current;
    setBusy(true);
    try {
      await checkOnce(0, 'single');
    } finally {
      if (run === runRef.current && mountedRef.current) setBusy(false);
    }
  }, [busy, checkOnce]);

  useEffect(() => {
    if (!orderId) return;
    if (initialView === 'checking') {
      void pollUntilSettled();
    } else {
      // Checkout reported failure/cancel; the backend may still know better (e.g. captured).
      void checkOnce(0, 'single').then(() => undefined);
    }
    // Run once per order; the callbacks are stable for a given order.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Returning from a UPI app or browser is the moment a payment usually settles.
  const viewRef = useRef(view);
  viewRef.current = view;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      if (viewRef.current === 'timeout' || viewRef.current === 'network') {
        void refreshOnce();
      }
    });
    return () => sub.remove();
  }, [refreshOnce]);

  const goToCheckoutRetry = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({
      pathname: '/checkout',
      params: orderId ? { retryOrderId: orderId } : {},
    });
  };
  const goToOrder = () => {
    if (!orderId) return;
    router.replace(`/orders/view/${orderId}`);
  };

  const copy = getCopy(view, t, message);
  const isChecking = view === 'checking';
  const canRetryPayment = view === 'awaiting' || view === 'failed' || view === 'cancelled';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <View className={`h-24 w-24 items-center justify-center rounded-full ${copy.iconBg}`}>
          {isChecking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name={copy.icon} size={40} color="#FFFFFF" />
          )}
        </View>
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          className="mt-6 text-center text-2xl font-bold text-text">
          {copy.title}
        </Text>
        <Text className="mt-3 text-center text-sm leading-5 text-text-secondary">{copy.body}</Text>

        {view === 'checking' || view === 'timeout' || view === 'network' ? (
          <>
            <ScaledPressable
              onPress={() => void refreshOnce()}
              disabled={busy}
              className="mt-8 w-full items-center rounded-pill bg-primary py-4"
              style={{ opacity: busy ? 0.6 : 1 }}>
              {busy && !isChecking ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text className="text-base font-bold text-onPrimary">
                  {view === 'network' ? t('tryAgain') : t('refreshStatus')}
                </Text>
              )}
            </ScaledPressable>
            {orderId ? (
              <ScaledPressable
                onPress={goToOrder}
                className="mt-3 w-full items-center rounded-pill border border-border py-4">
                <Text className="text-base font-bold text-text">{t('viewOrder')}</Text>
              </ScaledPressable>
            ) : null}
          </>
        ) : null}

        {canRetryPayment ? (
          <>
            <ScaledPressable
              onPress={goToCheckoutRetry}
              className="mt-8 w-full items-center rounded-pill bg-primary py-4">
              <Text className="text-base font-bold text-onPrimary">
                {view === 'awaiting' ? t('payNow') : t('retryPayment')}
              </Text>
            </ScaledPressable>
            <ScaledPressable
              onPress={() => router.replace('/checkout')}
              className="mt-3 w-full items-center rounded-pill border border-border py-4">
              <Text className="text-base font-bold text-text">{t('changePaymentMethod')}</Text>
            </ScaledPressable>
          </>
        ) : null}

        {view === 'order_closed' || view === 'refund_pending' ? (
          <ScaledPressable
            onPress={goToOrder}
            className="mt-8 w-full items-center rounded-pill bg-primary py-4">
            <Text className="text-base font-bold text-onPrimary">{t('viewOrder')}</Text>
          </ScaledPressable>
        ) : null}

        {view === 'session_expired' ? (
          <ScaledPressable
            onPress={() => router.push('/login')}
            className="mt-8 w-full items-center rounded-pill bg-primary py-4">
            <Text className="text-base font-bold text-onPrimary">{t('logIn')}</Text>
          </ScaledPressable>
        ) : null}

        <ScaledPressable onPress={() => router.replace('/(tabs)')} className="mt-3 py-3">
          <Text className="text-sm font-semibold text-text-secondary">{t('backToHome')}</Text>
        </ScaledPressable>
      </View>
    </SafeAreaView>
  );
}

function getCopy(
  view: ViewState,
  t: ReturnType<typeof useTranslation>['t'],
  message: string | undefined,
): {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
} {
  switch (view) {
    case 'timeout':
      return {
        title: t('paymentTimeoutTitle'),
        body: t('paymentTimeoutBody'),
        icon: 'time-outline',
        iconBg: 'bg-warning',
      };
    case 'network':
      return {
        title: t('paymentNetworkTitle'),
        body: t('paymentNetworkBody'),
        icon: 'cloud-offline-outline',
        iconBg: 'bg-warning',
      };
    case 'awaiting':
      return {
        title: t('paymentNotCompletedTitle'),
        body: t('paymentNotCompletedBody'),
        icon: 'wallet-outline',
        iconBg: 'bg-warning',
      };
    case 'failed':
      return {
        title: t('paymentFailedTitle'),
        body: message || t('paymentFailedBody'),
        icon: 'close',
        iconBg: 'bg-error',
      };
    case 'cancelled':
      return {
        title: t('paymentCancelledTitle'),
        body: t('paymentCancelledBody'),
        icon: 'remove',
        iconBg: 'bg-warning',
      };
    case 'order_closed':
      return {
        title: t('paymentOrderClosedTitle'),
        body: t('paymentOrderClosedBody'),
        icon: 'lock-closed-outline',
        iconBg: 'bg-error',
      };
    case 'refund_pending':
      return {
        title: t('paymentRefundPendingTitle'),
        body: t('paymentRefundPendingBody'),
        icon: 'return-down-back-outline',
        iconBg: 'bg-warning',
      };
    case 'session_expired':
      return {
        title: t('paymentSessionExpiredTitle'),
        body: t('paymentSessionExpiredBody'),
        icon: 'person-outline',
        iconBg: 'bg-warning',
      };
    case 'checking':
    default:
      return {
        title: t('checkingPaymentStatus'),
        body: t('checkingPaymentShortBody'),
        icon: 'time-outline',
        iconBg: 'bg-primary',
      };
  }
}
