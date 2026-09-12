import { useEffect, useRef } from 'react';
import { router } from 'expo-router';

import { getPendingRazorpayCheckout, getRazorpayStatus } from '@services/payments.api';
import { useAuthStore } from '@store/useAuthStore';
import { clearPendingPayment, getPendingPayment } from '@lib/pendingPayment';

/**
 * Recover unpaid Razorpay attempts after app restart.
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
        if (status.paid) {
          await clearPendingPayment();
          router.replace({
            pathname: '/order-success',
            params: {
              orderId: status.internalOrderId,
              orderNumber: status.orderNumber,
              paymentId: status.providerPaymentId ?? '',
              amount: String(status.amount),
              paidOnline: '1',
            },
          });
          return;
        }

        if (
          status.paymentStatus === 'FAILED' ||
          status.gatewayStatus === 'FAILED' ||
          status.gatewayStatus === 'VERIFICATION_FAILED'
        ) {
          router.replace({
            pathname: '/payment-result',
            params: {
              status: 'failed',
              orderId: status.internalOrderId,
            },
          });
          return;
        }

        router.replace({
          pathname: '/payment-result',
          params: {
            status: 'checking',
            orderId: status.internalOrderId,
          },
        });
      } catch {
        // Pending/status may 404 on backends without Razorpay routes — drop stale local pending.
        ran.current = false;
        await clearPendingPayment().catch(() => undefined);
      }
    })();
  }, [isHydrated, isLoggedIn]);
}
