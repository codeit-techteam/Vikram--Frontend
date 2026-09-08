import { useAuthStore } from '@store/useAuthStore';

/**
 * Gate a protected action behind login. Guests (or logged-out users) are shown the
 * `LoginRequiredSheet`; returns `true` only when the user is already logged in.
 *
 * `message` is shown as the sheet's subtitle so the user knows why they were stopped.
 */
export function requireAuth(message?: string): boolean {
  return useAuthStore.getState().requireLogin(undefined, message);
}

/**
 * Gate a protected action behind login and automatically re-run it once the user logs in.
 * Returns `true` immediately (and does not queue anything) if already logged in.
 */
export function requireAuthOr(action: () => void, message?: string): boolean {
  return useAuthStore.getState().requireLogin(action, message);
}
