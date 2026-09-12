import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { getRazorpayStatus } from '@services/payments.api';
import { clearPendingPayment } from '@lib/pendingPayment';
import { useTranslation } from '@store/languageStore';

type ResultStatus = 'failed' | 'cancelled' | 'checking';

export default function PaymentResultScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    status?: string;
    orderId?: string;
    message?: string;
  }>();
  const initial = (params.status as ResultStatus) || 'checking';
  const [status, setStatus] = useState<ResultStatus>(initial);
  const [busy, setBusy] = useState(initial === 'checking');

  const reconcile = useCallback(async () => {
    if (!params.orderId) {
      setBusy(false);
      return;
    }
    setBusy(true);
    try {
      const result = await getRazorpayStatus(params.orderId);
      if (result.paid) {
        await clearPendingPayment();
        router.replace({
          pathname: '/order-success',
          params: {
            orderId: result.internalOrderId,
            orderNumber: result.orderNumber,
            paymentId: result.providerPaymentId ?? '',
            amount: String(result.amount),
            paidOnline: '1',
          },
        });
        return;
      }
      if (
        result.paymentStatus === 'FAILED' ||
        result.gatewayStatus === 'FAILED' ||
        result.gatewayStatus === 'VERIFICATION_FAILED'
      ) {
        setStatus('failed');
      } else if (result.gatewayStatus === 'CANCELLED') {
        setStatus('cancelled');
      } else {
        setStatus('checking');
      }
    } catch {
      setStatus(initial === 'failed' ? 'failed' : 'checking');
    } finally {
      setBusy(false);
    }
  }, [initial, params.orderId]);

  useEffect(() => {
    if (initial === 'checking' && params.orderId) {
      void reconcile();
    }
  }, [initial, params.orderId, reconcile]);

  const isFailed = status === 'failed';
  const isCancelled = status === 'cancelled';
  const isChecking = status === 'checking';

  const title = isFailed
    ? t('paymentFailedTitle')
    : isCancelled
      ? t('paymentCancelledTitle')
      : t('checkingPaymentStatus');
  const subtitle = isFailed
    ? params.message || t('paymentFailedBody')
    : isCancelled
      ? t('paymentCancelledBody')
      : t('checkingPaymentBody');
  const icon = isFailed ? 'close' : isCancelled ? 'remove' : 'time-outline';
  const iconBg = isFailed ? 'bg-error' : isCancelled ? 'bg-warning' : 'bg-primary';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <View className={`h-24 w-24 items-center justify-center rounded-full ${iconBg}`}>
          {busy && isChecking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name={icon} size={40} color="#FFFFFF" />
          )}
        </View>
        <Text className="mt-6 text-center text-2xl font-bold text-text">{title}</Text>
        <Text className="mt-3 text-center text-sm leading-5 text-text-secondary">
          {subtitle}
        </Text>

        {isChecking ? (
          <ScaledPressable
            onPress={() => void reconcile()}
            className="mt-8 w-full items-center rounded-pill bg-primary py-4">
            <Text className="text-base font-bold text-onPrimary">{t('refreshStatus')}</Text>
          </ScaledPressable>
        ) : (
          <>
            <ScaledPressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.replace({
                  pathname: '/checkout',
                  params: params.orderId ? { retryOrderId: params.orderId } : {},
                });
              }}
              className="mt-8 w-full items-center rounded-pill bg-primary py-4">
              <Text className="text-base font-bold text-onPrimary">
                {isCancelled ? t('retryPayment') : t('tryAgain')}
              </Text>
            </ScaledPressable>
            <ScaledPressable
              onPress={() => router.replace('/checkout')}
              className="mt-3 w-full items-center rounded-pill border border-border py-4">
              <Text className="text-base font-bold text-text">{t('changePaymentMethod')}</Text>
            </ScaledPressable>
          </>
        )}

        <ScaledPressable onPress={() => router.replace('/(tabs)')} className="mt-3 py-3">
          <Text className="text-sm font-semibold text-text-secondary">{t('backToHome')}</Text>
        </ScaledPressable>
      </View>
    </SafeAreaView>
  );
}
