import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { storage } from '@lib/storage';
import {
  registerDeviceToken,
  releaseDeviceToken,
} from '@services/notifications.api';

const DEVICE_ID_KEY = 'bajriwala_device_id';
const PUSH_TOKEN_KEY = 'bajriwala_fcm_token';
export const ANDROID_CHANNEL_ID = 'bajriwala-default';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: false,
      shouldShowList: true,
    }),
  });
}

export async function getStableDeviceId(): Promise<string> {
  const existing = await storage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const generated = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await storage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Bajriwala',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FEB623',
    sound: 'default',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  return status === 'granted';
}

export async function getNativePushToken(): Promise<string | null> {
  if (!Device.isDevice && Platform.OS !== 'android') {
    return null;
  }
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  try {
    const token = await Notifications.getDevicePushTokenAsync();
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
  return Notifications.getLastNotificationResponseAsync();
}
