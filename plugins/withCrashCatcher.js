/**
 * Native crash catcher for release APKs without USB debugging.
 *
 * 1) MainApplication.onCreate installs an uncaught exception handler that
 *    writes Log.getStackTraceString(e) → filesDir/last_crash.txt
 * 2) MainActivity.onCreate: if last_crash.txt exists, open CrashReportActivity
 *    (plain ScrollView + Share) BEFORE React starts, then finish MainActivity.
 * 3) CrashReportActivity deletes the file after the user shares/dismisses.
 *
 * Open app → crash → open again → stack is on screen and shareable.
 */
const {
  withMainApplication,
  withMainActivity,
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const CRASH_FILE = 'last_crash.txt';
const ACTIVITY = 'CrashReportActivity';

function ensureImport(contents, importLine) {
  if (contents.includes(importLine)) return contents;
  return contents.replace(/(^package [^\n]+\n)/m, `$1\n${importLine}\n`);
}

function withCrashCatcher(config) {
  const packageName = config.android?.package;
  if (!packageName) {
    throw new Error('[withCrashCatcher] android.package is required');
  }

  // 1) Write CrashReportActivity.kt into the app package.
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const packagePath = packageName.replace(/\./g, '/');
      const dir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/java',
        packagePath,
      );
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${ACTIVITY}.kt`);
      const source = `package ${packageName}

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import java.io.File

/**
 * Shows the previous native crash stack so it can be shared without ADB.
 */
class ${ACTIVITY} : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val crashFile = File(filesDir, "${CRASH_FILE}")
    val text = try {
      if (crashFile.exists()) crashFile.readText() else "(no crash file found)"
    } catch (e: Exception) {
      "Failed to read crash file: \${e.message}"
    }

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(Color.WHITE)
      setPadding(32, 48, 32, 32)
    }

    val title = TextView(this).apply {
      setText("Bajriwala crash report")
      setTextColor(Color.BLACK)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 20f)
      setPadding(0, 0, 0, 16)
    }

    val hint = TextView(this).apply {
      setText("Share this text to the developer (WhatsApp / email). Then tap Close and reopen the app.")
      setTextColor(Color.DKGRAY)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
      setPadding(0, 0, 0, 16)
    }

    val scroll = ScrollView(this)
    val body = TextView(this).apply {
      setText(text)
      setTextIsSelectable(true)
      setTextColor(Color.BLACK)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
      setTypeface(android.graphics.Typeface.MONOSPACE)
    }
    scroll.addView(body)

    val share = Button(this).apply {
      setText("Share crash log")
      setOnClickListener {
        try {
          val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "Bajriwala Android crash")
            putExtra(Intent.EXTRA_TEXT, text)
          }
          startActivity(Intent.createChooser(send, "Share crash log"))
        } catch (e: Exception) {
          Toast.makeText(this@${ACTIVITY}, "Share failed: \${e.message}", Toast.LENGTH_LONG).show()
        }
      }
    }

    val close = Button(this).apply {
      setText("Close & clear")
      setOnClickListener {
        try { if (crashFile.exists()) crashFile.delete() } catch (_: Exception) {}
        finish()
      }
    }

    root.addView(title)
    root.addView(hint)
    root.addView(share)
    root.addView(close)
    root.addView(scroll, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      0,
      1f,
    ))

    setContentView(root)
  }
}
`;
      fs.writeFileSync(file, source);
      console.log('[withCrashCatcher] wrote', file);
      return cfg;
    },
  ]);

  // 2) MainApplication — install default uncaught handler.
  config = withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes('last_crash.txt')) {
      return cfg;
    }

    src = ensureImport(src, 'import android.util.Log');
    src = ensureImport(src, 'import java.io.File');
    src = ensureImport(src, 'import java.lang.Thread');

    const snippet = `
    // @generated begin bajriwala-crash-catcher
    try {
      val previousHandler = Thread.getDefaultUncaughtExceptionHandler()
      Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
        try {
          val crashFile = File(filesDir, "${CRASH_FILE}")
          crashFile.writeText(
            "thread=" + thread.name + "\\n" + Log.getStackTraceString(throwable)
          )
          Log.e("BajriwalaCrash", "Saved crash to " + crashFile.absolutePath, throwable)
        } catch (writeError: Throwable) {
          Log.e("BajriwalaCrash", "Failed to persist crash", writeError)
        }
        if (previousHandler != null) {
          previousHandler.uncaughtException(thread, throwable)
        } else {
          android.os.Process.killProcess(android.os.Process.myPid())
          System.exit(10)
        }
      }
    } catch (handlerError: Throwable) {
      Log.e("BajriwalaCrash", "Failed to install crash handler", handlerError)
    }
    // @generated end bajriwala-crash-catcher
`;

    if (src.includes('super.onCreate()')) {
      src = src.replace('super.onCreate()', `super.onCreate()\n${snippet}`);
    } else {
      throw new Error('[withCrashCatcher] could not find super.onCreate() in MainApplication');
    }

    cfg.modResults.contents = src;
    console.log('[withCrashCatcher] patched MainApplication');
    return cfg;
  });

  // 3) MainActivity — redirect to CrashReportActivity when a crash file exists.
  config = withMainActivity(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes('CrashReportActivity')) {
      return cfg;
    }

    src = ensureImport(src, 'import android.content.Intent');
    src = ensureImport(src, 'import java.io.File');

    const redirect = `
    // @generated begin bajriwala-crash-redirect
    try {
      val crashFile = File(filesDir, "${CRASH_FILE}")
      if (crashFile.exists() && crashFile.length() > 0L) {
        startActivity(Intent(this, ${ACTIVITY}::class.java))
        finish()
        return
      }
    } catch (_: Throwable) {
      // ignore and continue normal launch
    }
    // @generated end bajriwala-crash-redirect
`;

    // Insert at the start of onCreate body (after opening brace of onCreate).
    const onCreateMatch = src.match(
      /override fun onCreate\([^)]*\)\s*\{/,
    );
    if (!onCreateMatch) {
      throw new Error('[withCrashCatcher] could not find onCreate in MainActivity');
    }
    src = src.replace(onCreateMatch[0], `${onCreateMatch[0]}\n${redirect}`);

    cfg.modResults.contents = src;
    console.log('[withCrashCatcher] patched MainActivity');
    return cfg;
  });

  // 4) Manifest — register the activity.
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;
    app.activity = app.activity || [];
    const exists = app.activity.some(
      (a) => a.$?.['android:name'] === `.${ACTIVITY}`,
    );
    if (!exists) {
      app.activity.push({
        $: {
          'android:name': `.${ACTIVITY}`,
          'android:exported': 'false',
          'android:theme': '@android:style/Theme.DeviceDefault.Light.NoActionBar',
        },
      });
      console.log('[withCrashCatcher] registered CrashReportActivity in manifest');
    }
    return cfg;
  });

  return config;
}

module.exports = withCrashCatcher;
