/**
 * GST service — thin facade over production customer/gst APIs.
 */
import {
  archiveGstAccount,
  createGstAccount,
  fetchGST as fetchGSTApi,
  listGstAccounts,
  verifyGstin,
} from '@services/gst.api';
import {
  accountToGstDetails,
  verificationToValidationResult,
  type GstDetails,
  type GstValidationResult,
  type GstVerificationResult,
  type SaveGstPayload,
} from '@/types/gst';

export type {
  GstAccount,
  GstDetails,
  GstValidationResult,
  GstVerificationResult,
  SaveGstPayload,
} from '@/types/gst';

export {
  verifyGstin,
  listGstAccounts,
  getGstAccount,
  createGstAccount,
  updateGstAccount,
  setDefaultGstAccount,
  archiveGstAccount,
} from '@services/gst.api';

export async function fetchGST(): Promise<GstDetails | null> {
  return fetchGSTApi();
}

export async function validateGST(gstNumber: string): Promise<GstValidationResult> {
  const result = await verifyGstin(gstNumber);
  return verificationToValidationResult(result);
}

/** Legacy save — requires verificationToken on the validation result (from verify step). */
export async function saveGSTFromVerification(
  result: GstValidationResult,
  setAsDefault?: boolean,
): Promise<GstDetails> {
  if (!result.verificationToken) {
    throw new Error('GST verification token missing. Verify GSTIN before saving.');
  }
  if (!result.verified && result.status !== 'verified') {
    throw new Error('GSTIN is not verified.');
  }
  const account = await createGstAccount({
    gstin: result.gstNumber,
    verificationToken: result.verificationToken,
    setAsDefault,
  });
  return accountToGstDetails(account);
}

/** @deprecated Use `saveGSTFromVerification` after verify. */
export async function saveGST(_payload: SaveGstPayload): Promise<GstDetails> {
  throw new Error('saveGST requires verification. Use verifyGstin and createGstAccount.');
}

/** @deprecated Use account update flows. */
export async function updateGST(_payload: SaveGstPayload): Promise<GstDetails> {
  throw new Error('updateGST requires verification. Use gst accounts APIs.');
}

export async function deleteGST(accountId?: string): Promise<void> {
  if (accountId) {
    await archiveGstAccount(accountId);
    return;
  }
  const accounts = await listGstAccounts();
  const pick = accounts.find((a) => a.isDefault && !a.isArchived) ?? accounts[0];
  if (!pick) return;
  await archiveGstAccount(pick.id);
}
