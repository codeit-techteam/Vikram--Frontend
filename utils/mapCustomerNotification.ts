import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import type { CustomerNotificationDto } from '@services/notifications.api';
import type { AppNotification, NotificationType } from '@constants/notificationData';

dayjs.extend(relativeTime);

export function mapBackendType(type: string): NotificationType {
  switch (type) {
    case 'ORDER':
    case 'DELIVERY':
      return 'logistics';
    case 'PAYMENT':
      return 'payment_due';
    case 'OFFER':
    case 'BANNER':
    case 'ADMIN_ANNOUNCEMENT':
      return 'promotional';
    case 'MEMBERSHIP':
    case 'LOYALTY':
    case 'SYSTEM':
      return 'site_communication';
    default:
      return 'site_communication';
  }
}

export function mapCustomerNotification(
  dto: CustomerNotificationDto,
): AppNotification {
  return {
    id: dto.id,
    type: mapBackendType(dto.type),
    label: dto.label || dto.type.replace(/_/g, ' '),
    title: dto.title,
    body: dto.body,
    imageUrl: dto.imageUrl ?? undefined,
    time: dayjs(dto.createdAt).fromNow(),
    unread: !dto.isRead,
    action: dto.actionLabel
      ? {
          label: dto.actionLabel,
          variant: dto.actionVariant === 'filled' ? 'filled' : 'outline',
          route: dto.actionRoute ?? undefined,
        }
      : dto.actionRoute
        ? {
            label: 'Open',
            variant: 'outline',
            route: dto.actionRoute,
          }
        : undefined,
  };
}

export function backendTypeForFilter(
  filter: 'all' | 'logistics' | 'payments' | 'inventory' | 'site',
): string | undefined {
  if (filter === 'logistics') return 'ORDER';
  if (filter === 'payments') return 'PAYMENT';
  if (filter === 'inventory') return undefined;
  if (filter === 'site') return 'ADMIN_ANNOUNCEMENT';
  return undefined;
}
