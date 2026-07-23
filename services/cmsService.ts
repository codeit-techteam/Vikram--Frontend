import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type { CmsHomeResponse } from '@/types/cms';

const CMS_BASE = '/cms';

export async function fetchCmsHome(): Promise<CmsHomeResponse> {
  const { data } = await api.get<ApiResponse<CmsHomeResponse>>(`${CMS_BASE}/home`);
  return data.data;
}

export const cmsService = {
  fetchCmsHome,
};
