import { api } from '@services/api';
import type { ApiResponse } from '@/types';

const CUSTOMER_BASE = '/customer';

export type MembershipPlan = 'silver' | 'gold' | 'platinum' | 'enterprise' | string;

export interface MembershipDetails {
  plan?: MembershipPlan;
  tier?: MembershipPlan;
  name?: string;
  points?: number;
  validTill?: string;
  [key: string]: unknown;
}

export interface WalletDetails {
  balance?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface CustomerAddress {
  id: string;
  label?: string;
  name?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  postalCode?: string;
  phone?: string;
  isDefault?: boolean;
  isPrimary?: boolean;
  type?: 'personal' | 'business' | string;
  [key: string]: unknown;
}

export interface CustomerRole {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

/** Enriched customer profile — union of everything `/customer/profile` may return. */
export interface CustomerProfile {
  id: string;
  phone?: string;
  mobile?: string;
  email?: string;
  name?: string;
  fullName?: string;
  companyName?: string;
  legalEntityName?: string;
  establishmentDate?: string;
  registeredAddress?: string;
  gstNumber?: string;
  gst?:
    | string
    | {
        gstin?: string | null;
        companyName?: string | null;
        verified?: boolean;
        verifiedAt?: string | null;
        jurisdiction?: string | null;
        pan?: string | null;
      };
  panNumber?: string;
  businessType?: string;
  membership?: MembershipPlan;
  membershipDetails?: MembershipDetails;
  wallet?: WalletDetails;
  addresses?: CustomerAddress[];
  profileImage?: string;
  language?: string;
  role?: { id: string; name: string; slug: string } | string | null;
  status?: string;
  profileCompleted?: boolean;
  roleSelected?: boolean;
  [key: string]: unknown;
}

export interface UpdateProfilePayload {
  fullName?: string;
  email?: string;
  companyName?: string;
  legalEntityName?: string;
  establishmentDate?: string;
  registeredAddress?: string;
  gstNumber?: string;
  gstVerified?: boolean;
  jurisdiction?: string;
  panNumber?: string;
  businessType?: string;
  profileImage?: string;
  language?: string;
}

/** Frontend auth role → backend role slug */
export const ROLE_SLUG_MAP: Record<string, string> = {
  individual: 'individual',
  contractor: 'contractor',
  interior_designer: 'interior-designer',
  builder_developer: 'builder',
};

/** GET /customer/roles */
export async function getRoles(): Promise<CustomerRole[]> {
  const { data } = await api.get<ApiResponse<CustomerRole[]>>(`${CUSTOMER_BASE}/roles`);
  return data.data ?? [];
}

/** POST /customer/select-role */
export async function selectRole(roleId: string): Promise<CustomerProfile> {
  const { data } = await api.post<ApiResponse<CustomerProfile>>(
    `${CUSTOMER_BASE}/select-role`,
    { roleId },
  );
  return data.data;
}

/** GET /customer/profile — enriched profile (business, membership, wallet, addresses). */
export async function getProfile(): Promise<CustomerProfile> {
  const { data } = await api.get<ApiResponse<CustomerProfile>>(`${CUSTOMER_BASE}/profile`);
  return data.data;
}

/** PATCH /customer/profile — partial update of the customer profile. */
export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<CustomerProfile> {
  const { data } = await api.patch<ApiResponse<CustomerProfile>>(
    `${CUSTOMER_BASE}/profile`,
    payload,
  );
  return data.data;
}

/** GET /customer/address — saved delivery/billing addresses. */
export async function getAddresses(): Promise<CustomerAddress[]> {
  const { data } = await api.get<ApiResponse<CustomerAddress[]>>(`${CUSTOMER_BASE}/address`);
  return data.data ?? [];
}

/** POST /customer/address — create a new address. */
export async function createAddress(payload: {
  label?: string;
  type?: string;
  address: string;
  line2?: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}): Promise<CustomerAddress> {
  const { data } = await api.post<ApiResponse<CustomerAddress>>(
    `${CUSTOMER_BASE}/address`,
    payload,
  );
  return data.data;
}

/** PATCH /customer/address/:id — update an existing address. */
export async function updateAddress(
  id: string,
  payload: Partial<{
    label: string;
    type: string;
    address: string;
    line2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  }>,
): Promise<CustomerAddress> {
  const { data } = await api.patch<ApiResponse<CustomerAddress>>(
    `${CUSTOMER_BASE}/address/${id}`,
    payload,
  );
  return data.data;
}

/** DELETE /customer/address/:id — remove an address. */
export async function deleteAddress(id: string): Promise<void> {
  await api.delete(`${CUSTOMER_BASE}/address/${id}`);
}

/** PUT /customer/address/default/:id — mark an address as the default. */
export async function setDefaultAddress(id: string): Promise<CustomerAddress> {
  const { data } = await api.put<ApiResponse<CustomerAddress>>(
    `${CUSTOMER_BASE}/address/default/${id}`,
  );
  return data.data;
}
