import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';

import { ForegroundNotificationBanner } from '@components/notifications/ForegroundNotificationBanner';
import {
  NOTIFICATIONS_QUERY_KEY,
  UNREAD_COUNT_QUERY_KEY,
} from '@services/notifications.api';
import { useAuthStore } from '@store/useAuthStore';
import { useNotificationStore } from '@store/notificationStore';
import {
  navigateNotificationDeepLink,
  parseNotificationPayload,
  type NotificationDeepLinkPayload,
} from '@utils/notificationDeepLink';
import {
  getLastNotificationResponse,
  registerCustomerPushToken,
} from '@utils/pushNotifications';

interface PushNotificationProviderProps {
  children: ReactNode;
}

interface BannerState {
  title: string;
  body: string;
  payload: NotificationDeepLinkPayload;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const refreshUnreadCount = useNotificationStore((s) => s.refreshUnreadCount);
  const queryClient = useQueryClient();
  const [banner, setBanner] = useState<BannerState | null>(null);
  const handledResponseIds = useRef(new Set<string>());

  useEffect(() => {
    if (!isHydrated || !isLoggedIn) return;
    if (Platform.OS !== 'web') {
      void registerCustomerPushToken();
    }
    void refreshUnreadCount();
  }, [isHydrated, isLoggedIn, refreshUnreadCount]);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const received = Notifications.addNotificationReceivedListener((notification) => {
      const payload = parseNotificationPayload(
        notification.request.content.data as Record<string, unknown>,
      );
      setBanner({
        title: notification.request.content.title ?? 'Bajriwala',
        body: notification.request.content.body ?? '',
        payload,
      });
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
      void refreshUnreadCount();
    });

    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      const id = event.notification.request.identifier;
      if (handledResponseIds.current.has(id)) return;
      handledResponseIds.current.add(id);
      const payload = parseNotificationPayload(
        event.notification.request.content.data as Record<string, unknown>,
      );
      navigateNotificationDeepLink(payload);
      if (payload.notificationId && payload.notificationId !== 'test') {
        void useNotificationStore.getState().markAsRead(payload.notificationId);
      }
    });

    void getLastNotificationResponse().then((last) => {
      if (!last) return;
      const id = last.notification.request.identifier;
      if (handledResponseIds.current.has(id)) return;
      handledResponseIds.current.add(id);
      const payload = parseNotificationPayload(
        last.notification.request.content.data as Record<string, unknown>,
      );
      navigateNotificationDeepLink(payload);
    });

    const tokenSub = Notifications.addPushTokenListener((deviceToken) => {
      if (!useAuthStore.getState().isLoggedIn) return;
      void registerCustomerPushToken();
      void deviceToken;
    });

    return () => {
      received.remove();
      response.remove();
      tokenSub.remove();
    };
  }, [queryClient, refreshUnreadCount]);

  return (
    <View style={styles.root}>
      {children}
      {banner ? (
        <View style={styles.banner} pointerEvents="box-none">
          <ForegroundNotificationBanner
            title={banner.title}
            body={banner.body}
            onView={() => {
              const payload = banner.payload;
              if (payload.notificationId && payload.notificationId !== 'test') {
                void useNotificationStore.getState().markAsRead(payload.notificationId);
              }
              navigateNotificationDeepLink(payload);
              setBanner(null);
            }}
            onDismiss={() => setBanner(null)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    zIndex: 50,
  },
});
