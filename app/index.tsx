import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@components/BrandLogo';
import { BRAND_CHARCOAL, theme } from '@constants/theme';
import { useTranslation } from '@store/languageStore';
import { useAuthStore } from '@store/useAuthStore';
import { resolveDeliverySitesForBoot } from '@utils/ensureDeliverySite';
import { markStartup } from '@utils/startupPerf';
import { withDeadline } from '@utils/withDeadline';

/** Brief brand beat — do not pad past essential init. */
const MIN_SPLASH_MS = 400;
const HYDRATE_DEADLINE_MS = 6000;
const SPLASH_TEXT = '#F6EFE5';

export default function SplashScreen() {
  const { t } = useTranslation();
  const hydrateSession = useAuthStore((s) => s.hydrateSession);
  const routed = useRef(false);

  useEffect(() => {
    markStartup('first_shell');
    const start = Date.now();

    (async () => {
      try {
        await withDeadline(
          hydrateSession(),
          HYDRATE_DEADLINE_MS,
          'Session restore timed out',
        ).catch((error) => {
          console.warn(
            '[startup] hydrate deadline/error',
            error instanceof Error ? error.message : 'unknown',
          );
        });
        markStartup('session_local');

        const elapsed = Date.now() - start;
        const remaining = Math.max(MIN_SPLASH_MS - elapsed, 0);
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }

        if (routed.current) return;
        routed.current = true;

        const { isLoggedIn, isGuest } = useAuthStore.getState();

        if (isLoggedIn) {
          const sites = await resolveDeliverySitesForBoot();
          await ExpoSplashScreen.hideAsync().catch(() => undefined);
          markStartup('splash_hide');
          markStartup('nav_ready');
          if (sites === 'no') {
            router.replace('/delivery-location');
            return;
          }
          router.replace('/(tabs)');
          return;
        }

        await ExpoSplashScreen.hideAsync().catch(() => undefined);
        markStartup('splash_hide');
        markStartup('nav_ready');

        if (isGuest) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error(
          '[startup] splash routing failed',
          error instanceof Error ? error.message : 'unknown',
        );
        await ExpoSplashScreen.hideAsync().catch(() => undefined);
        if (!routed.current) {
          routed.current = true;
          router.replace('/login');
        }
      }
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
