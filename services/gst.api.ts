import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type {
  CreateGstAccountPayload,
  GstAccount,
  GstDetails,
  GstVerificationResult,
  UpdateGstAccountPayload,
} from '@/types/gst';
import { accountToGstDetails } from '@/types/gst';

const GST_BASE = '/customer/gst';

export async function verifyGstin(gstin: string): Promise<GstVerificationResult> {
  const normalized = gstin.trim().toUpperCase();
  const { data } = await api.post<ApiResponse<GstVerificationResult>>(`${GST_BASE}/verify`, {
    gstin: normalized,
  });
  return data.data;
}

export async function listGstAccounts(): Promise<GstAccount[]> {
  const { data } = await api.get<ApiResponse<GstAccount[]>>(`${GST_BASE}/accounts`);
  return data.data ?? [];
}

export async function getGstAccount(id: string): Promise<GstAccount> {
  const { data } = await api.get<ApiResponse<GstAccount>>(`${GST_BASE}/accounts/${id}`);
  return data.data;
}

export async function createGstAccount(payload: CreateGstAccountPayload): Promise<GstAccount> {
  const { data } = await api.post<ApiResponse<GstAccount>>(`${GST_BASE}/accounts`, {
    gstin: payload.gstin.trim().toUpperCase(),
    verificationToken: payload.verificationToken,
    setAsDefault: payload.setAsDefault,
  });
  return data.data;
}

export async function updateGstAccount(
  id: string,
  payload: UpdateGstAccountPayload,
): Promise<GstAccount> {
  const body: UpdateGstAccountPayload = { ...payload };
  if (body.gstin) body.gstin = body.gstin.trim().toUpperCase();
  const { data } = await api.patch<ApiResponse<GstAccount>>(`${GST_BASE}/accounts/${id}`, body);
  return data.data;
}

export async function setDefaultGstAccount(id: string): Promise<GstAccount> {
  const { data } = await api.patch<ApiResponse<GstAccount>>(
    `${GST_BASE}/accounts/${id}/default`,
  );
  return data.data;
}

export async function archiveGstAccount(id: string): Promise<GstAccount> {
  const { data } = await api.delete<ApiResponse<GstAccount>>(`${GST_BASE}/accounts/${id}`);
  return data.data;
}

/** @deprecated Prefer `listGstAccounts` — returns default or first active account as legacy GstDetails. */
export async function fetchGST(): Promise<GstDetails | null> {
  const accounts = await listGstAccounts();
  const active = accounts.filter((a) => !a.isArchived);
  if (active.length === 0) return null;
  const pick = active.find((a) => a.isDefault) ?? active[0];
  return accountToGstDetails(pick);
}
