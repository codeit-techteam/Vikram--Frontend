import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@components/BrandLogo';
import { BRAND_CHARCOAL, theme } from '@constants/theme';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useAuthStore } from '@store/useAuthStore';
import { customerHasDeliverySites } from '@utils/ensureDeliverySite';

const MIN_SPLASH_MS = 1200;
const SPLASH_TEXT = '#F6EFE5';

export default function SplashScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  useEffect(() => {
    const start = Date.now();

    (async () => {
      await hydrateSession();

      const elapsed = Date.now() - start;
      const remaining = Math.max(MIN_SPLASH_MS - elapsed, 0);

      setTimeout(() => {
        void (async () => {
          const { isLoggedIn, isGuest } = useAuthStore.getState();

          if (isLoggedIn) {
            const hasSites = await customerHasDeliverySites();
            if (!hasSites) {
              router.replace('/delivery-location');
              return;
            }
            router.replace('/(tabs)');
          } else if (isGuest) {
            router.replace('/(tabs)');
          } else {
            router.replace('/login');
          }
        })();
      }, remaining);
    })();
  }, [hydrateSession]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_CHARCOAL }} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View
        style={{
          flex: 1,
          backgroundColor: BRAND_CHARCOAL,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <BrandLogo size="lg" variant="onDark" />

        <Text
          style={{
            fontSize: 14,
            color: SPLASH_TEXT,
            fontWeight: '600',
            marginTop: 16,
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
          <Ionicons name="shield-checkmark-outline" size={14} color={SPLASH_TEXT} />
          <Text
            style={{
              fontSize: 12,
              color: SPLASH_TEXT,
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
