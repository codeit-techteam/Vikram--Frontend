/**
 * Mirror of plugins/withAndroidSplashCrashFix.js for local node_modules.
 * Makes SplashScreenManager.registerOnActivity a no-op so Android 12+ splash
 * handoff never starts (fixes Motorola "keeps stopping").
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
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

const MARKER = 'Patched by scripts/fix-expo-splash-android.js';

const PATCHED = `package expo.modules.splashscreen

import android.app.Activity
import android.util.Log
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants

// ${MARKER}
object SplashScreenManager {
  private const val TAG = "ExpoSplashScreen"

  private var keepSplashScreenOnScreen = false
  var preventAutoHideCalled: Boolean = true

  private val contentAppearedListener = ReactMarker.MarkerListener { _, _, _ -> }

  fun registerOnActivity(mainActivity: Activity) {
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

function main() {
  if (!fs.existsSync(target)) {
    console.warn('[fix-expo-splash-android] SplashScreenManager.kt not found, skipping');
    return;
  }

  const current = fs.readFileSync(target, 'utf8');
  if (current.includes('registerOnActivity skipped (OEM crash mitigation)')) {
    return;
  }

  fs.writeFileSync(target, PATCHED);
  console.log('[fix-expo-splash-android] SplashScreenManager.kt set to no-op');
}

main();
