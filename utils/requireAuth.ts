import { useAuthStore } from '@store/useAuthStore';

/**
 * Gate a protected action behind login. Guests (or logged-out users) are shown the
 * `LoginRequiredSheet`; returns `true` only when the user is already logged in.
 *
 * The `message` param is accepted for call-site backwards compatibility but the sheet
 * always shows fixed copy — pass an action to `requireAuthOr` if you need it re-run
 * automatically after a successful login.
 */
export function requireAuth(_message?: string): boolean {
  return useAuthStore.getState().requireLogin();
}

/**
 * Gate a protected action behind login and automatically re-run it once the user logs in.
 * Returns `true` immediately (and does not queue anything) if already logged in.
 */
export function requireAuthOr(action: () => void): boolean {
  return useAuthStore.getState().requireLogin(action);
}
