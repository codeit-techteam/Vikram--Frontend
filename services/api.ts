import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { storage } from '@lib/storage';
import type { ApiError } from '@/types';
import { resolveApiBaseUrl } from '@utils/resolveApiBaseUrl';

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
      { headers: { 'Content-Type': 'application/json' } },
    );

    const data = response.data?.data ?? response.data;
    const newAccessToken: string | undefined = data?.accessToken;
    const newRefreshToken: string | undefined = data?.refreshToken;

    if (!newAccessToken) return null;

    await storage.setItem(AUTH_TOKEN_KEY, newAccessToken);
    if (newRefreshToken) {
      await storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    }

    return newAccessToken;
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
    if (__DEV__) {
      const method = (error.config?.method ?? 'get').toUpperCase();
      const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
      console.warn(
        `[api] ✗ ${error.response?.status ?? 'NETWORK'} ${method} ${url}`,
        error.response?.data?.message ?? error.message,
      );
    }

    const originalConfig = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    const isAuthEndpoint = originalConfig?.url?.includes('/auth/customer/');

    if (error.response?.status === 401 && originalConfig && !originalConfig._retried && !isAuthEndpoint) {
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
          // fall through to session-expired handling below if retry also fails with 401
          if (
            axios.isAxiosError(retryError) &&
            retryError.response?.status === 401
          ) {
            await clearSessionAndEnterGuest();
          }
          return Promise.reject(retryError);
        }
      }

      await clearSessionAndEnterGuest();
    } else if (error.response?.status === 401) {
      await clearSessionAndEnterGuest();
    }

    const apiError: ApiError = {
      message: error.response?.data?.message ?? error.message ?? 'An unexpected error occurred',
      statusCode: error.response?.status ?? 500,
      errors: error.response?.data?.errors,
    };

    return Promise.reject(apiError);
  },
);

export { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY };
