import { api } from '@services/api';
import type { ApiResponse } from '@/types';

const AUTH_BASE = '/auth/customer';

export interface AuthCustomer {
  id: string;
  phone?: string;
  mobile?: string;
  name?: string;
  fullName?: string;
  email?: string;
  companyName?: string;
  membership?: string;
  profileImage?: string;
  role?: string;
  roleSelected?: boolean;
  profileCompleted?: boolean;
  [key: string]: unknown;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  customer: AuthCustomer;
  isNewCustomer?: boolean;
}

export interface SendOtpResponse {
  message?: string;
  expiresIn?: number;
}

/** POST /auth/customer/send-otp — request an OTP for a mobile number. */
export async function sendOtp(mobile: string): Promise<SendOtpResponse> {
  const { data } = await api.post<ApiResponse<SendOtpResponse>>(`${AUTH_BASE}/send-otp`, {
    mobile,
  });
  return data.data ?? {};
}

/** POST /auth/customer/verify-otp — verify OTP and start a session. */
export async function verifyOtp(mobile: string, otp: string): Promise<AuthSession> {
  const { data } = await api.post<ApiResponse<AuthSession & { token?: string }>>(
    `${AUTH_BASE}/verify-otp`,
    {
      mobile,
      otp,
    },
  );
  const payload = data.data;
  return {
    ...payload,
    accessToken: payload.accessToken ?? payload.token ?? '',
  };
}

/** POST /auth/customer/login — alternate/legacy login-by-OTP endpoint (same contract as verify-otp). */
export async function login(mobile: string, otp: string): Promise<AuthSession> {
  const { data } = await api.post<ApiResponse<AuthSession & { token?: string }>>(
    `${AUTH_BASE}/login`,
    {
      mobile,
      otp,
    },
  );
  const payload = data.data;
  return {
    ...payload,
    accessToken: payload.accessToken ?? payload.token ?? '',
  };
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

/** POST /auth/customer/refresh — exchange a refresh token for a new access token. */
export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  const { data } = await api.post<ApiResponse<RefreshResponse>>(`${AUTH_BASE}/refresh`, {
    refreshToken,
  });
  return data.data;
}

/** POST /auth/customer/logout — invalidate the refresh token server-side. */
export async function logout(refreshToken: string | null): Promise<void> {
  if (!refreshToken) return;
  await api.post(`${AUTH_BASE}/logout`, { refreshToken });
}

/** GET /auth/customer/me — lightweight identity check (id/phone/basic flags). */
export async function getMe(): Promise<AuthCustomer> {
  const { data } = await api.get<ApiResponse<AuthCustomer>>(`${AUTH_BASE}/me`);
  return data.data;
}
