import { create } from 'zustand';

import { NOTIFICATIONS } from '@constants/notificationData';

function countUnread(readIds: string[]): number {
  return NOTIFICATIONS.filter((n) => n.unread && !readIds.includes(n.id)).length;
}

interface NotificationState {
  unreadCount: number;
  orderNotifications: number;
  readIds: string[];
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  isRead: (id: string) => boolean;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: countUnread([]),
  orderNotifications: 3,
  readIds: [],
  markAsRead: (id) => {
    const { readIds } = get();
    if (readIds.includes(id)) return;
    const next = [...readIds, id];
    set({ readIds: next, unreadCount: countUnread(next) });
  },
  markAllRead: () =>
    set({
      readIds: NOTIFICATIONS.map((n) => n.id),
      unreadCount: 0,
      orderNotifications: 0,
    }),
  isRead: (id) => get().readIds.includes(id),
  reset: () =>
    set({
      readIds: [],
      unreadCount: countUnread([]),
      orderNotifications: 3,
    }),
}));
