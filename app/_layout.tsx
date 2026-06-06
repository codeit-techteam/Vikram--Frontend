import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { VoiceAssistantSheet } from '@components/VoiceAssistantSheet';
import { QueryProvider } from '@providers/QueryProvider';
import { useLanguageStore } from '@store/languageStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const language = useLanguageStore((s) => s.language);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

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
              }}
            />
            <VoiceAssistantSheet />
          </BottomSheetModalProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
