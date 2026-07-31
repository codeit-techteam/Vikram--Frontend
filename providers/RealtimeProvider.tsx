import { useEffect, useRef, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { ORDERS_QUERY_KEY } from '@hooks/useOrders';
import { realtimeSocket } from '@services/realtime.socket';
import { useAuthStore } from '@store/useAuthStore';
import { applyOrderStatusUpdated } from '@utils/applyOrderStatusUpdated';

interface RealtimeProviderProps {
  children: ReactNode;
}

/**
 * Maintains a Socket.IO connection while the customer is logged in.
 * Applies `order.updated` events to React Query caches instantly.
 */
export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!isHydrated) return;

    if (isLoggedIn && token) {
      realtimeSocket.connect(token);
    } else {
      realtimeSocket.disconnect();
    }
  }, [isHydrated, isLoggedIn, token]);

  useEffect(() => {
    const unsubscribe = realtimeSocket.onOrderStatusUpdated((payload) => {
      applyOrderStatusUpdated(queryClient, payload);
      if (__DEV__) {
        console.log('[realtime] Customer UI Rendered (cache patched)', payload.orderId);
      }
    });
    return unsubscribe;
  }, [queryClient]);

  useEffect(() => {
    const unsubscribe = realtimeSocket.onReconnect(() => {
      if (__DEV__) {
        console.log('[realtime] sync after reconnect');
      }
      void queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: ['order'] });
    });
    return unsubscribe;
  }, [queryClient]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const wasBackground =
        appState.current === 'background' || appState.current === 'inactive';
      appState.current = next;

      if (wasBackground && next === 'active' && useAuthStore.getState().isLoggedIn) {
        const accessToken = useAuthStore.getState().token;
        if (accessToken) {
          realtimeSocket.updateToken(accessToken);
          realtimeSocket.connect(accessToken);
        }
        void queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
        void queryClient.invalidateQueries({ queryKey: ['order'] });
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [queryClient]);

  return <>{children}</>;
}
