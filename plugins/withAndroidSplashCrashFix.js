/**
 * Motorola / Android 12+ process death mitigation.
 *
 * Root cause: expo-splash-screen calls installSplashScreen() and (by default)
 * setOnExitAnimationListener(). That opts the app into Android's splash
 * handoff. On several OEM builds the handoff throws on the main thread
 * (SurfaceControl.checkNotReleased / ClassCastException) →
 * "Bajriwala keeps stopping".
 *
 * Soft patches that only catch remove() are NOT enough. This plugin makes
 * SplashScreenManager.registerOnActivity a no-op so the handoff never starts,
 * and removes the generated MainActivity call as a second guard.
 */
const {
  withDangerousMod,
  withMainActivity,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'Patched by withAndroidSplashCrashFix';

const PATCHED = `package expo.modules.splashscreen

import android.app.Activity
import android.util.Log
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants

// ${MARKER}
object SplashScreenManager {
  private const val TAG = "ExpoSplashScreen"

  // Always false — we never keep the system splash. JS BrandedSplash paints immediately.
  private var keepSplashScreenOnScreen = false
  var preventAutoHideCalled: Boolean = true

  private val contentAppearedListener = ReactMarker.MarkerListener { _, _, _ -> }

  fun registerOnActivity(mainActivity: Activity) {
    // CRITICAL: do not call installSplashScreen() or setOnExitAnimationListener().
    // Those APIs trigger Android 12+ splash handoff and kill the process on OEM devices
    // (observed: Motorola "Bajriwala keeps stopping").
    keepSplashScreenOnScreen = false
    preventAutoHideCalled = true
    Log.i(TAG, "SplashScreenManager.registerOnActivity skipped (OEM crash mitigation)")
  }

  fun hide() {
    keepSplashScreenOnScreen = false
  }

  fun setSplashScreenOptions(options: SplashScreenOptions) {
    // no-op
  }

  fun unregisterContentAppearedListener() {
    ReactMarker.removeListener(contentAppearedListener)
  }
}
`;

function patchSplashManager(projectRoot) {
  const target = path.join(
    projectRoot,
    'node_modules',
    'expo-splash-screen',
    'android',
    'src',
    'main',
    'java',
    'expo',
    'modules',
    'splashscreen',
    'SplashScreenManager.kt',
  );

  if (!fs.existsSync(target)) {
    console.warn('[withAndroidSplashCrashFix] SplashScreenManager.kt missing');
    return;
  }

  fs.writeFileSync(target, PATCHED);
  console.log('[withAndroidSplashCrashFix] SplashScreenManager.kt set to no-op');
}

function withAndroidSplashCrashFix(config) {
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      patchSplashManager(cfg.modRequest.projectRoot);
      return cfg;
    },
  ]);

  config = withMainActivity(config, (cfg) => {
    let contents = cfg.modResults.contents;

    // Remove generated splash registration entirely when present.
    if (contents.includes('SplashScreenManager.registerOnActivity')) {
      contents = contents.replace(
        /\/\/ @generated begin expo-splashscreen[\s\S]*?\/\/ @generated end expo-splashscreen\n?/g,
        `// @generated begin expo-splashscreen - disabled by withAndroidSplashCrashFix
    // SplashScreenManager.registerOnActivity skipped — OEM Android 12+ crash mitigation
    // @generated end expo-splashscreen
`,
      );

      // Fallback if markers missing but call remains.
      contents = contents.replace(
        /^\s*SplashScreenManager\.registerOnActivity\(this\)\s*$/m,
        '    // SplashScreenManager.registerOnActivity skipped — OEM crash mitigation',
      );

      cfg.modResults.contents = contents;
      console.log('[withAndroidSplashCrashFix] MainActivity splash registration removed');
    }

    return cfg;
  });

  return config;
}

module.exports = withAndroidSplashCrashFix;
