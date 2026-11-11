/**
 * Local/EAS postinstall mirror of plugins/withAndroidSplashCrashFix.js.
 * Keeps installSplashScreen, clears exit listener on API 31+.
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
import android.os.Build
import android.util.Log
import android.view.View
import android.view.ViewTreeObserver.OnPreDrawListener
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants

// ${MARKER}
object SplashScreenManager {
  private const val TAG = "ExpoSplashScreen"

  private var keepSplashScreenOnScreen = true
  var preventAutoHideCalled: Boolean = false

  private val contentAppearedListener = ReactMarker.MarkerListener { name, _, _ ->
    if (name == ReactMarkerConstants.CONTENT_APPEARED) {
      if (!preventAutoHideCalled) {
        hide()
      }
    }
  }

  fun registerOnActivity(mainActivity: Activity) {
    try {
      val splashScreen = mainActivity.installSplashScreen()
      ReactMarker.addListener(contentAppearedListener)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        try {
          splashScreen.clearOnExitAnimationListener()
          Log.i(TAG, "Cleared splash exit listener (API \${Build.VERSION.SDK_INT})")
        } catch (error: Throwable) {
          Log.w(TAG, "clearOnExitAnimationListener failed", error)
        }
      }

      val contentView = mainActivity.findViewById<View>(android.R.id.content) ?: return
      contentView.viewTreeObserver.addOnPreDrawListener(object : OnPreDrawListener {
        override fun onPreDraw(): Boolean {
          if (keepSplashScreenOnScreen) return false
          if (contentView.viewTreeObserver.isAlive) {
            contentView.viewTreeObserver.removeOnPreDrawListener(this)
          }
          return true
        }
      })
    } catch (error: Throwable) {
      keepSplashScreenOnScreen = false
      Log.e(TAG, "registerOnActivity failed; continuing without custom splash", error)
    }
  }

  fun hide() {
    keepSplashScreenOnScreen = false
  }

  fun setSplashScreenOptions(options: SplashScreenOptions) {
    // no-op on purpose
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
  if (current.includes('Cleared splash exit listener')) return;
  fs.writeFileSync(target, PATCHED);
  console.log('[fix-expo-splash-android] SplashScreenManager.kt: clearOnExit only');
}

main();
