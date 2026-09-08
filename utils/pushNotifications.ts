import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type * as Notifications from 'expo-notifications';

import { storage } from '@lib/storage';
import {
  registerDeviceToken,
  releaseDeviceToken,
} from '@services/notifications.api';

const DEVICE_ID_KEY = 'bajriwala_device_id';
const PUSH_TOKEN_KEY = 'bajriwala_fcm_token';
export const ANDROID_CHANNEL_ID = 'bajriwala-default';

type NotificationsModule = typeof Notifications;

let notificationsModule: NotificationsModule | null | undefined;
let handlerReady = false;

/**
 * Remote push was removed from Expo Go on Android in SDK 53.
 * Importing expo-notifications there throws at module load, so we never load it in Expo Go.
 */
export function isNativePushAvailable(): boolean {
  return Platform.OS !== 'web' && !isRunningInExpoGo();
}

function getNotifications(): NotificationsModule | null {
  if (!isNativePushAvailable()) return null;
  if (notificationsModule === undefined) {
    notificationsModule = require('expo-notifications') as NotificationsModule;
  }
  return notificationsModule ?? null;
}

function ensureNotificationHandler(): NotificationsModule | null {
  const NotificationsApi = getNotifications();
  if (!NotificationsApi || handlerReady) return NotificationsApi;
  NotificationsApi.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: false,
      shouldShowList: true,
    }),
  });
  handlerReady = true;
  return NotificationsApi;
}

export async function getStableDeviceId(): Promise<string> {
  const existing = await storage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const generated = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await storage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

export async function ensureAndroidChannel(): Promise<void> {
  const NotificationsApi = ensureNotificationHandler();
  if (!NotificationsApi || Platform.OS !== 'android') return;
  await NotificationsApi.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Bajriwala',
    importance: NotificationsApi.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FEB623',
    sound: 'default',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const NotificationsApi = ensureNotificationHandler();
  if (!NotificationsApi) return false;
  await ensureAndroidChannel();
  const current = await NotificationsApi.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await NotificationsApi.requestPermissionsAsync();
    status = requested.status;
  }
  return status === 'granted';
}

export async function getNativePushToken(): Promise<string | null> {
  if (!isNativePushAvailable()) return null;
  if (!Device.isDevice && Platform.OS !== 'android') {
    return null;
  }
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const NotificationsApi = ensureNotificationHandler();
  if (!NotificationsApi) return null;
  try {
    const token = await NotificationsApi.getDevicePushTokenAsync();
    return token.data || null;
  } catch {
    return null;
  }
}

export async function registerCustomerPushToken(): Promise<string | null> {
  const token = await getNativePushToken();
  if (!token) return null;
  const deviceId = await getStableDeviceId();
  await registerDeviceToken({
    token,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    deviceId,
    appVersion: Constants.expoConfig?.version,
  });
  await storage.setItem(PUSH_TOKEN_KEY, token);
  return token;
}

export async function releaseCustomerPushToken(): Promise<void> {
  const token = await storage.getItem(PUSH_TOKEN_KEY);
  const deviceId = await storage.getItem(DEVICE_ID_KEY);
  try {
    await releaseDeviceToken({
      token: token ?? undefined,
      deviceId: deviceId ?? undefined,
    });
  } catch {
    // Logout should continue even if the token call fails.
  }
}

export async function getLastNotificationResponse() {
  const NotificationsApi = ensureNotificationHandler();
  if (!NotificationsApi) return null;
  return NotificationsApi.getLastNotificationResponseAsync();
}

export function subscribeToPushEvents(handlers: {
  onReceived: (notification: Notifications.Notification) => void;
  onResponse: (response: Notifications.NotificationResponse) => void;
  onTokenChanged: () => void;
}): () => void {
  const NotificationsApi = ensureNotificationHandler();
  if (!NotificationsApi) return () => undefined;

  const received = NotificationsApi.addNotificationReceivedListener(handlers.onReceived);
  const response = NotificationsApi.addNotificationResponseReceivedListener(handlers.onResponse);
  const token = NotificationsApi.addPushTokenListener(() => {
    handlers.onTokenChanged();
  });

  return () => {
    received.remove();
    response.remove();
    token.remove();
  };
}
