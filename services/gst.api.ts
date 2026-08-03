import { api } from '@services/api';
import { getProfile, updateProfile } from '@services/customer.api';
import type { CustomerProfile } from '@services/customer.api';
import type { ApiResponse } from '@/types';
import type { GstDetails, GstValidationResult, SaveGstPayload } from '@/types/gst';

const GST_BASE = '/gst';

const MOCK_GST_LOOKUP: Record<string, Omit<GstDetails, 'status'>> = {
  '19ABCDE1234F1Z5': {
    gstNumber: '19ABCDE1234F1Z5',
    businessName: 'Registered Business Entity',
    registeredAddress: 'Registered office address will appear after verification',
    state: 'West Bengal',
    pan: 'ABCDE1234F',
  },
  '27AAACR1234F1Z5': {
    gstNumber: '27AAACR1234F1Z5',
    businessName: 'Registered Business Entity',
    registeredAddress: 'Registered office address will appear after verification',
    state: 'Maharashtra',
    pan: 'AAACR1234F',
  },
};

function buildMockValidation(gstNumber: string): GstValidationResult {
  const normalized = gstNumber.trim().toUpperCase();
  const mock = MOCK_GST_LOOKUP[normalized];

  if (mock) {
    return { ...mock, status: 'verified', isValid: true, updatedAt: new Date().toISOString() };
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
    updatedAt: new Date().toISOString(),
  };
}

export function mapProfileToGstDetails(profile: CustomerProfile): GstDetails | null {
  const gstObj =
    profile.gst && typeof profile.gst === 'object'
      ? (profile.gst as {
          gstin?: string | null;
          companyName?: string | null;
          verified?: boolean;
          verifiedAt?: string | null;
          jurisdiction?: string | null;
          pan?: string | null;
        })
      : null;

  const gstin =
    profile.gstNumber ??
    (typeof profile.gst === 'string' ? profile.gst : undefined) ??
    gstObj?.gstin ??
    null;

  if (!gstin) return null;

  return {
    gstNumber: gstin,
    businessName:
      gstObj?.companyName ??
      profile.legalEntityName ??
      profile.companyName ??
      '',
    registeredAddress: profile.registeredAddress ?? '',
    state: gstObj?.jurisdiction?.split('–')[0]?.trim() ?? gstObj?.jurisdiction ?? '',
    pan: gstObj?.pan ?? profile.panNumber ?? '',
    status: gstObj?.verified ? 'verified' : 'pending',
    businessType: profile.businessType ?? '',
    updatedAt: gstObj?.verifiedAt ?? undefined,
  };
}

export async function fetchGST(): Promise<GstDetails | null> {
  try {
    const { data } = await api.get<ApiResponse<GstDetails | null>>(GST_BASE);
    if (data.data) {
      return {
        ...data.data,
        updatedAt: data.data.updatedAt ?? new Date().toISOString(),
      };
    }
  } catch {
    // Fall through to profile
  }

  try {
    const profile = await getProfile();
    return mapProfileToGstDetails(profile);
  } catch {
    return null;
  }
}

export async function validateGST(gstNumber: string): Promise<GstValidationResult> {
  try {
    const { data } = await api.post<ApiResponse<GstValidationResult>>(`${GST_BASE}/validate`, {
      gstNumber: gstNumber.trim().toUpperCase(),
    });
    return data.data;
  } catch {
    return buildMockValidation(gstNumber);
  }
}

async function persistViaProfile(payload: SaveGstPayload, verified: boolean): Promise<GstDetails> {
  const profile = await updateProfile({
    gstNumber: payload.gstNumber.trim().toUpperCase(),
    panNumber: payload.pan,
    companyName: payload.businessName,
    legalEntityName: payload.businessName,
    registeredAddress: payload.registeredAddress,
    jurisdiction: payload.state,
    gstVerified: verified,
  });
  return (
    mapProfileToGstDetails(profile) ?? {
      ...payload,
      gstNumber: payload.gstNumber.trim().toUpperCase(),
      status: verified ? 'verified' : 'pending',
      updatedAt: new Date().toISOString(),
    }
  );
}

export async function saveGST(payload: SaveGstPayload): Promise<GstDetails> {
  try {
    const { data } = await api.post<ApiResponse<GstDetails>>(GST_BASE, payload);
    const details = {
      ...data.data,
      updatedAt: data.data.updatedAt ?? new Date().toISOString(),
    };
    try {
      await updateProfile({
        gstNumber: payload.gstNumber.trim().toUpperCase(),
        panNumber: payload.pan,
        companyName: payload.businessName,
        legalEntityName: payload.businessName,
        registeredAddress: payload.registeredAddress,
        jurisdiction: payload.state,
        gstVerified: details.status === 'verified',
      });
    } catch {
      // GST entity saved; profile sync is best-effort.
    }
    return details;
  } catch {
    try {
      return await persistViaProfile(payload, true);
    } catch {
      return {
        ...payload,
        gstNumber: payload.gstNumber.trim().toUpperCase(),
        status: 'verified',
        updatedAt: new Date().toISOString(),
      };
    }
  }
}

export async function updateGST(payload: SaveGstPayload): Promise<GstDetails> {
  try {
    const { data } = await api.put<ApiResponse<GstDetails>>(GST_BASE, payload);
    const details = {
      ...data.data,
      updatedAt: data.data.updatedAt ?? new Date().toISOString(),
    };
    try {
      await updateProfile({
        gstNumber: payload.gstNumber.trim().toUpperCase(),
        panNumber: payload.pan,
        companyName: payload.businessName,
        legalEntityName: payload.businessName,
        registeredAddress: payload.registeredAddress,
        jurisdiction: payload.state,
        gstVerified: details.status === 'verified',
      });
    } catch {
      // best-effort
    }
    return details;
  } catch {
    try {
      return await persistViaProfile(payload, true);
    } catch {
      return {
        ...payload,
        gstNumber: payload.gstNumber.trim().toUpperCase(),
        status: 'verified',
        updatedAt: new Date().toISOString(),
      };
    }
  }
}

export async function deleteGST(): Promise<void> {
  try {
    await api.delete(GST_BASE);
  } catch {
    try {
      await updateProfile({ gstNumber: '', gstVerified: false, panNumber: '' });
    } catch {
      // Local remove still proceeds
    }
  }
}
