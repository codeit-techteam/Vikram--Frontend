/**
 * OEM Android 12+ splash crash mitigation (Motorola "keeps stopping").
 *
 * Stock expo-splash-screen always calls setOnExitAnimationListener after
 * installSplashScreen(). That opts into Android splash handoff, which can
 * throw on the main thread (SurfaceControl.checkNotReleased /
 * ClassCastException) — expo/expo#53033 / Android issue 242118185.
 *
 * Fix: keep installSplashScreen + keep-on-screen, but CLEAR the exit listener
 * on API 31+ so the handoff never runs. Do NOT rewrite MainActivity (that
 * surgery is a separate crash risk).
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'Patched by withAndroidSplashCrashFix';

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

      // Critical: never leave setOnExitAnimationListener installed on API 31+.
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
    // Ignore fade/duration on Android — custom exit animation is disabled.
  }

  fun unregisterContentAppearedListener() {
    ReactMarker.removeListener(contentAppearedListener)
  }
}
`;

function withAndroidSplashCrashFix(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const target = path.join(
        cfg.modRequest.projectRoot,
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
        return cfg;
      }
      fs.writeFileSync(target, PATCHED);
      console.log('[withAndroidSplashCrashFix] SplashScreenManager.kt: clearOnExit only');
      return cfg;
    },
  ]);
}

module.exports = withAndroidSplashCrashFix;
