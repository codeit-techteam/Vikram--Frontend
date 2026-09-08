import { create } from 'zustand';

import {
  deleteNotification as deleteNotificationApi,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@services/notifications.api';

interface NotificationState {
  unreadCount: number;
  orderNotifications: number;
  readIds: string[];
  deletedIds: string[];
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  isRead: (id: string) => boolean;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  orderNotifications: 0,
  readIds: [],
  deletedIds: [],
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  refreshUnreadCount: async () => {
    try {
      const count = await getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // Keep last known count if offline.
    }
  },
  markAsRead: async (id) => {
    const { readIds, unreadCount } = get();
    if (readIds.includes(id)) return;
    set({
      readIds: [...readIds, id],
      unreadCount: Math.max(0, unreadCount - 1),
    });
    try {
      await markNotificationRead(id);
      await get().refreshUnreadCount();
    } catch {
      // Optimistic local read still stands.
    }
  },
  markAllRead: async () => {
    set({ unreadCount: 0, orderNotifications: 0 });
    try {
      await markAllNotificationsRead();
    } catch {
      // Ignore network errors; UI already cleared.
    }
  },
  deleteNotification: async (id) => {
    const { deletedIds, readIds, unreadCount } = get();
    if (deletedIds.includes(id)) return;
    const wasUnread = !readIds.includes(id);
    set({
      deletedIds: [...deletedIds, id],
      unreadCount: wasUnread ? Math.max(0, unreadCount - 1) : unreadCount,
    });
    try {
      await deleteNotificationApi(id);
    } catch {
      // Keep local hide if the server rejects (e.g. global rows).
    }
  },
  isRead: (id) => get().readIds.includes(id),
  reset: () =>
    set({
      readIds: [],
      deletedIds: [],
      unreadCount: 0,
      orderNotifications: 0,
    }),
}));
