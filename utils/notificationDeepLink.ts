import { router, type Href } from 'expo-router';

import { navigateCmsRedirect } from '@utils/cmsAdapters';

export interface NotificationDeepLinkPayload {
  notificationId?: string;
  notificationType?: string;
  deepLink?: string;
  entityId?: string;
  imageUrl?: string;
  actionRoute?: string;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

export function parseNotificationPayload(
  data: Record<string, unknown> | undefined | null,
): NotificationDeepLinkPayload {
  if (!data) return {};
  return {
    notificationId: asString(data.notificationId) ?? asString(data.notification_id),
    notificationType: asString(data.notificationType) ?? asString(data.notification_type),
    deepLink: asString(data.deepLink) ?? asString(data.deep_link),
    entityId: asString(data.entityId) ?? asString(data.entity_id),
    imageUrl: asString(data.imageUrl) ?? asString(data.image_url),
    actionRoute: asString(data.actionRoute) ?? asString(data.action_route),
  };
}

export function navigateNotificationDeepLink(
  payload: NotificationDeepLinkPayload,
): void {
  if (payload.actionRoute) {
    if (payload.actionRoute.startsWith('http://') || payload.actionRoute.startsWith('https://')) {
      router.push(payload.actionRoute as Href);
      return;
    }
    router.push(payload.actionRoute as Href);
    return;
  }

  const target = (payload.deepLink ?? 'home').toLowerCase();
  const entityId = payload.entityId;

  switch (target) {
    case 'home':
      router.push('/(tabs)' as Href);
      return;
    case 'cart':
      router.push('/(tabs)/cart' as Href);
      return;
    case 'notifications':
      router.push('/notifications' as Href);
      return;
    case 'product':
      navigateCmsRedirect('PRODUCT', entityId);
      return;
    case 'category':
      navigateCmsRedirect('CATEGORY', entityId);
      return;
    case 'offer':
      navigateCmsRedirect('OFFER', entityId);
      return;
    case 'order':
      if (entityId) {
        router.push({ pathname: '/orders/view/[orderId]', params: { orderId: entityId } } as Href);
      } else {
        router.push('/(tabs)/orders' as Href);
      }
      return;
    case 'custom':
      if (entityId) {
        router.push(entityId as Href);
      }
      return;
    default:
      if (entityId) {
        navigateCmsRedirect(target.toUpperCase(), entityId);
        return;
      }
      router.push('/(tabs)' as Href);
  }
}
