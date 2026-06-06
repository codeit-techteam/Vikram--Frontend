import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@components/BrandLogo';
import { useLanguageStore, useTranslation } from '@store/languageStore';

export default function SplashScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center px-6">
        <BrandLogo size="lg" />
        <Text className="mt-3 text-center text-base text-text">{t('splashTagline')}</Text>
      </View>

      <View className="mb-8 items-center px-6">
        <View className="flex-row items-center gap-2 rounded-full bg-trust px-4 py-2">
          <Ionicons name="shield-checkmark-outline" size={14} color="#FF6B00" />
          <Text className="text-[10px] font-semibold tracking-wider text-text-secondary">
            {t('enterpriseSecureNetwork')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
