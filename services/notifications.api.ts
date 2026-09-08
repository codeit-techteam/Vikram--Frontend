import { api } from '@services/api';
import type { ApiResponse } from '@/types';

export interface CustomerNotificationDto {
  id: string;
  campaignId?: string | null;
  type: string;
  label: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  actionLabel?: string | null;
  actionRoute?: string | null;
  actionVariant?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
export const UNREAD_COUNT_QUERY_KEY = ['notifications', 'unread-count'] as const;

export async function listNotifications(params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  isRead?: boolean;
}): Promise<{ items: CustomerNotificationDto[]; meta: NotificationListMeta }> {
  const { data } = await api.get<
    ApiResponse<{ items: CustomerNotificationDto[]; meta: NotificationListMeta }>
  >('/notifications', {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      search: params?.search || undefined,
      type: params?.type,
      isRead: params?.isRead,
    },
  });
  return data.data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<ApiResponse<{ count: number }>>(
    '/notifications/unread-count',
  );
  return data.data.count;
}

export async function markNotificationRead(
  id: string,
): Promise<CustomerNotificationDto> {
  const { data } = await api.post<ApiResponse<CustomerNotificationDto>>(
    `/notifications/${id}/read`,
  );
  return data.data;
}

export async function markAllNotificationsRead(): Promise<{ updatedCount: number }> {
  const { data } = await api.patch<ApiResponse<{ updatedCount: number }>>(
    '/notifications/read-all',
  );
  return data.data;
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

export async function registerDeviceToken(payload: {
  token: string;
  platform: 'ANDROID' | 'IOS';
  deviceId: string;
  appVersion?: string;
}): Promise<void> {
  await api.post('/notifications/device-token', payload);
}

export async function releaseDeviceToken(payload: {
  token?: string;
  deviceId?: string;
}): Promise<void> {
  await api.post('/notifications/device-token/release', payload);
}
