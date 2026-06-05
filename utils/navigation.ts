import { router, type Href } from 'expo-router';

const DEFAULT_FALLBACK: Href = '/(tabs)';

/** Close a modal or go back; falls back to replace when there is no history. */
export function safeGoBack(fallback: Href = DEFAULT_FALLBACK) {
  if (router.canDismiss()) {
    router.dismiss();
  } else if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}

/** Dismiss modal then navigate to a new screen. */
export function navigateFromModal(href: Href) {
  if (router.canDismiss()) {
    router.dismiss();
    setTimeout(() => router.push(href), 250);
  } else if (router.canGoBack()) {
    router.back();
    setTimeout(() => router.push(href), 250);
  } else {
    router.replace(href);
  }
}
