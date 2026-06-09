import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo, theme } from '@constants/theme';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.primary }} edges={['top', 'bottom']}>
      <View
        style={{
          flex: 1,
          backgroundColor: theme.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Image
          source={Logo}
          style={{ width: 180, height: 180, marginBottom: 24 }}
          resizeMode="contain"
        />

        <Text
          style={{
            fontSize: 28,
            fontWeight: '900',
            color: theme.black,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}>
          {theme.appName.toUpperCase()}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: theme.black,
            fontWeight: '600',
            marginTop: 8,
            opacity: 0.7,
            letterSpacing: 0.5,
          }}>
          {theme.appTagline}
        </Text>

        <View
          style={{
            position: 'absolute',
            bottom: 40,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}>
          <Ionicons name="shield-checkmark-outline" size={14} color={theme.black} />
          <Text
            style={{
              fontSize: 12,
              color: theme.black,
              fontWeight: '600',
              opacity: 0.6,
            }}>
            {t('enterpriseSecureNetwork')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
