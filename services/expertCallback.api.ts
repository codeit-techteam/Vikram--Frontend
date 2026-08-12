import { api } from '@services/api';
import type { ApiResponse } from '@/types';

export type ExpertCallbackStatus = 'NEW' | 'CONTACTED' | 'CLOSED';

export interface CreateExpertCallbackPayload {
  name: string;
  needs: string;
  categorySlug?: string;
  categoryName?: string;
}

export interface ExpertCallbackRequest {
  id: string;
  contactName: string;
  needs: string;
  phoneSnapshot?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  status: ExpertCallbackStatus;
  createdAt: string;
}

export async function submitExpertCallback(
  payload: CreateExpertCallbackPayload,
): Promise<ExpertCallbackRequest> {
  const { data } = await api.post<ApiResponse<ExpertCallbackRequest>>(
    '/expert-callbacks',
    payload,
  );
  return data.data;
}
