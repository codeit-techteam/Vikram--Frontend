/**
 * GST service — API integration layer with mock fallbacks.
 * Wire to backend by implementing the endpoints in gst.api.ts.
 */
import {
  deleteGST as deleteGSTApi,
  fetchGST as fetchGSTApi,
  saveGST as saveGSTApi,
  updateGST as updateGSTApi,
  validateGST as validateGSTApi,
} from '@services/gst.api';
import type { GstDetails, GstValidationResult, SaveGstPayload } from '@/types/gst';

export type { GstDetails, GstValidationResult, SaveGstPayload };

export async function fetchGST(): Promise<GstDetails | null> {
  return fetchGSTApi();
}

export async function saveGST(payload: SaveGstPayload): Promise<GstDetails> {
  return saveGSTApi(payload);
}

export async function updateGST(payload: SaveGstPayload): Promise<GstDetails> {
  return updateGSTApi(payload);
}

export async function deleteGST(): Promise<void> {
  return deleteGSTApi();
}

export async function validateGST(gstNumber: string): Promise<GstValidationResult> {
  return validateGSTApi(gstNumber);
}
