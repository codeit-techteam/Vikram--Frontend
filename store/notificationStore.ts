import { create } from 'zustand';

import { NOTIFICATIONS } from '@constants/notificationData';

function countUnread(readIds: string[], deletedIds: string[]): number {
  return NOTIFICATIONS.filter(
    (n) => n.unread && !readIds.includes(n.id) && !deletedIds.includes(n.id),
  ).length;
}

interface NotificationState {
  unreadCount: number;
  orderNotifications: number;
  readIds: string[];
  deletedIds: string[];
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  isRead: (id: string) => boolean;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: countUnread([], []),
  orderNotifications: 3,
  readIds: [],
  deletedIds: [],
  markAsRead: (id) => {
    const { readIds } = get();
    if (readIds.includes(id)) return;
    const next = [...readIds, id];
    set({ readIds: next, unreadCount: countUnread(next, get().deletedIds) });
  },
  markAllRead: () =>
    set({
      readIds: NOTIFICATIONS.map((n) => n.id),
      unreadCount: 0,
      orderNotifications: 0,
    }),
  deleteNotification: (id) => {
    const { deletedIds, readIds } = get();
    if (deletedIds.includes(id)) return;
    const nextDeleted = [...deletedIds, id];
    set({
      deletedIds: nextDeleted,
      unreadCount: countUnread(readIds, nextDeleted),
    });
  },
  isRead: (id) => get().readIds.includes(id),
  reset: () =>
    set({
      readIds: [],
      deletedIds: [],
      unreadCount: countUnread([], []),
      orderNotifications: 3,
    }),
}));
