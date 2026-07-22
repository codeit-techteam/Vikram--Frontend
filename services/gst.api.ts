import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type { GstDetails, GstValidationResult, SaveGstPayload } from '@/types/gst';

const GST_BASE = '/gst';

const MOCK_GST_LOOKUP: Record<string, Omit<GstDetails, 'status'>> = {
  '19ABCDE1234F1Z5': {
    gstNumber: '19ABCDE1234F1Z5',
    businessName: 'Premier Construction Private Limited',
    registeredAddress: 'Level 5, Sky Tower, BKC G-Block, Mumbai 400051',
    state: 'Maharashtra',
    pan: 'ABCDE1234F',
  },
  '27AAACR1234F1Z5': {
    gstNumber: '27AAACR1234F1Z5',
    businessName: 'Prime Construction Ltd.',
    registeredAddress: 'Plot 42, Industrial Estate, Andheri East, Mumbai 400069',
    state: 'Maharashtra',
    pan: 'AAACR1234F',
  },
};

function buildMockValidation(gstNumber: string): GstValidationResult {
  const normalized = gstNumber.trim().toUpperCase();
  const mock = MOCK_GST_LOOKUP[normalized];

  if (mock) {
    return { ...mock, status: 'verified', isValid: true };
  }

  const stateCode = normalized.slice(0, 2);
  const pan = normalized.slice(2, 12);

  return {
    gstNumber: normalized,
    businessName: 'Registered Business Entity',
    registeredAddress: 'Registered office address will appear after verification',
    state: stateCode === '27' ? 'Maharashtra' : stateCode === '19' ? 'West Bengal' : 'India',
    pan,
    status: 'verified',
    isValid: true,
  };
}

async function withMockFallback<T>(apiCall: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await apiCall();
  } catch {
    return fallback();
  }
}

export async function fetchGST(): Promise<GstDetails | null> {
  return withMockFallback(
    async () => {
      const { data } = await api.get<ApiResponse<GstDetails | null>>(GST_BASE);
      return data.data;
    },
    () => null,
  );
}

export async function validateGST(gstNumber: string): Promise<GstValidationResult> {
  return withMockFallback(
    async () => {
      const { data } = await api.post<ApiResponse<GstValidationResult>>(`${GST_BASE}/validate`, {
        gstNumber: gstNumber.trim().toUpperCase(),
      });
      return data.data;
    },
    () => buildMockValidation(gstNumber),
  );
}

export async function saveGST(payload: SaveGstPayload): Promise<GstDetails> {
  return withMockFallback(
    async () => {
      const { data } = await api.post<ApiResponse<GstDetails>>(GST_BASE, payload);
      return data.data;
    },
    () => ({
      ...payload,
      gstNumber: payload.gstNumber.trim().toUpperCase(),
      status: 'verified',
    }),
  );
}

export async function updateGST(payload: SaveGstPayload): Promise<GstDetails> {
  return withMockFallback(
    async () => {
      const { data } = await api.put<ApiResponse<GstDetails>>(GST_BASE, payload);
      return data.data;
    },
    () => ({
      ...payload,
      gstNumber: payload.gstNumber.trim().toUpperCase(),
      status: 'verified',
    }),
  );
}

export async function deleteGST(): Promise<void> {
  return withMockFallback(
    async () => {
      await api.delete(GST_BASE);
    },
    () => undefined,
  );
}
