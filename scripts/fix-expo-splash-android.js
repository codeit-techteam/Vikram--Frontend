/**
 * expo-splash-screen 58.0.x always installs an Android exit animation that
 * casts the splash view to android.window.SplashScreenView and calls remove().
 *
 * On API 31+ that cast / remove throws (ClassCastException on some OEM splash
 * implementations, or SurfaceControl.checkNotReleased — Android bug 242118185).
 * The exception is on the main thread, so Android shows "keeps stopping"
 * as soon as JS hides the splash. SplashScreen.setOptions({ fade: false })
 * does not help: the stock Android module never reads `fade`.
 *
 * This patch:
 * - honors fade:false by dismissing immediately (no custom fade)
 * - uses a type check instead of an unsafe cast
 * - catches the platform remove() failure so it cannot kill the process
 * - cancels an in-flight fade if the activity stops on API 31–33
 *
 * Safe to run repeatedly. Applied in postinstall so EAS Gradle compiles it.
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
import android.app.Application
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.ViewPropertyAnimator
import android.view.ViewTreeObserver.OnPreDrawListener
import android.view.animation.AccelerateInterpolator
import android.window.SplashScreenView
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.splashscreen.SplashScreenViewProvider
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import java.util.Collections
import java.util.WeakHashMap

// ${MARKER}
object SplashScreenManager {
  private const val TAG = "ExpoSplashScreen"

  private var keepSplashScreenOnScreen = true
  var preventAutoHideCalled: Boolean = false
  private var exitAnimationDuration = SplashScreenOptions().duration
  // Stock Android ignored SplashScreenOptions.fade and always animated.
  // Default off so a late setOptions() cannot reintroduce the API 31+ crash.
  private var fadeEnabled = false
  private var exitAnimator: ViewPropertyAnimator? = null

  private val lifecycleHooked: MutableSet<Activity> =
    Collections.newSetFromMap(WeakHashMap())

  private val contentAppearedListener = ReactMarker.MarkerListener { name, _, _ ->
    if (name == ReactMarkerConstants.CONTENT_APPEARED) {
      if (!preventAutoHideCalled) {
        hide()
      }
    }
  }

  private fun removeSplash(provider: SplashScreenViewProvider, splashScreenView: View) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && splashScreenView is SplashScreenView) {
        // SplashScreenViewProvider.remove() calls applyThemesSystemBarAppearance
        // and races React Native's system-bar updates. Remove the platform view.
        splashScreenView.remove()
      } else {
        provider.remove()
      }
    } catch (error: Throwable) {
      Log.w(TAG, "Splash screen remove failed", error)
      try {
        provider.remove()
      } catch (fallback: Throwable) {
        Log.w(TAG, "Splash screen provider remove failed", fallback)
      }
    }
  }

  fun registerOnActivity(mainActivity: Activity) {
    val splashScreen = mainActivity.installSplashScreen()
    ReactMarker.addListener(contentAppearedListener)

    // Android 12–13 can deliver the exit callback after the activity stops.
    // Cancelling the animator avoids SurfaceControl.checkNotReleased.
    if (
      Build.VERSION.SDK_INT in Build.VERSION_CODES.S..Build.VERSION_CODES.TIRAMISU &&
      lifecycleHooked.add(mainActivity)
    ) {
      mainActivity.application.registerActivityLifecycleCallbacks(
        object : Application.ActivityLifecycleCallbacks {
          override fun onActivityStopped(activity: Activity) {
            if (activity !== mainActivity) return
            exitAnimator?.cancel()
            exitAnimator = null
          }

          override fun onActivityDestroyed(activity: Activity) {
            if (activity !== mainActivity) return
            activity.application.unregisterActivityLifecycleCallbacks(this)
            lifecycleHooked.remove(activity)
          }

          override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
          override fun onActivityStarted(activity: Activity) {}
          override fun onActivityResumed(activity: Activity) {}
          override fun onActivityPaused(activity: Activity) {}
          override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
        },
      )
    }

    // Using splashScreen.setKeepOnScreenCondition() does not work below API 33.
    val contentView = mainActivity.findViewById<View>(android.R.id.content)
    val observer = contentView.viewTreeObserver
    observer.addOnPreDrawListener(object : OnPreDrawListener {
      override fun onPreDraw(): Boolean {
        if (keepSplashScreenOnScreen) {
          return false
        }
        if (contentView.viewTreeObserver.isAlive) {
          contentView.viewTreeObserver.removeOnPreDrawListener(this)
        }
        return true
      }
    })

    splashScreen.setOnExitAnimationListener { splashScreenViewProvider ->
      val splashScreenView = splashScreenViewProvider.view
      val duration = if (fadeEnabled) exitAnimationDuration else 0L
      if (duration <= 0L) {
        removeSplash(splashScreenViewProvider, splashScreenView)
        return@setOnExitAnimationListener
      }

      exitAnimator = splashScreenView
        .animate()
        .setDuration(duration)
        .alpha(0.0f)
        .setInterpolator(AccelerateInterpolator())
        .withEndAction {
          exitAnimator = null
          removeSplash(splashScreenViewProvider, splashScreenView)
        }
      exitAnimator?.start()
    }
  }

  fun hide() {
    keepSplashScreenOnScreen = false
  }

  fun setSplashScreenOptions(options: SplashScreenOptions) {
    exitAnimationDuration = options.duration
    fadeEnabled = options.fade
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
  if (current.includes(MARKER)) {
    return;
  }

  if (!current.includes('splashScreenView as SplashScreenView')) {
    console.warn(
      '[fix-expo-splash-android] unexpected SplashScreenManager.kt, leaving it unchanged',
    );
    return;
  }

  fs.writeFileSync(target, PATCHED);
  console.log('[fix-expo-splash-android] patched SplashScreenManager.kt');
}

main();
