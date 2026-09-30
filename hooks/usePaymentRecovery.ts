import { useEffect, useRef } from 'react';
import { router } from 'expo-router';

import { getPendingRazorpayCheckout, getRazorpayStatus } from '@services/payments.api';
import { useAuthStore } from '@store/useAuthStore';
import { clearPendingPayment, getPendingPayment } from '@lib/pendingPayment';

/**
 * Recover Razorpay attempts interrupted by an app restart.
 * Only steps in when money actually moved (PAID / PROCESSING). An order that was
 * opened but never paid is left alone — My Orders offers "Complete Payment" —
 * so the app never boots into a "Checking payment status" screen with nothing to check.
 * Intentionally avoids usePathname/useRootNavigationState — those throw
 * "Couldn't find a navigation context" during tab/stack transitions and block checkout.
 */
export function usePaymentRecovery() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const ran = useRef(false);

  useEffect(() => {
    if (!isHydrated || !isLoggedIn) return;
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      try {
        const local = await getPendingPayment();
        const pending = local
          ? { internalOrderId: local.internalOrderId }
          : await getPendingRazorpayCheckout();
        if (!pending?.internalOrderId) {
          await clearPendingPayment();
          return;
        }

        const status = await getRazorpayStatus(pending.internalOrderId);
        if (status.state === 'PAID') {
          await clearPendingPayment();
          router.replace({
            pathname: '/order-success',
            params: {
              orderId: status.internalOrderId,
              orderNumber: status.orderNumber,
              paymentId: status.providerPaymentId ?? '',
              amount: String(status.amount),
              paymentMethod: status.method ?? '',
              paidOnline: '1',
            },
          });
          return;
        }

        if (status.state === 'PROCESSING') {
          router.replace({
            pathname: '/payment-result',
            params: { status: 'checking', orderId: status.internalOrderId },
          });
          return;
        }

        await clearPendingPayment();
      } catch {
        // Recovery is best-effort; the order list still shows the real payment state.
        await clearPendingPayment().catch(() => undefined);
      }
    })();
  }, [isHydrated, isLoggedIn]);
}
