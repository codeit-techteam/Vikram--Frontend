/**
 * MUST load before expo-router/entry (see index.js).
 * Captures JS fatals that would otherwise kill the release APK with no UI.
 */
/* eslint-disable no-console */

const AsyncStorage = (() => {
  try {
    // Lazy require so a missing native module cannot block entry.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-async-storage/async-storage').default;
  } catch {
    return null;
  }
})();

const CRASH_KEY = 'bajriwala_last_js_crash';

function formatError(error, isFatal) {
  const name = error?.name || 'Error';
  const message = error?.message || String(error);
  const stack = error?.stack || '(no stack)';
  return [
    `FATAL=${Boolean(isFatal)}`,
    `name=${name}`,
    `message=${message}`,
    '',
    stack,
  ].join('\n');
}

async function persistJsCrash(text) {
  if (!AsyncStorage) return;
  try {
    await AsyncStorage.setItem(CRASH_KEY, text);
  } catch {
    // ignore
  }
}

try {
  const ErrorUtils = global.ErrorUtils;
  if (ErrorUtils?.setGlobalHandler) {
    const previous = ErrorUtils.getGlobalHandler?.();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      const text = formatError(error, isFatal);
      console.error('[CrashHandler]', text);
      void persistJsCrash(text);
      if (typeof previous === 'function') {
        previous(error, isFatal);
      }
    });
  }
} catch (e) {
  console.warn('[CrashHandler] install failed', e);
}

if (typeof global !== 'undefined') {
  const previousRejection = global.onunhandledrejection;
  global.onunhandledrejection = (event) => {
    const reason = event?.reason;
    const text = formatError(
      reason instanceof Error ? reason : new Error(String(reason)),
      false,
    );
    console.error('[CrashHandler] unhandledrejection', text);
    void persistJsCrash(text);
    if (typeof previousRejection === 'function') {
      previousRejection(event);
    }
  };
}

module.exports = { CRASH_KEY };
