import { api } from '@services/api';
import type { ApiResponse } from '@/types';

const BASE = '/customer';

export type SiteType =
  | 'CONSTRUCTION_SITE'
  | 'WAREHOUSE'
  | 'OFFICE'
  | 'FACTORY'
  | 'RESIDENCE';

export interface DeliverySite {
  id: string;
  customerId: string;
  siteName: string;
  siteType?: SiteType | null;
  contactPerson?: string | null;
  phone?: string | null;
  fullAddress: string;
  landmark?: string | null;
  gateNumber?: string | null;
  floor?: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  deliveryNotes?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  ordersDelivered?: number;
}

export interface CreateSitePayload {
  siteName: string;
  siteType?: SiteType;
  contactPerson?: string;
  phone?: string;
  fullAddress: string;
  landmark?: string;
  gateNumber?: string;
  floor?: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  latitude: number;
  longitude: number;
  deliveryNotes?: string;
  isPrimary?: boolean;
}

export type UpdateSitePayload = Partial<CreateSitePayload>;

export const SITE_TYPE_OPTIONS: { value: SiteType; label: string }[] = [
  { value: 'CONSTRUCTION_SITE', label: 'Construction Site' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'FACTORY', label: 'Factory' },
  { value: 'RESIDENCE', label: 'Residence' },
];

export function formatSiteType(type?: SiteType | null): string {
  return SITE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? 'Site';
}

/** GET /customer/sites */
export async function getSites(): Promise<DeliverySite[]> {
  const { data } = await api.get<ApiResponse<DeliverySite[]>>(`${BASE}/sites`);
  return data.data ?? [];
}

/** GET /customer/current-site */
export async function getCurrentSite(): Promise<DeliverySite | null> {
  const { data } = await api.get<ApiResponse<DeliverySite | null>>(
    `${BASE}/current-site`,
  );
  return data.data ?? null;
}

/** POST /customer/sites */
export async function createSite(
  payload: CreateSitePayload,
): Promise<DeliverySite> {
  const { data } = await api.post<ApiResponse<DeliverySite>>(
    `${BASE}/sites`,
    payload,
  );
  return data.data;
}

/** PUT /customer/sites/:id */
export async function updateSite(
  id: string,
  payload: UpdateSitePayload,
): Promise<DeliverySite> {
  const { data } = await api.put<ApiResponse<DeliverySite>>(
    `${BASE}/sites/${id}`,
    payload,
  );
  return data.data;
}

/** DELETE /customer/sites/:id */
export async function deleteSite(id: string): Promise<void> {
  await api.delete(`${BASE}/sites/${id}`);
}

/** PATCH /customer/sites/:id/primary */
export async function setPrimarySite(id: string): Promise<DeliverySite> {
  const { data } = await api.patch<ApiResponse<DeliverySite>>(
    `${BASE}/sites/${id}/primary`,
  );
  return data.data;
}
