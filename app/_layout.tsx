import '../global.css';

import { useEffect } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { VoiceAssistantSheet } from '@components/VoiceAssistantSheet';
import { QueryProvider } from '@providers/QueryProvider';
import { useLanguageStore } from '@store/languageStore';

SplashScreen.preventAutoHideAsync();

const TAB_ROUTES = ['/', '/(tabs)', '/(tabs)/catalog', '/(tabs)/orders', '/(tabs)/account'];

function isTabRoot(pathname: string) {
  return TAB_ROUTES.includes(pathname);
}

export default function RootLayout() {
  const language = useLanguageStore((s) => s.language);
  const pathname = usePathname();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backAction = () => {
      if (isTabRoot(pathname)) {
        Alert.alert('Exit Bajriwala?', 'Are you sure you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => sub.remove();
  }, [pathname]);

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryProvider>
          <BottomSheetModalProvider>
            <StatusBar style="auto" />
            <Stack
              key={language}
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#FFFFFF' },
              }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="otp" options={{ headerShown: false }} />
              <Stack.Screen name="role-selection" options={{ headerShown: false }} />
              <Stack.Screen name="complete-profile" options={{ headerShown: false }} />
              <Stack.Screen name="delivery-location" options={{ headerShown: false }} />
              <Stack.Screen name="search" options={{ headerShown: false }} />
              <Stack.Screen name="cart" options={{ headerShown: false }} />
              <Stack.Screen
                name="checkout"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="order-success"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen name="emergency-order" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              <Stack.Screen name="support" options={{ headerShown: false }} />
              <Stack.Screen
                name="voice-assistant"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen name="products/[categoryId]" options={{ headerShown: false }} />
              <Stack.Screen name="products/detail/[productId]" options={{ headerShown: false }} />
              <Stack.Screen name="orders/view/[orderId]" options={{ headerShown: false }} />
              <Stack.Screen name="orders/details/[orderId]" options={{ headerShown: false }} />
              <Stack.Screen name="orders/history" options={{ headerShown: false }} />
              <Stack.Screen name="invoice/[invoiceId]" options={{ headerShown: false }} />
              <Stack.Screen name="account/edit-profile" options={{ headerShown: false }} />
              <Stack.Screen name="account/loyalty" options={{ headerShown: false }} />
              <Stack.Screen name="account/invoices" options={{ headerShown: false }} />
              <Stack.Screen name="account/add-sites" options={{ headerShown: false }} />
              <Stack.Screen name="account/gst-compliance" options={{ headerShown: false }} />
              <Stack.Screen name="account/privacy" options={{ headerShown: false }} />
              <Stack.Screen name="account/payment-methods" options={{ headerShown: false }} />
              <Stack.Screen name="bulk-procurement" options={{ headerShown: false }} />
            </Stack>
            <VoiceAssistantSheet />
          </BottomSheetModalProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
