import { router, type Href } from 'expo-router';

const DEFAULT_FALLBACK: Href = '/(tabs)';

function canDismissSafely(): boolean {
  try {
    return router.canDismiss();
  } catch {
    return false;
  }
}

function canGoBackSafely(): boolean {
  try {
    return router.canGoBack();
  } catch {
    return false;
  }
}

/** Close a modal or go back; falls back to replace when there is no history. */
export function safeGoBack(fallback: Href = DEFAULT_FALLBACK) {
  if (canDismissSafely()) {
    router.dismiss();
  } else if (canGoBackSafely()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}

/** After login, return to the existing tab navigator instead of remounting it. */
export function navigateToHomeAfterAuth() {
  try {
    if (canDismissSafely()) {
      router.dismissTo('/(tabs)');
      return;
    }
    if (canGoBackSafely()) {
      router.dismissAll();
      return;
    }
  } catch {
    // Navigator can be mid-transition right after OTP verify.
  }
  router.replace('/(tabs)');
}

/** Dismiss modal then navigate to a new screen. */
export function navigateFromModal(href: Href) {
  if (canDismissSafely()) {
    router.dismiss();
    setTimeout(() => router.push(href), 250);
  } else if (canGoBackSafely()) {
    router.back();
    setTimeout(() => router.push(href), 250);
  } else {
    router.replace(href);
  }
}
