import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { storage } from '@lib/storage';
import type { ApiError } from '@/types';
import { resolveApiBaseUrl } from '@utils/resolveApiBaseUrl';

function requestHadAuthorization(config?: InternalAxiosRequestConfig): boolean {
  if (!config?.headers) return false;
  const headers = config.headers;
  const value =
    typeof headers.get === 'function'
      ? (headers.get('Authorization') ?? headers.get('authorization'))
      : ((headers as { Authorization?: string; authorization?: string }).Authorization ??
        (headers as { authorization?: string }).authorization);
  return typeof value === 'string' && value.trim().length > 0;
}

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const API_BASE_URL = resolveApiBaseUrl();

if (__DEV__) {
  // Expo inlines EXPO_PUBLIC_* at Metro start — restart after changing .env
  console.log(`[api] baseURL=${API_BASE_URL}`);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getItem(AUTH_TOKEN_KEY);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (__DEV__) {
      const method = (config.method ?? 'get').toUpperCase();
      const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
      console.log(`[api] → ${method} ${url}`);
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

/** Clears stored tokens and drops the app back into guest mode (best-effort, no circular import at module scope). */
async function clearSessionAndEnterGuest(): Promise<void> {
  await Promise.all([storage.removeItem(AUTH_TOKEN_KEY), storage.removeItem(REFRESH_TOKEN_KEY)]);

  try {
    // Lazy require to avoid a circular import between api.ts <-> useAuthStore.ts.
    const { useAuthStore } = require('@store/useAuthStore') as typeof import('@store/useAuthStore');
    await useAuthStore.getState().handleSessionExpired();
  } catch {
    // Store may not be ready yet (e.g. very early boot) — tokens are already cleared.
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/** Calls POST /auth/customer/refresh directly (bypassing the shared `api` instance to dodge interceptor recursion). */
async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = await storage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/customer/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
    );

    const data = response.data?.data ?? response.data;
    const newAccessToken: string | undefined = data?.accessToken;
    const newRefreshToken: string | undefined = data?.refreshToken;

    if (newAccessToken) {
      await storage.setItem(AUTH_TOKEN_KEY, newAccessToken);
      if (newRefreshToken) {
        await storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }

      try {
        const { useAuthStore } = require('@store/useAuthStore') as typeof import('@store/useAuthStore');
        useAuthStore.setState({
          token: newAccessToken,
          refreshToken: newRefreshToken ?? useAuthStore.getState().refreshToken,
        });
        const { realtimeSocket } = require('@services/realtime.socket') as typeof import('@services/realtime.socket');
        realtimeSocket.updateToken(newAccessToken);
      } catch {
        // Stores may not be ready; storage already has the fresh token.
      }

      return newAccessToken;
    }

    return null;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      const method = (response.config.method ?? 'get').toUpperCase();
      const url = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;
      const count = Array.isArray(response.data?.data)
        ? response.data.data.length
        : response.data?.data?.items?.length ??
          (response.data?.data ? 1 : 0);
      console.log(`[api] ← ${response.status} ${method} ${url} items≈${count}`);
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalConfig = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    const isAuthEndpoint = originalConfig?.url?.includes('/auth/customer/');
    const isUnauthorized = error.response?.status === 401;
    const sentAuth = requestHadAuthorization(originalConfig);

    if (__DEV__) {
      const status = error.response?.status;
      const reqUrl = error.config?.url ?? '';
      // Guest 401s (no Bearer token) are expected — don't surface them in LogBox.
      const quietGuest401 = isUnauthorized && !sentAuth;
      // Payment recovery probes older backends that may not have Razorpay routes yet.
      const quietMissingPaymentsRoute =
        status === 404 &&
        /\/payments\/razorpay\/(config|pending|status\/[^/?]+|cancel)(\?|$)/.test(
          reqUrl,
        );
      // Facets is a newer catalog route; production may still 404 until deploy.
      const quietMissingFacetsRoute =
        status === 404 && /\/categories\/[^/]+\/facets(\?|$)/.test(reqUrl);
      if (!quietGuest401 && !quietMissingPaymentsRoute && !quietMissingFacetsRoute) {
        const method = (error.config?.method ?? 'get').toUpperCase();
        const url = `${error.config?.baseURL ?? ''}${reqUrl}`;
        console.warn(
          `[api] ✗ ${status ?? 'NETWORK'} ${method} ${url}`,
          error.response?.data?.message ?? error.message,
        );
      }
    }

    // Guest calls and OTP failures are not session expiry. Only refresh/logout when
    // a request that actually sent a Bearer token was rejected.
    if (
      isUnauthorized &&
      originalConfig &&
      !isAuthEndpoint &&
      sentAuth
    ) {
      if (!originalConfig._retried) {
        originalConfig._retried = true;

        refreshInFlight ??= performTokenRefresh().finally(() => {
          refreshInFlight = null;
        });

        const newToken = await refreshInFlight;

        if (newToken) {
          originalConfig.headers = originalConfig.headers ?? {};
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          try {
            return await api.request(originalConfig);
          } catch (retryError) {
            if (
              axios.isAxiosError(retryError) &&
              retryError.response?.status === 401
            ) {
              await clearSessionAndEnterGuest();
            }
            return Promise.reject(retryError);
          }
        }
      }

      await clearSessionAndEnterGuest();
    }

    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    const isCancelled = axios.isCancel(error) || error.code === 'ERR_CANCELED';
    const isNetwork = !error.response && !isTimeout && !isCancelled;
    const apiError: ApiError = {
      message: isTimeout
        ? 'The server is taking too long to respond. Please try again.'
        : isNetwork
          ? 'Unable to reach Bajriwala. Check your internet connection and try again.'
          : (error.response?.data?.message ?? error.message ?? 'An unexpected error occurred'),
      statusCode: error.response?.status ?? (isTimeout ? 408 : isCancelled ? 499 : 0),
      errors: error.response?.data?.errors,
      code: isTimeout
        ? 'TIMEOUT'
        : isCancelled
          ? 'CANCELLED'
          : isNetwork
            ? 'NETWORK'
            : error.response?.data?.code,
      retryable: error.response?.data?.retryable,
    };

    return Promise.reject(apiError);
  },
);

/** Reads a customer-safe message from either the normalized ApiError or a raw Error. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  const raw = (error as { message?: unknown }).message;
  const message = Array.isArray(raw) ? raw.join(', ') : typeof raw === 'string' ? raw : '';
  return message.trim() || fallback;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  const status =
    (error as { statusCode?: number }).statusCode ??
    (error as { response?: { status?: number } }).response?.status;
  return typeof status === 'number' ? status : undefined;
}

export function isCancelledApiError(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === 'CANCELLED';
}

export { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY };
