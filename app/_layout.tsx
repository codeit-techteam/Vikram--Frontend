import '../global.css';

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@components/ErrorBoundary';
import { JsCrashReportGate } from '@components/JsCrashReportGate';
import { VoiceAssistantSheet } from '@components/VoiceAssistantSheet';
import { LoginRequiredSheet } from '@components/auth/LoginRequiredSheet';
import { AddToCartSuccessToast } from '@components/cart/AddToCartSuccessToast';
import { VariantBottomSheet } from '@components/product/VariantBottomSheet';
import { ReorderToast } from '@components/orders/ReorderToast';
import { ReorderUnavailableSheet } from '@components/orders/ReorderUnavailableSheet';
import { BRAND_IVORY } from '@constants/theme';
import { QueryProvider } from '@providers/QueryProvider';
import { RealtimeProvider } from '@providers/RealtimeProvider';
import { PushNotificationProvider } from '@providers/PushNotificationProvider';
import { startCartServerSync } from '@services/cart.api';
import { reconcileCartWithApiHost } from '@lib/reconcileCartWithApiHost';
import { useAuthStore } from '@store/useAuthStore';
import { markStartup } from '@utils/startupPerf';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

try {
  // iOS: short fade. Android: never enable fade — stock exit animation is
  // disabled natively by plugins/withAndroidSplashCrashFix.js.
  SplashScreen.setOptions(
    Platform.OS === 'ios'
      ? { duration: 280, fade: true }
      : { duration: 0, fade: false },
  );
} catch {
  // Older native binaries may not support setOptions.
}

/** Hard ceiling so a hung hydrate can never leave the native splash forever. */
const NATIVE_SPLASH_FAILSAFE_MS = 8000;

export default function RootLayout() {
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  useEffect(() => {
    markStartup('root_mount');

    // Native only — on web this can fight NativeWind's color-scheme observer.
    if (Platform.OS !== 'web') {
      void SystemUI.setBackgroundColorAsync(BRAND_IVORY).catch(() => undefined);
    }

    const failsafe = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => undefined);
      markStartup('splash_hide');
    }, NATIVE_SPLASH_FAILSAFE_MS);

    // Nonessential — must never gate splash / first navigation.
    void reconcileCartWithApiHost().finally(() => {
      startCartServerSync();
    });

    void hydrateSession()
      .catch((error) => {
        console.warn(
          '[startup] hydrateSession failed',
          error instanceof Error ? error.message : 'unknown',
        );
      })
      .finally(() => {
        markStartup('session_local');
      });

    return () => clearTimeout(failsafe);
  }, [hydrateSession]);

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <ErrorBoundary>
          <JsCrashReportGate>
          <QueryProvider>
            <RealtimeProvider>
              <PushNotificationProvider>
                <BottomSheetModalProvider>
                  <StatusBar style="auto" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      animation: 'slide_from_right',
                      contentStyle: { backgroundColor: '#FFFFFF' },
                      freezeOnBlur: true,
                    }}>
                    <Stack.Screen
                      name="index"
                      options={{
                        headerShown: false,
                        animation: 'fade',
                        contentStyle: { backgroundColor: BRAND_IVORY },
                      }}
                    />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="otp" options={{ headerShown: false }} />
                    <Stack.Screen name="role-selection" options={{ headerShown: false }} />
                    <Stack.Screen name="complete-profile" options={{ headerShown: false }} />
                    <Stack.Screen name="delivery-location" options={{ headerShown: false }} />
                    <Stack.Screen name="confirm-location" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="search"
                      options={{ headerShown: false, animation: 'fade' }}
                    />
                    <Stack.Screen name="cart" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="checkout"
                      options={{ headerShown: false, gestureEnabled: false }}
                    />
                    <Stack.Screen
                      name="order-success"
                      options={{ headerShown: false, gestureEnabled: false }}
                    />
                    <Stack.Screen
                      name="payment-result"
                      options={{ headerShown: false, gestureEnabled: false }}
                    />
                    <Stack.Screen name="emergency-order" options={{ headerShown: false }} />
                    <Stack.Screen name="notifications" options={{ headerShown: false }} />
                    <Stack.Screen name="support" options={{ headerShown: false }} />
                    <Stack.Screen name="products" options={{ headerShown: false }} />
                    <Stack.Screen name="orders/view/[orderId]" options={{ headerShown: false }} />
                    <Stack.Screen name="orders/details/[orderId]" options={{ headerShown: false }} />
                    <Stack.Screen name="orders/history" options={{ headerShown: false }} />
                    <Stack.Screen name="invoice/[invoiceId]" options={{ headerShown: false }} />
                    <Stack.Screen name="account/edit-profile" options={{ headerShown: false }} />
                    <Stack.Screen name="account/loyalty" options={{ headerShown: false }} />
                    <Stack.Screen name="account/invoices" options={{ headerShown: false }} />
                    <Stack.Screen name="account/add-sites" options={{ headerShown: false }} />
                    <Stack.Screen name="account/gst-compliance" options={{ headerShown: false }} />
                    <Stack.Screen name="account/gst-accounts" options={{ headerShown: false }} />
                    <Stack.Screen name="account/terms" options={{ headerShown: false }} />
                    <Stack.Screen name="bulk-procurement/index" options={{ headerShown: false }} />
                    <Stack.Screen name="bulk-procurement/enquiry" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="bulk-procurement/enquiry-success"
                      options={{ headerShown: false, gestureEnabled: false }}
                    />
                    <Stack.Screen name="bulk-procurement/my-enquiries" options={{ headerShown: false }} />
                    <Stack.Screen name="bulk-procurement/enquiry-detail" options={{ headerShown: false }} />
                    <Stack.Screen name="offers" options={{ headerShown: false }} />
                  </Stack>
                  <VoiceAssistantSheet />
                  <VariantBottomSheet />
                  <AddToCartSuccessToast />
                  <ReorderToast />
                  <ReorderUnavailableSheet />
                  <LoginRequiredSheet />
                </BottomSheetModalProvider>
              </PushNotificationProvider>
            </RealtimeProvider>
          </QueryProvider>
          </JsCrashReportGate>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
