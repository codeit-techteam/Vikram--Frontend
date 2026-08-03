import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type NotificationType =
  | 'logistics'
  | 'payment_due'
  | 'stock_critical'
  | 'site_communication';

export type NotificationFilter = 'all' | 'logistics' | 'payments' | 'inventory' | 'site';

export interface AppNotification {
  id: string;
  type: NotificationType;
  label: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  action?: {
    label: string;
    variant: 'filled' | 'outline';
    route?: string;
  };
}

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  {
    labelColor: string;
    iconName: IoniconName;
    iconBg: string;
    iconColor: string;
    borderColor: string;
  }
> = {
  payment_due: {
    labelColor: '#FEB623',
    iconName: 'cash-outline',
    iconBg: '#FFF4D1',
    iconColor: '#FEB623',
    borderColor: '#FEB623',
  },
  stock_critical: {
    labelColor: '#D32F2F',
    iconName: 'cube-outline',
    iconBg: '#FFEBEE',
    iconColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  site_communication: {
    labelColor: '#2E7D32',
    iconName: 'chatbubble-outline',
    iconBg: '#E8F5E9',
    iconColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  logistics: {
    labelColor: '#1A73E8',
    iconName: 'car-outline',
    iconBg: '#E3F2FD',
    iconColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
};

export const NOTIFICATION_FILTERS: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'logistics', label: 'Logistics' },
  { key: 'payments', label: 'Payments' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'site', label: 'Site Comms' },
];

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'payment_due',
    label: 'PAYMENT DUE',
    title: 'Pending GST Invoice for Order #88294',
    body: 'Invoice for 500 Bags of Portland Cement is ready. Pay before 6:00 PM to avoid dispatch delay.',
    time: '45m ago',
    unread: true,
    action: { label: 'Pay Now', variant: 'filled', route: '/account/gst-compliance' },
  },
  {
    id: 'n2',
    type: 'stock_critical',
    label: 'STOCK CRITICAL',
    title: 'Stock Alert: TMT Steel Bars running low at Site A',
    body: 'Current inventory level: 12 units. Minimum required: 50 units. Project progress may be affected.',
    time: '2h ago',
    unread: true,
    action: { label: 'Refill', variant: 'outline', route: '/(tabs)/catalog' },
  },
  {
    id: 'n3',
    type: 'site_communication',
    label: 'SITE COMMUNICATION',
    title: 'New message from Site Manager Rajesh',
    body: 'Gate 3 will be closed for crane movement until 3 PM. Please coordinate unloading accordingly.',
    time: '5h ago',
    unread: false,
  },
  {
    id: 'n4',
    type: 'logistics',
    label: 'ORDER UPDATE',
    title: 'Out for Delivery',
    body: 'Your order is out for delivery.',
    time: '1d ago',
    unread: true,
    action: { label: 'Track Order', variant: 'outline', route: '/(tabs)/orders' },
  },
];

export function filterNotifications(
  items: AppNotification[],
  query: string,
  filter: NotificationFilter,
): AppNotification[] {
  const normalized = query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'logistics' && item.type === 'logistics') ||
      (filter === 'payments' && item.type === 'payment_due') ||
      (filter === 'inventory' && item.type === 'stock_critical') ||
      (filter === 'site' && item.type === 'site_communication');

    if (!matchesFilter) return false;
    if (!normalized) return true;

    const haystack = `${item.label} ${item.title} ${item.body}`.toLowerCase();
    return haystack.includes(normalized);
  });
}
