import { useCallback, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';

import { BrandedSplash } from '@components/splash/BrandedSplash';
import { useAuthStore } from '@store/useAuthStore';
import { resolveDeliverySitesForBoot } from '@utils/ensureDeliverySite';
import { markStartup } from '@utils/startupPerf';
import { withDeadline } from '@utils/withDeadline';

/** Short brand beat once the in-app splash is visible — not a loading timer. */
const MIN_BRAND_MS = 900;
const HYDRATE_DEADLINE_MS = 6000;

export default function SplashScreen() {
  const hydrateSession = useAuthStore((s) => s.hydrateSession);
  const routed = useRef(false);
  const nativeHidden = useRef(false);
  const brandReadyAt = useRef<number | null>(null);

  const hideNativeSplash = useCallback(async () => {
    if (nativeHidden.current) return;
    nativeHidden.current = true;
    try {
      await ExpoSplashScreen.hideAsync();
      markStartup('splash_hide');
    } catch {
      // Native splash may already be gone (failsafe / remount).
    }
  }, []);

  const onBrandedReady = useCallback(() => {
    if (brandReadyAt.current == null) {
      brandReadyAt.current = Date.now();
    }
    void hideNativeSplash();
  }, [hideNativeSplash]);

  useEffect(() => {
    markStartup('first_shell');

    try {
      ExpoSplashScreen.setOptions({ duration: 280, fade: true });
    } catch {
      // setOptions is unavailable on some older native binaries.
    }

    const start = Date.now();
    let cancelled = false;

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

        const { isLoggedIn, isGuest } = useAuthStore.getState();

        // Overlap sites resolution with the brand beat — never gate native splash on it.
        const sitesPromise = isLoggedIn ? resolveDeliverySitesForBoot() : null;

        const brandStart = brandReadyAt.current ?? start;
        const remaining = Math.max(MIN_BRAND_MS - (Date.now() - brandStart), 0);
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }

        if (cancelled || routed.current) return;
        routed.current = true;

        await hideNativeSplash();
        markStartup('nav_ready');

        if (isLoggedIn) {
          const sites = (await sitesPromise) ?? 'unknown';
          if (cancelled) return;
          if (sites === 'no') {
            router.replace('/delivery-location');
            return;
          }
          router.replace('/(tabs)');
          return;
        }

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
        await hideNativeSplash();
        if (!routed.current) {
          routed.current = true;
          router.replace('/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrateSession, hideNativeSplash]);

  return <BrandedSplash onReady={onBrandedReady} />;
}
