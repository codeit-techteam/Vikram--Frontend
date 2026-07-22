import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { storage } from '@lib/storage';
import type { ApiError } from '@/types';

const AUTH_TOKEN_KEY = 'auth_token';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
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

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      await storage.removeItem(AUTH_TOKEN_KEY);
    }

    const apiError: ApiError = {
      message: error.response?.data?.message ?? error.message ?? 'An unexpected error occurred',
      statusCode: error.response?.status ?? 500,
      errors: error.response?.data?.errors,
    };

    return Promise.reject(apiError);
  },
);

export { AUTH_TOKEN_KEY };
